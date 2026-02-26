const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
    Firstname: {
        type: String,
        required: true
    },
    Lastname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    number: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    roles: {
        type: [String],
        enum: ["SuperAdmin", "Admin", "MittingAdmin"],
        required: true
    },
})
module.exports = mongoose.model('Admin', AdminSchema);
