const User = require('../models/User');
const Shop = require('../models/Shop');

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getUsers = async (req, res) => {
  try {
    const { role, status } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (status) filter.status = status;

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('getUsers Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving users'
    });
  }
};

/**
 * @desc    Get user by ID (Admin or Self)
 * @route   GET /api/users/:id
 * @access  Private (Admin or Self)
 */
const getUserById = async (req, res) => {
  try {
    const targetId = req.params.id;

    // Ownership & Admin Check
    if (req.user.role !== 'admin' && req.user._id.toString() !== targetId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view this user profile'
      });
    }

    const user = await User.findById(targetId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('getUserById Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving user profile'
    });
  }
};

/**
 * @desc    Update user profile (Self or Admin)
 * @route   PUT /api/users/:id
 * @access  Private (Self or Admin)
 */
const updateUserProfile = async (req, res) => {
  try {
    const targetId = req.params.id;

    // Ownership & Admin Check
    if (req.user.role !== 'admin' && req.user._id.toString() !== targetId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only update your own profile'
      });
    }

    const user = await User.findById(targetId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Extract allowed fields only (never allow user to change role or status directly)
    const { name, phone, location, profileImage } = req.body;

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (location !== undefined) user.location = location;
    if (profileImage !== undefined) user.profileImage = profileImage;

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        phone: updatedUser.phone,
        location: updatedUser.location,
        profileImage: updatedUser.profileImage
      }
    });
  } catch (error) {
    console.error('updateUserProfile Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating profile'
    });
  }
};

/**
 * @desc    Update user status & synchronize shop status (Admin only)
 * @route   PATCH /api/users/:id/status
 * @access  Private/Admin
 */
const updateUserStatus = async (req, res) => {
  try {
    const targetId = req.params.id;
    const { status } = req.body;

    const validStatuses = ['Active', 'Pending', 'Rejected', 'Suspended'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values are: ${validStatuses.join(', ')}`
      });
    }

    // Prevent Admin from disabling/suspending their own admin account
    if (req.user._id.toString() === targetId) {
      return res.status(400).json({
        success: false,
        message: 'Security action denied: Admins cannot change their own account status'
      });
    }

    const user = await User.findById(targetId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.status = status;
    await user.save();

    // Synchronize corresponding Shop status if user is an artisan
    let synchronizedShop = null;
    if (user.role === 'artisan') {
      synchronizedShop = await Shop.findOneAndUpdate(
        { owner: user._id },
        { status: status, ...(status === 'Active' ? { verified: true } : {}) },
        { new: true }
      );

      const { createNotification } = require('../utils/notificationHelper');
      await createNotification({
        recipient: user._id,
        title: status === 'Active' ? 'Shop Approved' : 'Account Status Updated',
        message: `Your artisan status has been updated to ${status}.`,
        type: 'ShopApproval',
        relatedId: synchronizedShop ? synchronizedShop._id : null
      });
    }

    return res.status(200).json({
      success: true,
      message: `User status updated to ${status}` + (synchronizedShop ? ' and corresponding shop status synchronized' : ''),
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      shop: synchronizedShop ? { id: synchronizedShop._id, name: synchronizedShop.name, status: synchronizedShop.status } : null
    });
  } catch (error) {
    console.error('updateUserStatus Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating user status'
    });
  }
};

/**
 * @desc    Delete user account (Admin only)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = async (req, res) => {
  try {
    const targetId = req.params.id;

    // Admin Self-Protection against self-deletion
    if (req.user._id.toString() === targetId) {
      return res.status(400).json({
        success: false,
        message: 'Security action denied: Admins cannot delete their own account'
      });
    }

    const user = await User.findById(targetId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'artisan') {
      await Shop.deleteMany({ owner: user._id });
    }

    await User.findByIdAndDelete(targetId);

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('deleteUser Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting user'
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUserProfile,
  updateUserStatus,
  deleteUser
};
