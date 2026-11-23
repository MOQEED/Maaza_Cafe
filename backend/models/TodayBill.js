import mongoose from 'mongoose';

const editHistorySchema = new mongoose.Schema(
  {
    previousValues: { type: mongoose.Schema.Types.Mixed },
    updatedValues: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: String },
    note: { type: String, default: 'Updated bill' },
  },
  { _id: false }
);

const todayBillSchema = new mongoose.Schema(
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

todayBillSchema.pre('save', function (next) {
  if (!this.groupDate) {
    this.groupDate = this.date;
  }
  next();
});

const TodayBill = mongoose.models.TodayBill || mongoose.model('TodayBill', todayBillSchema);
export default TodayBill;
