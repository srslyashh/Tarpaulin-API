const db = require("../lib/database");
const auth = require("../lib/authentication");

const Courses = require("../model/courses").model;
const Submissions = require("../model/submissions").model;
const Assignments = require("../model/assignments").model;
const Users = require("../model/users").model;

const ObjectId = require('mongoose').Types.ObjectId;
let converter = require('json-2-csv');

module.exports = (app) => {
    /*
       Function: Fetch the list of all Courses
       url: localhost:3000/courses/

      == PAGINATION REQUIRED (completed)
      == The courses returned should not contain the list of students enrolled
    */
    app.get("/courses/", async (req, res) => {
        var pageNum = parseInt(req.query.page) || 1
        const result = await db.getByPage(Courses, pageNum, res, "-students");
        if (!result) return;
        res.status(200).send({
            course: result
        });
    });


    /*
       Function: Fetch data about a specific course
       url: localhost:3000/courses/:id

       The information on the course returned excludes the list of students enrolled in the course
       and the list of Assignments for the course.
    */
    app.get("/courses/:id", async (req, res) => {
        const id = req.params.id;
        const data = await Courses.find({_id: id}).select("-students")
        console.log("data: ", data);
        if (data) {
            res.status(200).send({
                course: data
            });
        }
        return;
    });

    /*
        Function: Fetch a list of the students enrolled in the Course
        url: localhost:3000/courses/:id/students

        Returns a list containing the User IDs of all students currently enrolled in the Course.
    */
    app.get("/courses/:id/students", async (req, res) => {
        /*
            AUTHENTICATION REQUIRED:
            Only an authenticated User with 'admin' role or an authenticated 'instructor' User whose ID
            matches the instructorId of the Course can fetch the list of enrolled students.
         */
        const isAdmin = await auth.isAdmin(req);
        const isInstructor = await auth.isInstructor(req, req.params.id);
        if (!isAdmin && !isInstructor) {
            res.status(403).send({error: "You shall not pass"})
            return;
        }
        const course = await db.find(Courses, req.params.id, res);
        console.log(course)
        if (!course) return;
        try {
            // This will throw an error if ANY of the student's IDs is invalid
            const users = await Users.find({_id: course.students});
            res.status(200).send({
                students: users
            });
        } catch {
            res.status(500).send({err: "Server error finding students"});
        }
    });

    /*
        Function: Fetch a CSV file containing list of the students enrolled in the Course
        url: localhost:3000/courses/:id/assignments

        Returns a CSV file containing information about all of the students currently enrolled in the Course, including names,
        IDs, and email addresses.
    */
    app.get("/courses/:id/roster", async (req, res) => {
        const isAdmin = await auth.isAdmin(req);
        const isInstructor = await auth.isInstructor(req, req.params.id);
        if (!isAdmin && !isInstructor) {
            res.status(403).send({error: "You shall not pass"})
            return;
        }
        const course = await db.find(Courses, req.params.id, res);
        if (!course) return;

        try {
            // This will throw an error if ANY of the student's IDs is invalid
            const users = await Users.find({_id: course.students}).exec();
            console.log(users);
            try {
                converter.json2csv(users, function (err, csv) {
                    res.setHeader("content-type", "text/csv");
                    res.status(200).send(csv);
                },
                {
                    prependHeader: false,
                    keys: ["_id", "name", "email"],
                });
            } catch {
                res.status(500).send({err: "Server error generating CSV roster"});
            }
        } catch {
            res.status(500).send({err: "Server error finding students"});
        }
        return;
    });

    /*
       Function: Fetch a list of all the Assignments for the Course
       url: localhost:3000/courses/:id/assignments

       Returns a list containing the Assignment IDs of all Assignments for the Course.
    */
    app.get("/courses/:id/assignments", async (req, res) => {
        const id = req.params.id;
        const result = await Assignments.find({courseId: id}).exec();
        if (result) {
            res.status(200).send({
                result: result
            });
        } else {
            res.status(404).send({
                msg: "No assignments exist for that particular course.",
            });
        }
        return;
    });

    /*
       Function: Create a new course
       url: localhost:3000/courses
    */
    app.post("/courses", async (req, res) => {
        /*
        AUTHENTICATION REQUIRED:
        Only an authenticated User with 'admin' role can create a new Course.
      */
        const isAdmin = await auth.isAdmin(req);
        const course = await db.save(Courses, new Courses(req.body), res);

        if (!course && !isAdmin) return;
        res.status(201).send({ id: course._id });
    });

    /*
       Function: Update enrollment for a Course
       url: localhost:3000/courses/:id/students

       Enrolls and/or unenrolls students from a Course.
    */
    app.post("/courses/:id/students", async (req, res) => {
        /*
            AUTHENTICATION REQUIRED:
            Only an authenticated User with 'admin' role or an authenticated 'instructor' User whose ID
            matches the instructorId of the Course can update the students enrolled in the Course.
         */
        const isAdmin = await auth.isAdmin(req);
        const isInstructor = await auth.isInstructor(req, req.params.id);
        if (!isAdmin && !isInstructor) {
            res.status(403).send({error: "You shall not pass"})
            return;
        }
        // Requires they send both add and remove
        if (!req.body.add || !req.body.remove) res.status(400).send({ error: "Invalid body" });
        const course = await db.find(Courses, req.params.id, res);
        if (!course) return;
        for (const user of req.body.add) {
            // Checks if user is a valid ObjectId, then checks if it exists
            if (ObjectId.isValid(user) && await Users.exists({_id: user}))
                course.students.addToSet(user); // Use addToSet to avoid duplicates
        }
        // Remove students
        course.students = course.students.filter(i => !req.body.remove.includes(i));
        course.save();
        res.status(200).send();
        return;
    });

    /*
       Function: Update data for a specific Course
       url: localhost:3000/courses/:id

       NOTE: Enrolled students and assignments cannot be modified with this endpoint
    */
    app.patch("/courses/:id", async (req, res) => {
        const id = req.params.id;
        const isAdmin = await auth.isAdmin(req);
        const isInstructor = await auth.isInstructor(req, id);
        if (!isAdmin && !isInstructor) {
            res.status(403).send({error: "You shall not pass"})
            return;
        }
        const result = await db.find(Courses, id, res);
        const body = req.body;
        if(result) {
            if(body && (body.subject || body.number
                || body.title || body.term)) {
                const subject = body.subject || result.subject;
                const number = body.number || result.number;
                const title = body.title || result.title;
                const term = body.term || result.term;
                const update = {
                    subject: subject,
                    number:  number,
                    title: title,
                    term: term
                }
                const oldDocument = await Courses.updateOne({ _id: id }, update)

                res.status(204).send({});
            }
            else {
                res.status(400).send({
                    err: "The request body was either not present or did not contain any fields related to Course objects."
                });
            }
        }
        return;
    });

    /*
       Function: Remove a specific Course from the database
       url: localhost:3000/courses/:id

       Completely removes the data for the specified Course, including all enrolled students, all Assignments, etc.
    */
    app.delete("/courses/:id", async (req, res) => {
        const isAdmin = auth.isAdmin(req);
        const courseId = req.params.id;
        const courseResult = await db.find(Courses, courseId, res);
        if (!courseResult && !isAdmin) return;
        courseResult.remove();

        // delete the assignments:
        Assignments.deleteMany({ courseId: courseId }, function(err){
          if(err)
          {
            console.log(err)
          }
          console.log("Successful deletion of assignments")
        })


        // delete the Submissions:
        Submissions.deleteMany({ courseId: courseId }, function(err){
          if(err)
          {
            console.log(err)
          }
          console.log("Successful deletion of submissions")
        })

        // STILL NEED TO DO:
        // Delete the students

        res.status(204).send({
            id: courseId,
        });
        return;
    });
};
