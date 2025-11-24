// models/Admin.js
import mongoose, { Schema, models } from "mongoose";

const AdminSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String }, // optional if you will only allow google sign-in for admin
    // any other admin fields
}, { timestamps: true });

export const Admin = models.Admin || mongoose.model("Admin", AdminSchema);
