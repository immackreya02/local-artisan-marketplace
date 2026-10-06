const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Shop must belong to an artisan user']
    },
    ownerName: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      required: [true, 'Shop description is required']
    },
    location: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: ''
    },
    image: {
      type: String,
      default: ''
    },
    yearsInBusiness: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    verified: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Active', 'Rejected', 'Suspended'],
        message: 'Shop status must be Pending, Active, Rejected, or Suspended'
      },
      default: 'Pending'
    }
  },
  {
    timestamps: true
  }
);

// Index on owner for fast shop lookup by artisan
shopSchema.index({ owner: 1 });
shopSchema.index({ status: 1 });

module.exports = mongoose.model('Shop', shopSchema);
