const express = require('express');
const router = express.Router();
const {
  getCart,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCart
} = require('../controllers/cartController');
const { protect, authorize } = require('../middleware/auth');

// All Cart routes require authentication and customer role
router.use(protect);
router.use(authorize('customer'));

router.get('/', getCart);
router.post('/items', addCartItem);
router.put('/items/:productId', updateCartItemQuantity);
router.delete('/items/:productId', removeCartItem);
router.delete('/', clearCart);

module.exports = router;
