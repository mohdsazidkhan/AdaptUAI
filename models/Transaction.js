import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['SPEND', 'RECHARGE'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  // Admin recharges: payment reference (e.g. UPI transaction ID) and rupees received.
  reference: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  rupees: {
    type: Number,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure we can quickly fetch recent transactions for a user
TransactionSchema.index({ userId: 1, createdAt: -1 });
// Look up a payment reference quickly so the same UPI payment is not credited twice.
TransactionSchema.index({ reference: 1 }, { sparse: true });

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
