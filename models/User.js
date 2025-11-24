// models/User.js
import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String }, // hashed (credentials)
  name: { type: String },
  // other user fields...
}, { timestamps: true });

export const User = models.User || mongoose.model("User", UserSchema);
