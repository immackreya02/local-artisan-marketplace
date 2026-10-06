const mongoose = require('mongoose');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const Category = require('../models/Category');
const Order = require('../models/Order');

// Helper to calculate final price safely
const calculatePrice = (mrp, discount = 0) => {
  const numMrp = Number(mrp);
  const numDiscount = Number(discount || 0);

  if (isNaN(numMrp) || numMrp < 0) {
    throw new Error('MRP must be a valid non-negative number');
  }
  if (isNaN(numDiscount) || numDiscount < 0 || numDiscount > 100) {
    throw new Error('Discount percentage must be between 0 and 100');
  }

  const finalPrice = Math.round(numMrp * (1 - numDiscount / 100));
  return { price: finalPrice, discount: numDiscount };
};

/**
 * @desc    Get all products (Public list Active products from Active shops only)
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = async (req, res) => {
  try {
    const { search, category, shop, availability, featured, minPrice, maxPrice, sort, status } = req.query;

    const filter = {};

    // Role-based visibility check
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isAdmin) {
      // Find all Active shops first to ensure public only sees products from Active shops
      const activeShops = await Shop.find({ status: 'Active' }).select('_id');
      const activeShopIds = activeShops.map((s) => s._id);

      filter.status = 'Active';
      filter.shop = { $in: activeShopIds };
    } else if (status) {
      filter.status = status;
    }

    // Filter by specific Shop ID if provided
    if (shop) {
      filter.shop = shop;
    }

    // Filter by Category (ObjectId or Slug)
    if (category) {
      const isObjectId = category.match(/^[0-9a-fA-F]{24}$/);
      if (isObjectId) {
        filter.category = category;
      } else {
        filter.categorySlug = category.toLowerCase();
      }
    }

    // Filter by Availability enum
    if (availability) {
      filter.availability = availability;
    }

    // Filter by Featured flag
    if (featured !== undefined) {
      filter.featured = featured === 'true';
    }

    // Filter by Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    // Search term in name, description, or tags
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } }
      ];
    }

    // Sorting
    let sortOption = { createdAt: -1 }; // default newest
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'rating') sortOption = { rating: -1 };

    const products = await Product.find(filter)
      .populate('shop', 'name location rating verified status')
      .populate('category', 'name slug')
      .sort(sortOption);

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('getProducts Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving products'
    });
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Public (Active) / Private (Owner or Admin for non-Active)
 */
const getProductById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = await Product.findById(req.params.id)
      .populate('shop', 'name owner location rating reviewCount verified status')
      .populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Public visibility check: If product or shop is not Active, restrict access
    const isProductActive = product.status === 'Active';
    const isShopActive = product.shop && product.shop.status === 'Active';

    if (!isProductActive || !isShopActive) {
      const isOwner = req.user && product.shop && product.shop.owner && product.shop.owner.toString() === req.user._id.toString();
      const isAdmin = req.user && req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: This product is not currently active'
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('getProductById Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving product details'
    });
  }
};

/**
 * @desc    Get all products owned by authenticated artisan
 * @route   GET /api/products/my
 * @access  Private/Artisan
 */
const getMyProducts = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'No shop found for this artisan account'
      });
    }

    const products = await Product.find({ shop: shop._id })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      shop: { id: shop._id, name: shop.name, status: shop.status },
      data: products
    });
  } catch (error) {
    console.error('getMyProducts Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving artisan products'
    });
  }
};

/**
 * @desc    Create new product (Artisan or Admin)
 * @route   POST /api/products
 * @access  Private (Artisan / Admin)
 */
const createProduct = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    let targetShop;

    if (isAdmin && req.body.shop) {
      targetShop = await Shop.findById(req.body.shop);
    } else {
      targetShop = await Shop.findOne({ owner: req.user._id });
    }

    if (!targetShop) {
      return res.status(404).json({
        success: false,
        message: 'No associated shop found for product creation'
      });
    }

    const {
      name,
      description,
      category,
      categorySlug,
      images,
      mrp,
      discount,
      availability,
      stock,
      productionTime,
      limitedQuantity,
      featured,
      specs,
      tags,
      status
    } = req.body;

    // Validate mandatory fields
    if (!name || !description || mrp === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide product name, description, and MRP'
      });
    }

    // Price Calculation
    const { price: finalPrice, discount: validDiscount } = calculatePrice(mrp, discount);

    // Publishing Rule Check: Cannot publish Active product if shop or user is not Active
    let productStatus = status || 'Active';
    const isUserActive = req.user.status === 'Active';
    const isShopActive = targetShop.status === 'Active';

    if ((!isShopActive || !isUserActive) && !isAdmin) {
      if (status === 'Active') {
        return res.status(403).json({
          success: false,
          message: `Cannot publish Active products while artisan user status is '${req.user.status}' or shop status is '${targetShop.status}'. Product must remain in Draft.`
        });
      }
      productStatus = 'Draft';
    }

    // Resolve Category if provided
    let categoryRef = null;
    let resolvedCategorySlug = categorySlug || '';
    if (category) {
      const catDoc = category.match(/^[0-9a-fA-F]{24}$/)
        ? await Category.findById(category)
        : await Category.findOne({ slug: category.toLowerCase() });

      if (catDoc) {
        categoryRef = catDoc._id;
        resolvedCategorySlug = catDoc.slug;
      }
    }

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      shop: targetShop._id,
      category: categoryRef,
      categorySlug: resolvedCategorySlug,
      images: Array.isArray(images) ? images : (images ? [images] : []),
      mrp: Number(mrp),
      discount: validDiscount,
      price: finalPrice,
      status: productStatus,
      availability: availability || 'Ready-to-Ship',
      stock: stock !== undefined ? Number(stock) : 0,
      productionTime: productionTime || '',
      limitedQuantity: limitedQuantity !== undefined ? Number(limitedQuantity) : null,
      featured: isAdmin ? (featured || false) : false,
      specs: specs || {},
      tags: Array.isArray(tags) ? tags : []
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Server error creating product'
    });
  }
};

/**
 * @desc    Update product details (Artisan Owner or Admin)
 * @route   PUT /api/products/:id
 * @access  Private (Artisan Owner / Admin)
 */
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const shop = await Shop.findById(product.shop);
    const isAdmin = req.user.role === 'admin';
    const isOwner = shop && shop.owner.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only edit products belonging to your shop'
      });
    }

    const {
      name,
      description,
      category,
      categorySlug,
      images,
      mrp,
      discount,
      availability,
      stock,
      productionTime,
      limitedQuantity,
      featured,
      specs,
      tags,
      status
    } = req.body;

    // Publishing Rule Check if status is being set to Active
    if (status === 'Active' && (shop.status !== 'Active' || req.user.status !== 'Active') && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: `Cannot publish product as Active while artisan user status is '${req.user.status}' or shop status is '${shop.status}'`
      });
    }

    if (name !== undefined) product.name = name.trim();
    if (description !== undefined) product.description = description.trim();
    if (images !== undefined) product.images = Array.isArray(images) ? images : [images];
    if (availability !== undefined) product.availability = availability;
    if (stock !== undefined) product.stock = Number(stock);
    if (productionTime !== undefined) product.productionTime = productionTime;
    if (limitedQuantity !== undefined) product.limitedQuantity = Number(limitedQuantity);
    if (status !== undefined) product.status = status;
    if (featured !== undefined && isAdmin) product.featured = featured;
    if (specs !== undefined) product.specs = specs;
    if (tags !== undefined) product.tags = tags;

    // Recalculate price if mrp or discount updated
    const newMrp = mrp !== undefined ? Number(mrp) : product.mrp;
    const newDiscount = discount !== undefined ? Number(discount) : product.discount;
    const { price: updatedPrice, discount: validDiscount } = calculatePrice(newMrp, newDiscount);

    product.mrp = newMrp;
    product.discount = validDiscount;
    product.price = updatedPrice;

    // Resolve category update if provided
    if (category !== undefined) {
      const catDoc = category.match(/^[0-9a-fA-F]{24}$/)
        ? await Category.findById(category)
        : await Category.findOne({ slug: category.toLowerCase() });

      if (catDoc) {
        product.category = catDoc._id;
        product.categorySlug = catDoc.slug;
      }
    } else if (categorySlug !== undefined) {
      product.categorySlug = categorySlug.toLowerCase();
    }

    const updatedProduct = await product.save();

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error('updateProduct Error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Server error updating product'
    });
  }
};

/**
 * @desc    Update product status (Artisan Owner or Admin)
 * @route   PATCH /api/products/:id/status
 * @access  Private (Artisan Owner / Admin)
 */
const updateProductStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Draft', 'Active', 'Inactive'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values are: ${validStatuses.join(', ')}`
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const shop = await Shop.findById(product.shop);
    const isAdmin = req.user.role === 'admin';
    const isOwner = shop && shop.owner.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only manage status for your own products'
      });
    }

    if (status === 'Active' && (shop.status !== 'Active' || req.user.status !== 'Active') && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: `Cannot change product status to Active while artisan user status is '${req.user.status}' or shop status is '${shop.status}'`
      });
    }

    product.status = status;
    await product.save();

    return res.status(200).json({
      success: true,
      message: `Product status updated to ${status}`,
      data: product
    });
  } catch (error) {
    console.error('updateProductStatus Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating product status'
    });
  }
};

/**
 * @desc    Delete product (Soft deactivates if historical orders exist)
 * @route   DELETE /api/products/:id
 * @access  Private (Artisan Owner / Admin)
 */
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const shop = await Shop.findById(product.shop);
    const isAdmin = req.user.role === 'admin';
    const isOwner = shop && shop.owner.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only delete products belonging to your shop'
      });
    }

    // Check if product is referenced in historical orders
    const hasOrders = await Order.findOne({ 'items.product': product._id });

    if (hasOrders) {
      // Soft deactivate instead of hard delete to preserve historical order logs
      product.status = 'Inactive';
      await product.save();

      return res.status(200).json({
        success: true,
        message: 'Product has historical orders. Status set to Inactive to preserve order history.',
        data: product
      });
    }

    // Hard delete if no orders reference this product
    await Product.findByIdAndDelete(product._id);

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('deleteProduct Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting product'
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getMyProducts,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct
};
