const Shop = require('../models/Shop');
const User = require('../models/User');

/**
 * @desc    Get all shops (Public lists Active shops only; Admin/Artisan can filter)
 * @route   GET /api/shops
 * @access  Public
 */
const getShops = async (req, res) => {
  try {
    const { category, status } = req.query;
    const filter = {};

    if (category) {
      filter.category = category;
    }

    // Role-based visibility check
    // If not admin, restrict visibility to Active shops only (or artisan viewing own shop)
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isAdmin) {
      filter.status = 'Active';
    } else if (status) {
      filter.status = status;
    }

    const shops = await Shop.find(filter)
      .populate('owner', 'name email location')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: shops.length,
      data: shops
    });
  } catch (error) {
    console.error('getShops Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving shops'
    });
  }
};

/**
 * @desc    Get single shop by ID
 * @route   GET /api/shops/:id
 * @access  Public (Active shops) / Private (Owner or Admin for non-Active)
 */
const getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate('owner', 'name email location phone');

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    // Visibility restriction for non-Active shops
    if (shop.status !== 'Active') {
      const isOwner = req.user && shop.owner && shop.owner._id.toString() === req.user._id.toString();
      const isAdmin = req.user && req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: This shop is currently not active'
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: shop
    });
  } catch (error) {
    console.error('getShopById Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving shop'
    });
  }
};

/**
 * @desc    Create new shop (Artisan only)
 * @route   POST /api/shops
 * @access  Private/Artisan
 */
const createShop = async (req, res) => {
  try {
    const { name, description, category, location, phone, email, image, yearsInBusiness } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide shop name and description'
      });
    }

    // Check if artisan already has an existing shop
    const existingShop = await Shop.findOne({ owner: req.user._id });
    if (existingShop) {
      return res.status(409).json({
        success: false,
        message: 'You already have an existing shop storefront registered'
      });
    }

    // Force owner to authenticated user ID & force status to Pending
    const shop = await Shop.create({
      name,
      description,
      owner: req.user._id,
      ownerName: req.user.name,
      category: category || '',
      location: location || req.user.location || '',
      phone: phone || req.user.phone || '',
      email: email || req.user.email || '',
      image: image || '',
      yearsInBusiness: yearsInBusiness || 0,
      status: 'Pending', // Artisans CANNOT make their own shop Active!
      verified: false
    });

    return res.status(201).json({
      success: true,
      message: 'Shop created successfully! Pending admin approval.',
      data: shop
    });
  } catch (error) {
    console.error('createShop Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating shop'
    });
  }
};

/**
 * @desc    Update shop details (Artisan Owner or Admin)
 * @route   PUT /api/shops/:id
 * @access  Private (Artisan Owner or Admin)
 */
const updateShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    // Strict Ownership & Authorization Verification
    const isOwner = shop.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only manage your own shop'
      });
    }

    const { name, description, category, location, phone, email, image, yearsInBusiness, status } = req.body;

    if (name !== undefined) shop.name = name;
    if (description !== undefined) shop.description = description;
    if (category !== undefined) shop.category = category;
    if (location !== undefined) shop.location = location;
    if (phone !== undefined) shop.phone = phone;
    if (email !== undefined) shop.email = email;
    if (image !== undefined) shop.image = image;
    if (yearsInBusiness !== undefined) shop.yearsInBusiness = yearsInBusiness;

    // Only Admin is allowed to modify shop status or verification through updates
    if (isAdmin) {
      if (status !== undefined) shop.status = status;
      if (req.body.verified !== undefined) shop.verified = req.body.verified;
    }

    const updatedShop = await shop.save();

    return res.status(200).json({
      success: true,
      message: 'Shop details updated successfully',
      data: updatedShop
    });
  } catch (error) {
    console.error('updateShop Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating shop'
    });
  }
};

/**
 * @desc    Update shop status & synchronize user status (Admin only)
 * @route   PATCH /api/shops/:id/status
 * @access  Private/Admin
 */
const updateShopStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Active', 'Rejected', 'Suspended'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values are: ${validStatuses.join(', ')}`
      });
    }

    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    shop.status = status;
    if (status === 'Active') {
      shop.verified = true;
    }
    await shop.save();

    // Synchronize corresponding Artisan User status
    let synchronizedUser = null;
    if (shop.owner) {
      synchronizedUser = await User.findByIdAndUpdate(
        shop.owner,
        { status: status },
        { new: true }
      ).select('-password');
    }

    return res.status(200).json({
      success: true,
      message: `Shop status updated to ${status} and artisan user status synchronized`,
      data: shop,
      user: synchronizedUser ? { id: synchronizedUser._id, name: synchronizedUser.name, status: synchronizedUser.status } : null
    });
  } catch (error) {
    console.error('updateShopStatus Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating shop status'
    });
  }
};

/**
 * @desc    Get authenticated artisan's shop
 * @route   GET /api/shops/my-shop
 * @access  Private/Artisan
 */
const getMyShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id }).populate('owner', 'name email location phone');
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'No shop found for this artisan account'
      });
    }
    return res.status(200).json({
      success: true,
      data: shop
    });
  } catch (error) {
    console.error('getMyShop Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving artisan shop'
    });
  }
};

module.exports = {
  getShops,
  getShopById,
  getMyShop,
  createShop,
  updateShop,
  updateShopStatus
};
