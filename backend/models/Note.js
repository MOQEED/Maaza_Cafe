import mongoose from 'mongoose';

const editHistorySchema = new mongoose.Schema(
  {
    previousValues: { type: mongoose.Schema.Types.Mixed },
    updatedValues: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: String },
    note: { type: String, default: 'Updated note' },
  },
  { _id: false }
);

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: 'General Note',
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    image: {
      type: String,
      default: '',
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    groupDate: {
      type: String,
      default: '',
    },
    updatedDate: {
      type: String,
      default: '',
    },
    editCount: {
      type: Number,
      default: 0,
    },
    editHistory: [editHistorySchema],
  },
  { timestamps: true }
);

noteSchema.pre('save', function (next) {
  if (!this.groupDate) {
    this.groupDate = this.date;
  }
  next();
});

const Note = mongoose.models.Note || mongoose.model('Note', noteSchema);
export default Note;
