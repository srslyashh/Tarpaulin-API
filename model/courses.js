const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    subject: {
        type: String,
        required: true,
    },
    number: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    term: {
        type: String,
        required: true,
    },
    instructorId: {
        type: String,
        required: true,
    },
    students: [String]
});

module.exports = {
    model: mongoose.model("Course", schema),
};
