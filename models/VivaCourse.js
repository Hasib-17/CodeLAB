// models/VivaCourse.js
import mongoose, { Schema, models } from 'mongoose';

const QuestionSubSchema = new Schema({
    question: { type: String, required: true },
    correct_answer: { type: String, required: true }
}, { timestamps: false });

const VivaCourseSchema = new Schema({
    courseCode: { type: String, required: true, unique: true, index: true },
    courseTitle: { type: String, required: true },
    examDurationSeconds: { type: Number, required: true },
    questions: { type: [QuestionSubSchema], default: [] }
}, { timestamps: true });

export const VivaCourse = models.VivaCourse || mongoose.model('VivaCourse', VivaCourseSchema);
