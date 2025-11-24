// models/Problem.js
import { model, models, Schema } from "mongoose";

const ProblemSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  title: { type: String },
  problemStatement: { type: String },
  inputFormat: { type: String },
  outputFormat: { type: String },
  sampleInput: { type: String },
  sampleOutput: { type: String },
  likes: {
    type: Number,
    default: 10,
  },
  dislikes: {
    type: Number,
    default: 0,
  },
  order: { type: Number },
  courseCode: { type: String, default: "" },
  courseTitle: { type: String, default: "" },
  category: { type: String, default: "" }, // legacy field
  companies: { type: [String], default: [] }, // legacy field
  constraints: { type: String },
  starterCode: { type: String },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Easy" },
  solution: { type: String },
  videoId: { type: String },
  testCases: [
    {
      input: { type: [String], required: false },
      output: { type: [String], required: false },
    },
  ],
  // soft delete flag
  deleted: { type: Boolean, default: false },
  // new flag -> shown in Exam page when true
  inExam: { type: Boolean, default: false },
}, { timestamps: true });

export const Problem = models?.Problem || model("Problem", ProblemSchema);
