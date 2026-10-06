const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Product description is required']
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Product must belong to a shop']
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    categorySlug: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    images: [
      {
        type: String
      }
    ],
    mrp: {
      type: Number,
      required: [true, 'MRP (Maximum Retail Price) is required'],
      min: [0, 'MRP cannot be negative']
    },
    price: {
      type: Number,
      required: [true, 'Final price is required'],
      min: [0, 'Price cannot be negative']
    },
    discount: {
      type: Number,
      default: 0
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative']
    },
    sku: {
      type: String,
      trim: true,
      default: ''
    },
    // Product status controls visibility in catalogue (Draft, Active, Inactive)
    status: {
      type: String,
      enum: {
        values: ['Draft', 'Active', 'Inactive'],
        message: 'Status must be Draft, Active, or Inactive'
      },
      default: 'Active'
    },
    // Availability type controls fulfillment mode (Ready-to-Ship, Made-to-Order, etc.)
    availability: {
      type: String,
      enum: {
        values: ['Ready-to-Ship', 'Made-to-Order', 'Limited Edition', 'Pre-order'],
        message: 'Availability must be Ready-to-Ship, Made-to-Order, Limited Edition, or Pre-order'
      },
      default: 'Ready-to-Ship'
    },
    productionTime: {
      type: String,
      default: ''
    },
    limitedQuantity: {
      type: Number,
      default: null
    },
    featured: {
      type: Boolean,
      default: false
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
    specs: {
      type: Map,
      of: String,
      default: {}
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ]
  },
  {
    timestamps: true
  }
);

// Indexes for common queries (by shop, category, status, featured)
productSchema.index({ shop: 1 });
productSchema.index({ categorySlug: 1 });
productSchema.index({ status: 1, featured: 1 });

module.exports = mongoose.model('Product', productSchema);
