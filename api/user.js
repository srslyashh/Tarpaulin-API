const db = require("../lib/database");
const auth = require("../lib/authentication");
const Users = require("../model/users").model;
const Courses = require("../model/courses").model;

module.exports = (app) => {
    // TODO: Only let admin users create other admin and instructor users
    app.post("/users", async (req, res) => {
        const isAdmin = await auth.isAdmin(req);
        if (
            (req.body.role === "admin" || req.body.role === "instructor") &&
            !isAdmin
        ) {
            res.status(403).send({
                error: "Invalid authentication to create privileged user",
            });
            return;
        }
        const user = await db.save(Users, new Users(req.body), res);
        if (!user) return;
        res.status(201).send({ id: user.id });
    });

    /*
        note: Authenticate a specific User with their email address and password.
     */
    app.post("/users/login", async (req, res) => {
        // Check body
        if (!req.body || !req.body.email || !req.body.password) {
            res.status(400).send({ error: `Invalid login body` });
            return;
        }
        // Catch any server errors
        try {
            // Find the user and check if password is valid
            let user = await Users.findOne({ email: req.body.email })
                .select("password")
                .exec();
            if (!(await auth.isPasswordValid(user, req.body.password))) {
                res.status(401).send({
                    error: `Invalid authentication credentials`,
                });
                return;
            }
            // If valid, generate and auth token and return it
            const token = auth.generateAuthToken(user);
            res.status(200).send({ token: token });
        } catch {
            res.status(500).send({
                error: `Error logging in, try again later`,
            });
            return;
        }
    });
    /*
        ==REQUIREMENTS:
        Returns information about the specified User.
        > If the User has the 'instructor' role, the response should include a list of the IDs of the Courses the User teaches
            (i.e. Courses whose instructorId field matches the ID of this User).
        > If the User has the 'student' role, the response should include a list of the IDs of the Courses the User is enrolled in.
            Only an authenticated User whose ID matches the ID of the requested User can fetch this information.
     */
    app.get("/users/:id", async (req, res) => {
        const user = await db.find(Users, req.params.id, res);
        if (!user) return;
        if (user.role === "instructor") {
            const verify = await auth.isInstructorId(req)
            console.log("HERE")
            if(verify === false)
            {
              res.status(403).send({
                error: "You shall not pass"
              })
            }
            const result = await Courses.find({ instructorId: user.id });
            res.status(200).send({
                user: user,
                courses: result,
            });
        } else if (user.role === "student") {
            const verify = await auth.isStudentId(req)
            console.log("HERE")
            if(verify === false)
            {
              res.status(403).send({
                error: "You shall not pass"
              })
            }
            const result = await Courses.find({ students: [user.id] }).select("-students");
            res.status(200).send({
                user: user,
                courses: result,
            });
        } else {
            res.status(200).send({
                user: user
            });
        }
    });
};
