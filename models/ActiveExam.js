// models/ActiveExam.js
import mongoose, { Schema, models } from 'mongoose';

const ExamQuestionSchema = new Schema({
    _id: { type: String, required: true },          // string id
    question: { type: String, required: true },
    answer: { type: String, required: true, select: false } // not returned by queries by default
}, { _id: false });

const ActiveExamSchema = new Schema({
    sessionId: { type: String, required: true, unique: true, index: true },
    courseCode: { type: String, required: true },
    courseTitle: { type: String },
    questions: { type: [ExamQuestionSchema], default: [] },
    examDurationSeconds: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date }
});

export const ActiveExam = models.ActiveExam || mongoose.model('ActiveExam', ActiveExamSchema);
