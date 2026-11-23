import mongoose from 'mongoose';

const editHistorySchema = new mongoose.Schema(
  {
    previousValues: { type: mongoose.Schema.Types.Mixed },
    updatedValues: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: String },
    note: { type: String, default: 'Updated bill history' },
  },
  { _id: false }
);

const billHistorySchema = new mongoose.Schema(
  {
    billName: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
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

billHistorySchema.pre('save', function (next) {
  if (!this.groupDate) {
    this.groupDate = this.date;
  }
  next();
});

const BillHistory = mongoose.models.BillHistory || mongoose.model('BillHistory', billHistorySchema);
export default BillHistory;
