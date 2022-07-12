const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    assignmentId: {
        type: String,
        required: true,
    },
    studentId: {
        type: String,
        required: true,
    },
    courseId: {
        type: String,
        required: true 
    },
    timestamp: {
        type: Date,
        required: true,
    },
    grade: {
        type: Number,
    },
    file: {
        type: String,
        required: true,
    },
});

module.exports = {
    model: mongoose.model("Submission", schema),
};
