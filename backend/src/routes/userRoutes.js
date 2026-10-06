const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateUserProfile,
  updateUserStatus,
  deleteUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// Admin-only: List all users
router.get('/', protect, authorize('admin'), getUsers);

// Admin or Self: Get user profile
router.get('/:id', protect, getUserById);

// Admin or Self: Update user profile
router.put('/:id', protect, updateUserProfile);

// Admin-only: Update user status & sync artisan shop status
router.patch('/:id/status', protect, authorize('admin'), updateUserStatus);

// Admin-only: Delete user account
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
