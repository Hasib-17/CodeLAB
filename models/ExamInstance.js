// models/ExamInstance.js
import mongoose from 'mongoose';

const SnapshotQuestion = new mongoose.Schema({
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    text: String,
    options: [String],
    points: Number
}, { _id: false });

const AnswerSchema = new mongoose.Schema({
    questionId: { type: mongoose.Schema.Types.ObjectId },
    selectedIndex: Number,
}, { _id: false });

const ExamInstanceSchema = new mongoose.Schema({
    studentId: { type: String, required: true, index: true },
    examSetupId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamSetup', required: true },
    questions: [SnapshotQuestion],
    startedAt: Date,
    submittedAt: Date,
    answers: [AnswerSchema],
    score: Number,
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.ExamInstance || mongoose.model('ExamInstance', ExamInstanceSchema);
