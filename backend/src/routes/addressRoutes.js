const express = require('express');
const router = express.Router();
const { getAddresses, createAddress } = require('../controllers/addressController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('customer'));

router.get('/', getAddresses);
router.post('/', createAddress);

module.exports = router;
