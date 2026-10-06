const express = require('express');
const router = express.Router();
const {
  getArtisans,
  approveArtisan,
  rejectArtisan,
  suspendArtisan,
  reinstateArtisan
} = require('../controllers/adminController');

const { protect, authorize } = require('../middleware/auth');

// Protect all admin management routes
router.use(protect);
router.use(authorize('admin'));

router.get('/artisans', getArtisans);
router.patch('/artisans/:id/approve', approveArtisan);
router.patch('/artisans/:id/reject', rejectArtisan);
router.patch('/artisans/:id/suspend', suspendArtisan);
router.patch('/artisans/:id/reinstate', reinstateArtisan);

module.exports = router;
