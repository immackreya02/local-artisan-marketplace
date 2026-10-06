const express = require('express');
const router = express.Router();
const {
  createCustomRequest,
  getCustomerCustomRequests,
  getArtisanCustomRequests,
  getCustomRequestById,
  updateCustomRequest,
  updateCustomRequestStatus,
  deleteCustomRequest,
  submitProposal,
  acceptProposal
} = require('../controllers/customRequestController');

const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect);

router.post('/', authorize('customer'), createCustomRequest);
router.get('/', authorize('customer', 'admin'), getCustomerCustomRequests);
router.get('/artisan', authorize('artisan', 'admin'), getArtisanCustomRequests);

router.get('/:id', getCustomRequestById);
router.put('/:id', updateCustomRequest);
router.patch('/:id/status', updateCustomRequestStatus);
router.post('/:id/proposal', authorize('artisan', 'admin'), submitProposal);
router.post('/:id/accept-proposal', authorize('customer', 'admin'), acceptProposal);
router.delete('/:id', deleteCustomRequest);

module.exports = router;

