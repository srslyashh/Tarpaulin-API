const multer = require("multer");
const crypto = require("crypto");
const mongoose = require("mongoose");
const gridfs = require("mongoose-gridfs");
const fs = require("fs");
const db = require("../lib/database");
const submissions = require * "../model/submissions";

const fileTypes = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "text/plain": "txt",
    "application/pdf": "pdf",
};

const upload = multer({
    storage: multer.diskStorage({
        destination: `${__dirname}/uploads`,
        filename: function (req, file, callback) {
            const ext = fileTypes[file.mimetype];
            const filename = crypto.pseudoRandomBytes(16).toString("hex");
            callback(null, `${filename}.${ext}`);
        },
    }),
    fileFilter: function (req, file, callback) {
        callback(null, !!fileTypes[file.mimetype]);
    },
});

function removeUploadedFile(file) {
    return new Promise((resolve, reject) => {
        fs.unlink(file.path, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function getFile(filename) {
    const writeStream = fs.createWriteStream(filename);
    const readStream = getBucket(bucket).createReadStream({
        filename: filename,
    });
    readStream.pipe(writeStream);
    return readStream;
}

// Responds to client with requested image
const sendFile = (collection) => {
    return async (req, res, next) => {
        const submission = await db.find(
            submissions,
            req.params.filename.split(".")[0],
            res
        );
        if (submission == false) return;
        getFile(submission.URL, collection)
            .on("file", (file) => {
                res.status(200).type(file.metadata.contentType);
                removeUploadedFile({ path: file.filename });
                next();
            })
            .on("error", () => {
                res.status(400);
                return;
            })
            .pipe(res);
    };
};

// Saves a file
function saveFile(file, bucket) {
    return new Promise((resolve, reject) => {
        const writeStream = getBucket(bucket).createWriteStream({
            filename: file.filename,
            metadata: file.metadata,
        });
        fs.createReadStream(file.path)
            .pipe(writeStream)
            .on("error", (err) => {
                reject(err);
            })
            .on("finish", (result) => {
                resolve(result._id);
            });
    });
}

// Generates bucket object on demand if they do not exist
let bucket = null;
function getBucket() {
    if (!bucket) {
        bucket = gridfs.createBucket({
            bucketName: "uploads",
            connection: mongoose.connections[0],
        });
    }
    return bucket;
}
module.exports = {
    fileTypes: fileTypes,
    removeUploadedFile: removeUploadedFile,
    upload: upload,
    sendFile: sendFile,
    saveFile: saveFile,
};
