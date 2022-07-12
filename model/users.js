const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Function to hash incoming passwords
const hash = (password) => {
    if (!password) return password;
    return bcrypt.hashSync(password, 8);
};

const schema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, // Require emails to be unique
    },
    password: {
        type: String,
        required: true,
        set: hash, // Always hash the password when set
        select: false, // Do not select the password in queries by default
    },
    role: {
        type: String,
        required: true,
        enum: ["admin", "instructor", "student"], // Enforce roles
        default: "student",
    },
});

module.exports = {
    model: mongoose.model("User", schema),
};
