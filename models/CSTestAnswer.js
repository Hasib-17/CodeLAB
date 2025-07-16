import mongoose, { Schema, models } from 'mongoose';

const CSTestAnswerSchema = new Schema({
    question: { type: String, required: true },
    correct_answer: { type: String, required: true }
});

// Avoid re-defining model in dev mode
export const CSTestAnswer = models.CSTestAnswer || mongoose.model('CSTestAnswer', CSTestAnswerSchema);
