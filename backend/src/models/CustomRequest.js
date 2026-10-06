const mongoose = require('mongoose');

const customRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      trim: true,
      default: ''
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Custom request must reference a customer']
    },
    customerName: {
      type: String,
      default: ''
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Custom request must reference an artisan shop']
    },
    productRef: {
      type: String,
      required: [true, 'Product reference/concept title is required'],
      trim: true
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    budget: {
      type: Number,
      min: 0
    },
    requiredByDate: {
      type: Date
    },
    description: {
      type: String,
      required: [true, 'Custom request description is required'],
      trim: true
    },
    notes: {
      type: String,
      default: ''
    },
    artisanResponse: {
      type: String,
      default: ''
    },
    proposalPrice: {
      type: Number,
      default: null
    },
    deliveryDays: {
      type: Number,
      default: null
    },
    proposalNotes: {
      type: String,
      default: ''
    },
    proposedAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Proposed', 'Accepted', 'Rejected', 'In Progress', 'Completed', 'Cancelled'],
        message: 'Status must be Pending, Proposed, Accepted, Rejected, In Progress, Completed, or Cancelled'
      },
      default: 'Pending'
    }
  },
  {
    timestamps: true
  }
);


customRequestSchema.index({ customer: 1 });
customRequestSchema.index({ shop: 1 });
customRequestSchema.index({ status: 1 });

module.exports = mongoose.model('CustomRequest', customRequestSchema);
