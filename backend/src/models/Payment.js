const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Payment must reference an order']
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Payment must reference a customer']
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['COD', 'Online', 'UPI', 'Card'],
        message: 'Payment method must be COD, Online, UPI, or Card'
      },
      required: true
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Completed', 'Failed', 'Refunded'],
        message: 'Payment status must be Pending, Completed, Failed, or Refunded'
      },
      default: 'Pending'
    },
    transactionId: {
      type: String,
      default: ''
    },
    paymentDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

paymentSchema.index({ order: 1 });
paymentSchema.index({ customer: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
