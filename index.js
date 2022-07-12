require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const bearerToken = require("express-bearer-token");

app.use(express.json());
app.use(bearerToken());
// Check the environment for a port, if it is invalid or missing use 3000 as default
const port = Number(process.env.PORT) || 3001;

// Startup message
app.listen(port, () => {
    console.log("Server is listening on port", port);
});

// Log all reqeusts
app.use((req, res, next) => {
    console.log("== Request received");
    console.log("  - Method:", req.method);
    console.log("  - URL:", req.url);
    next();
});

require("./api/user")(app);
require("./api/assignments")(app);
require("./api/courses")(app);

const url = `mongodb://${process.env.USERNAME}:${process.env.PASSWORD}@${process.env.HOSTNAME}:${process.env.PORT_DATABASE}/${process.env.DATABASE}`;
console.log("Connecting to database at: " + url);
mongoose.connect(url);

// 404 error
app.use((req, res) => {
    res.status(404).send({
        err: "This URL was not recognized: " + req.originalUrl,
    });
});
