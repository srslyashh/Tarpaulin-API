const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Users = require("../model/users").model;
const Courses = require("../model/courses").model;

const secret = process.env.JWT_SECRET;

function isPasswordValid(user, password) {
    return user && bcrypt.compareSync(password, user.password);
}

function generateAuthToken(user) {
    return jwt.sign({ sub: user._id }, secret, { expiresIn: "24h" });
}

async function isAdmin(req) {
    const user = await getUser(req);
    if (!user) return false;
    return user.role == "admin";
}

/*
  function:
    Checks whether authentication for user is valid and if
    that user is enrolled in that course.
*/
async function isStudent(req, courseId){
  const user = await getUser(req)
  if(!user) return false;

  const enrolled = await Courses.findOne({ _id: courseId})
  const studentsEnrolled = enrolled.students
  const found = studentsEnrolled.includes(user._id);

  return found
}

async function isInstructorId(req)
{
  const user = await getUser(req)
  if(!user) return false;
  const returnVal = user.role === 'instructor' ? true : false

  return returnVal
}

async function isStudentId(req)
{
  const user = await getUser(req)
  if(!user) return false;
  const returnVal = user.role === 'student' ? true : false

  return returnVal
}

async function getUserId(req, courseId)
{
  const user = await getUser(req)
  if(!user) return false;
  return user._id
}

async function isInstructor(req, courseId) {
    const user = await getUser(req);
    if (!user) return false;
    const course = await Courses.findOne({_id: courseId, instructorId: user._id});
    return Boolean(course);
}

module.exports = {
    isPasswordValid: isPasswordValid,
    generateAuthToken: generateAuthToken,
    isAdmin: isAdmin,
    isInstructor: isInstructor,
    isStudent: isStudent,
    getUserId: getUserId,
    isInstructorId: isInstructorId,
    isStudentId: isStudentId,
};

async function getUser(req) {
    try {
        const payload = jwt.verify(req.token, secret);
        return await Users.findOne({_id: payload.sub});
    } catch {
        return false;
    }
}
