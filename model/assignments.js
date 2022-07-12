const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    courseId: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    points: {
        type: Number, // Integer!
        required: true,
    },
    due: {
        type: Date,
        required: true,
    },
});

module.exports = {
    model: mongoose.model("Assignment", schema),
};
