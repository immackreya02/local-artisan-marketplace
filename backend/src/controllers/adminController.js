const User = require('../models/User');
const Shop = require('../models/Shop');
const { createNotification } = require('../utils/notificationHelper');

/**
 * Helper to update Artisan User and corresponding Shop status together,
 * and send a ShopApproval notification to the artisan.
 */
const updateArtisanStatusAndNotify = async ({ artisanId, newStatus, verified = undefined, customTitle, customMessage }) => {
  const user = await User.findById(artisanId);
  if (!user || user.role !== 'artisan') {
    return { error: 'Artisan user not found', statusCode: 404 };
  }

  user.status = newStatus;
  await user.save();

  // Find and update artisan's shop
  const shopFilter = { owner: user._id };
  const shopUpdate = { status: newStatus };
  if (verified !== undefined) {
    shopUpdate.verified = verified;
  } else if (newStatus === 'Active') {
    shopUpdate.verified = true;
  }

  const shop = await Shop.findOneAndUpdate(shopFilter, shopUpdate, { new: true });

  // Send Notification
  let title = customTitle || 'Artisan Account Status Update';
  let message = customMessage || `Your artisan account status has been updated to ${newStatus}.`;

  if (!customTitle) {
    if (newStatus === 'Active') {
      title = 'Shop Approved';
      message = 'Your artisan account and shop have been approved! You can now publish active products.';
    } else if (newStatus === 'Rejected') {
      title = 'Shop Application Rejected';
      message = 'Your artisan shop application was rejected by the admin.';
    } else if (newStatus === 'Suspended') {
      title = 'Account Suspended';
      message = 'Your artisan account and shop have been suspended by the admin.';
    }
  }

  await createNotification({
    recipient: user._id,
    title,
    message,
    type: 'ShopApproval',
    relatedId: shop ? shop._id : null
  });

  return { user, shop };
};

/**
 * @desc    Get all artisans with shop details (Admin only)
 * @route   GET /api/admin/artisans
 * @access  Private/Admin
 */
exports.getArtisans = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { role: 'artisan' };
    if (status) {
      filter.status = status;
    }

    const artisans = await User.find(filter).select('-password').sort({ createdAt: -1 });

    // Attach shop data for each artisan
    const data = await Promise.all(
      artisans.map(async (artisan) => {
        const shop = await Shop.findOne({ owner: artisan._id });
        return {
          ...artisan.toObject(),
          shop: shop ? { id: shop._id, name: shop.name, status: shop.status, verified: shop.verified } : null
        };
      })
    );

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve a pending artisan
 * @route   PATCH /api/admin/artisans/:id/approve
 * @access  Private/Admin
 */
exports.approveArtisan = async (req, res, next) => {
  try {
    const artisanId = req.params.id;
    const result = await updateArtisanStatusAndNotify({
      artisanId,
      newStatus: 'Active',
      verified: true
    });

    if (result.error) {
      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Artisan approved successfully and shop activated',
      user: { id: result.user._id, name: result.user.name, status: result.user.status },
      shop: result.shop ? { id: result.shop._id, name: result.shop.name, status: result.shop.status } : null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject a pending artisan
 * @route   PATCH /api/admin/artisans/:id/reject
 * @access  Private/Admin
 */
exports.rejectArtisan = async (req, res, next) => {
  try {
    const artisanId = req.params.id;
    const result = await updateArtisanStatusAndNotify({
      artisanId,
      newStatus: 'Rejected',
      verified: false
    });

    if (result.error) {
      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Artisan application rejected',
      user: { id: result.user._id, name: result.user.name, status: result.user.status },
      shop: result.shop ? { id: result.shop._id, name: result.shop.name, status: result.shop.status } : null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Suspend an active artisan
 * @route   PATCH /api/admin/artisans/:id/suspend
 * @access  Private/Admin
 */
exports.suspendArtisan = async (req, res, next) => {
  try {
    const artisanId = req.params.id;

    // Admin Self-Protection
    if (req.user._id.toString() === artisanId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Security action denied: You cannot suspend your own account'
      });
    }

    const result = await updateArtisanStatusAndNotify({
      artisanId,
      newStatus: 'Suspended'
    });

    if (result.error) {
      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Artisan account and shop suspended',
      user: { id: result.user._id, name: result.user.name, status: result.user.status },
      shop: result.shop ? { id: result.shop._id, name: result.shop.name, status: result.shop.status } : null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reinstate a suspended artisan
 * @route   PATCH /api/admin/artisans/:id/reinstate
 * @access  Private/Admin
 */
exports.reinstateArtisan = async (req, res, next) => {
  try {
    const artisanId = req.params.id;
    const result = await updateArtisanStatusAndNotify({
      artisanId,
      newStatus: 'Active',
      verified: true,
      customTitle: 'Account Reinstated',
      customMessage: 'Your artisan account and shop have been reinstated.'
    });

    if (result.error) {
      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Artisan reinstated successfully',
      user: { id: result.user._id, name: result.user.name, status: result.user.status },
      shop: result.shop ? { id: result.shop._id, name: result.shop.name, status: result.shop.status } : null
    });
  } catch (error) {
    next(error);
  }
};
