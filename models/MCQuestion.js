import mongoose from 'mongoose';

const MCQuestionSchema = new mongoose.Schema({
    qid: { type: String },
    batchId: { type: String, index: true },
    text: { type: String, required: true },
    options: [{ type: String }],
    correctIndex: { type: Number },
    points: { type: Number, default: 1 },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.MCQuestion || mongoose.model('MCQuestion', MCQuestionSchema);
