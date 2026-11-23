import mongoose from 'mongoose';

const editHistorySchema = new mongoose.Schema(
  {
    previousValues: { type: mongoose.Schema.Types.Mixed },
    updatedValues: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: String },
    note: { type: String, default: 'Updated spending' },
  },
  { _id: false }
);

const spendingSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    totalPrice: {
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
      required: true,
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

spendingSchema.pre('save', function (next) {
  if (this.quantity && this.price) {
    this.totalPrice = Number((this.quantity * this.price).toFixed(2));
  }
  if (!this.groupDate) {
    this.groupDate = this.date;
  }
  next();
});

const Spending = mongoose.models.Spending || mongoose.model('Spending', spendingSchema);
export default Spending;
