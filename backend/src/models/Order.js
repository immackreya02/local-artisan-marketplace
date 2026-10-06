const mongoose = require('mongoose');

// Embedded item schema snapshot
const orderItemSnapshotSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    name: {
      type: String,
      required: [true, 'Product snapshot name is required']
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    image: {
      type: String,
      default: ''
    }
  },
  { _id: true }
);

// Embedded shipping address snapshot
const shippingAddressSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    streetAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'India' }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: [true, 'Order number is required'],
      unique: true,
      trim: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Order must reference a customer user']
    },
    customerName: {
      type: String,
      default: ''
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Each order must belong to a single shop']
    },
    items: {
      type: [orderItemSnapshotSchema],
      validate: [
        (val) => val.length > 0,
        'Order must contain at least one item'
      ]
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    shippingAddress: {
      type: shippingAddressSnapshotSchema,
      required: [true, 'Shipping address snapshot is required']
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['COD', 'Online', 'UPI', 'Card'],
        message: 'Payment method must be COD, Online, UPI, or Card'
      },
      default: 'COD'
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['Pending', 'Paid', 'Failed', 'Refunded'],
        message: 'Payment status must be Pending, Paid, Failed, or Refunded'
      },
      default: 'Pending'
    },
    orderStatus: {
      type: String,
      enum: {
        values: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        message: 'Order status must be Pending, Confirmed, Processing, Shipped, Delivered, or Cancelled'
      },
      default: 'Pending'
    },
    orderDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Indexes for common queries (lookup orders by customer, by shop, by status)
orderSchema.index({ customer: 1, orderDate: -1 });
orderSchema.index({ shop: 1, orderDate: -1 });
orderSchema.index({ orderStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
