const Address = require('../models/Address');

/**
 * @desc    Get customer's saved addresses
 * @route   GET /api/addresses
 * @access  Private/Customer
 */
const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses
    });
  } catch (error) {
    console.error('getAddresses Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving addresses'
    });
  }
};

/**
 * @desc    Add new customer address
 * @route   POST /api/addresses
 * @access  Private/Customer
 */
const createAddress = async (req, res) => {
  try {
    const { name, phone, streetAddress, city, state, postalCode, country, isDefault } = req.body;

    if (!name || !phone || !streetAddress || !city || !state || !postalCode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, phone, street address, city, state, and postal code'
      });
    }

    if (isDefault) {
      // Unset previous default address
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    const address = await Address.create({
      user: req.user._id,
      name,
      phone,
      streetAddress,
      city,
      state,
      postalCode,
      country: country || 'India',
      isDefault: isDefault || false
    });

    return res.status(201).json({
      success: true,
      message: 'Address saved successfully',
      data: address
    });
  } catch (error) {
    console.error('createAddress Error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Server error creating address'
    });
  }
};

module.exports = {
  getAddresses,
  createAddress
};
