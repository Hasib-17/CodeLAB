// models/ExamSetup.js
import mongoose from 'mongoose';

const ExamSetupSchema = new mongoose.Schema({
    batchId: { type: String }, // which upload/batch this exam uses
    courseCode: { type: String, required: true },
    courseTitle: { type: String, required: true },
    durationSeconds: { type: Number, required: true }, // total exam time in seconds
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.ExamSetup || mongoose.model('ExamSetup', ExamSetupSchema);
