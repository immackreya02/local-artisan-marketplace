const mongoose = require('mongoose');
const CustomRequest = require('../models/CustomRequest');
const Shop = require('../models/Shop');
const Category = require('../models/Category');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');

// Helper to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Valid status transitions map
const ALLOWED_TRANSITIONS = {
  Pending: ['Proposed', 'Accepted', 'Rejected', 'Cancelled'],
  Proposed: ['Accepted', 'Rejected', 'Cancelled'],
  Accepted: ['In Progress', 'Cancelled'],
  'In Progress': ['Completed', 'Cancelled'],
  Completed: [],
  Rejected: [],
  Cancelled: []
};


/**
 * @desc    Create a new custom order request
 * @route   POST /api/custom-requests
 * @access  Private (Customer only)
 */
exports.createCustomRequest = async (req, res, next) => {
  try {
    // 1. Ensure user is customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can create custom requests'
      });
    }

    const {
      shop,
      shopId,
      title,
      productRef,
      description,
      category,
      budget,
      requestedDate,
      requiredByDate,
      quantity,
      notes
    } = req.body;

    const targetShopId = shopId || shop;
    if (!targetShopId || !isValidObjectId(targetShopId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid shop ID is required'
      });
    }

    // 2. Validate target shop existence and Active status
    const targetShop = await Shop.findById(targetShopId);
    if (!targetShop) {
      return res.status(404).json({
        success: false,
        message: 'Target shop not found'
      });
    }

    if (targetShop.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot send custom request to an inactive shop'
      });
    }

    // Ensure target shop owner exists
    const shopOwner = await User.findById(targetShop.owner);
    if (!shopOwner || shopOwner.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Target shop owner is not an active artisan'
      });
    }

    // 3. Validate inputs
    const requestTitle = (productRef || title || '').trim();
    if (!requestTitle) {
      return res.status(400).json({
        success: false,
        message: 'Product title / reference is required'
      });
    }

    const requestDescription = (description || '').trim();
    if (!requestDescription) {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }

    // Optional category validation
    if (category) {
      if (isValidObjectId(category)) {
        const cat = await Category.findById(category);
        if (!cat) {
          return res.status(400).json({
            success: false,
            message: 'Invalid category reference'
          });
        }
      }
    }

    // Budget validation
    let parsedBudget = undefined;
    if (budget !== undefined && budget !== null && budget !== '') {
      parsedBudget = Number(budget);
      if (isNaN(parsedBudget) || parsedBudget < 0) {
        return res.status(400).json({
          success: false,
          message: 'Budget must be a non-negative number'
        });
      }
    }

    // Date validation
    let parsedDate = undefined;
    const targetDateStr = requiredByDate || requestedDate;
    if (targetDateStr) {
      parsedDate = new Date(targetDateStr);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid required by date'
        });
      }
    }

    // Quantity validation
    let parsedQty = 1;
    if (quantity !== undefined && quantity !== null && quantity !== '') {
      parsedQty = Number(quantity);
      if (isNaN(parsedQty) || parsedQty < 1) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be at least 1'
        });
      }
    }

    // Generate unique requestId string
    const requestId = `REQ-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 4. Create CustomRequest document
    const customRequest = await CustomRequest.create({
      requestId,
      customer: req.user._id,
      customerName: req.user.name || '',
      shop: targetShop._id,
      productRef: requestTitle,
      description: requestDescription,
      budget: parsedBudget,
      requiredByDate: parsedDate,
      quantity: parsedQty,
      notes: notes ? notes.trim() : '',
      status: 'Pending'
    });

    // 5. Trigger notification to artisan
    await createNotification({
      recipient: targetShop.owner,
      title: 'New Custom Order Request',
      message: `You received a new custom order request: "${customRequest.productRef}"`,
      type: 'CustomRequest',
      relatedId: customRequest._id
    });

    res.status(201).json({
      success: true,
      message: 'Custom request submitted successfully',
      data: customRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get custom requests for customer
 * @route   GET /api/custom-requests
 * @access  Private (Customer/Admin)
 */
exports.getCustomerCustomRequests = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'customer') {
      query.customer = req.user._id;
    } else if (req.user.role === 'admin') {
      if (req.query.customer && isValidObjectId(req.query.customer)) {
        query.customer = req.query.customer;
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view customer custom requests'
      });
    }

    const requests = await CustomRequest.find(query)
      .populate('shop', 'name owner status')
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get custom requests for artisan's shop
 * @route   GET /api/custom-requests/artisan
 * @access  Private (Artisan only)
 */
exports.getArtisanCustomRequests = async (req, res, next) => {
  try {
    if (req.user.role !== 'artisan' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only artisans can view shop custom requests'
      });
    }

    const artisanShop = await Shop.findOne({ owner: req.user._id });
    if (!artisanShop) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    const requests = await CustomRequest.find({ shop: artisanShop._id })
      .populate('shop', 'name owner status')
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single custom request details
 * @route   GET /api/custom-requests/:id
 * @access  Private (Customer owner, Shop artisan owner, Admin)
 */
exports.getCustomRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid custom request ID'
      });
    }

    const customRequest = await CustomRequest.findById(id)
      .populate('shop', 'name owner status')
      .populate('customer', 'name email phone');

    if (!customRequest) {
      return res.status(404).json({
        success: false,
        message: 'Custom request not found'
      });
    }

    // Check ownership / authorization
    if (req.user.role === 'admin') {
      // Authorized
    } else if (req.user.role === 'customer') {
      const isOwner = customRequest.customer._id
        ? customRequest.customer._id.toString() === req.user._id.toString()
        : customRequest.customer.toString() === req.user._id.toString();

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this custom request'
        });
      }
    } else if (req.user.role === 'artisan') {
      const artisanShop = await Shop.findOne({ owner: req.user._id });
      const requestShopId = customRequest.shop._id
        ? customRequest.shop._id.toString()
        : customRequest.shop.toString();

      if (!artisanShop || requestShopId !== artisanShop._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this custom request'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.status(200).json({
      success: true,
      data: customRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update custom request details (Customer only, Pending state only)
 * @route   PUT /api/custom-requests/:id
 * @access  Private (Customer owner)
 */
exports.updateCustomRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid custom request ID'
      });
    }

    const customRequest = await CustomRequest.findById(id);
    if (!customRequest) {
      return res.status(404).json({
        success: false,
        message: 'Custom request not found'
      });
    }

    // Authorization: only request customer or admin
    if (req.user.role !== 'admin' && customRequest.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this custom request'
      });
    }

    // Only editable in Pending status
    if (customRequest.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot edit request details while status is ${customRequest.status}`
      });
    }

    const {
      title,
      productRef,
      description,
      budget,
      requiredByDate,
      requestedDate,
      quantity,
      notes
    } = req.body;

    if (productRef !== undefined || title !== undefined) {
      const newRef = (productRef || title || '').trim();
      if (!newRef) {
        return res.status(400).json({
          success: false,
          message: 'Product title / reference cannot be empty'
        });
      }
      customRequest.productRef = newRef;
    }

    if (description !== undefined) {
      const newDesc = description.trim();
      if (!newDesc) {
        return res.status(400).json({
          success: false,
          message: 'Description cannot be empty'
        });
      }
      customRequest.description = newDesc;
    }

    if (budget !== undefined && budget !== null && budget !== '') {
      const parsedBudget = Number(budget);
      if (isNaN(parsedBudget) || parsedBudget < 0) {
        return res.status(400).json({
          success: false,
          message: 'Budget must be a non-negative number'
        });
      }
      customRequest.budget = parsedBudget;
    }

    const targetDateStr = requiredByDate || requestedDate;
    if (targetDateStr !== undefined && targetDateStr !== null && targetDateStr !== '') {
      const parsedDate = new Date(targetDateStr);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid required by date'
        });
      }
      customRequest.requiredByDate = parsedDate;
    }

    if (quantity !== undefined && quantity !== null && quantity !== '') {
      const parsedQty = Number(quantity);
      if (isNaN(parsedQty) || parsedQty < 1) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be at least 1'
        });
      }
      customRequest.quantity = parsedQty;
    }

    if (notes !== undefined) {
      customRequest.notes = notes.trim();
    }

    await customRequest.save();

    res.status(200).json({
      success: true,
      message: 'Custom request updated successfully',
      data: customRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update custom request status (Artisan/Customer/Admin with transition rules)
 * @route   PATCH /api/custom-requests/:id/status
 * @access  Private
 */
exports.updateCustomRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, artisanResponse } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid custom request ID'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'New status is required'
      });
    }

    const customRequest = await CustomRequest.findById(id);
    if (!customRequest) {
      return res.status(404).json({
        success: false,
        message: 'Custom request not found'
      });
    }

    const currentStatus = customRequest.status;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];

    // Check valid lifecycle transition
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${currentStatus} to ${status}`
      });
    }

    const shopDoc = await Shop.findById(customRequest.shop);
    const isArtisanOwner = shopDoc && shopDoc.owner.toString() === req.user._id.toString();
    const isCustomerOwner = customRequest.customer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    // Role-specific permission checks
    if (status === 'Cancelled') {
      // Customer can cancel their own eligible request; Artisan or Admin can also cancel
      if (!isCustomerOwner && !isArtisanOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to cancel this request'
        });
      }
    } else if (['Accepted', 'Rejected', 'In Progress', 'Completed'].includes(status)) {
      // Artisan or Admin only. Customer MUST NOT be allowed to accept, reject, move to in progress, or complete.
      if (!isArtisanOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: `Only the artisan can update request status to ${status}`
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported status update'
      });
    }

    // Update fields
    customRequest.status = status;
    if (artisanResponse !== undefined) {
      customRequest.artisanResponse = artisanResponse.trim();
    }

    await customRequest.save();

    // Trigger automatic notifications
    if (status === 'Accepted') {
      await createNotification({
        recipient: customRequest.customer,
        title: 'Custom Request Accepted',
        message: `Your custom request "${customRequest.productRef}" has been accepted by the artisan.`,
        type: 'CustomRequest',
        relatedId: customRequest._id
      });
    } else if (status === 'Rejected') {
      await createNotification({
        recipient: customRequest.customer,
        title: 'Custom Request Rejected',
        message: `Your custom request "${customRequest.productRef}" has been rejected by the artisan.`,
        type: 'CustomRequest',
        relatedId: customRequest._id
      });
    } else if (status === 'In Progress') {
      await createNotification({
        recipient: customRequest.customer,
        title: 'Custom Request In Progress',
        message: `Work has started on your custom request "${customRequest.productRef}".`,
        type: 'CustomRequest',
        relatedId: customRequest._id
      });
    } else if (status === 'Completed') {
      await createNotification({
        recipient: customRequest.customer,
        title: 'Custom Request Completed',
        message: `Your custom request "${customRequest.productRef}" has been marked as completed.`,
        type: 'CustomRequest',
        relatedId: customRequest._id
      });
    } else if (status === 'Cancelled') {
      // If cancelled by customer, notify artisan. If cancelled by artisan, notify customer.
      if (isCustomerOwner && shopDoc) {
        await createNotification({
          recipient: shopDoc.owner,
          title: 'Custom Request Cancelled',
          message: `Custom request "${customRequest.productRef}" was cancelled by the customer.`,
          type: 'CustomRequest',
          relatedId: customRequest._id
        });
      } else {
        await createNotification({
          recipient: customRequest.customer,
          title: 'Custom Request Cancelled',
          message: `Your custom request "${customRequest.productRef}" was cancelled.`,
          type: 'CustomRequest',
          relatedId: customRequest._id
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Status updated to ${status} successfully`,
      data: customRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a custom request
 * @route   DELETE /api/custom-requests/:id
 * @access  Private (Customer owner, Admin)
 */
exports.deleteCustomRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid custom request ID'
      });
    }

    const customRequest = await CustomRequest.findById(id);
    if (!customRequest) {
      return res.status(404).json({
        success: false,
        message: 'Custom request not found'
      });
    }

    const isCustomerOwner = customRequest.customer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomerOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this custom request'
      });
    }

    // Only allow deletion if status is Pending or Cancelled
    if (customRequest.status !== 'Pending' && customRequest.status !== 'Cancelled' && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete request with status ${customRequest.status}`
      });
    }

    await CustomRequest.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Custom request deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit Artisan Proposal/Bid for a custom request
 * @route   POST /api/custom-requests/:id/proposal
 * @access  Private (Artisan owner)
 */
exports.submitProposal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { proposalPrice, deliveryDays, proposalNotes } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid custom request ID'
      });
    }

    const customRequest = await CustomRequest.findById(id);
    if (!customRequest) {
      return res.status(404).json({
        success: false,
        message: 'Custom request not found'
      });
    }

    const shopDoc = await Shop.findById(customRequest.shop);
    if (!shopDoc || shopDoc.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the artisan who owns the shop can submit a proposal'
      });
    }

    if (!proposalPrice || isNaN(proposalPrice) || Number(proposalPrice) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid proposed price'
      });
    }

    customRequest.proposalPrice = Number(proposalPrice);
    customRequest.deliveryDays = deliveryDays ? Number(deliveryDays) : 7;
    customRequest.proposalNotes = proposalNotes ? proposalNotes.trim() : '';
    customRequest.proposedAt = new Date();
    customRequest.status = 'Proposed';

    await customRequest.save();

    await createNotification({
      recipient: customRequest.customer,
      title: 'Artisan Submitted Proposal & Quote',
      message: `Artisan submitted a proposal of ₹${customRequest.proposalPrice} (${customRequest.deliveryDays} days) for "${customRequest.productRef}"`,
      type: 'CustomRequest',
      relatedId: customRequest._id
    });

    res.status(200).json({
      success: true,
      message: 'Proposal submitted successfully',
      data: customRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Accept Artisan Proposal/Bid (Customer)
 * @route   POST /api/custom-requests/:id/accept-proposal
 * @access  Private (Customer owner)
 */
exports.acceptProposal = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid custom request ID'
      });
    }

    const customRequest = await CustomRequest.findById(id);
    if (!customRequest) {
      return res.status(404).json({
        success: false,
        message: 'Custom request not found'
      });
    }

    if (customRequest.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the customer who created the request can accept a proposal'
      });
    }

    customRequest.status = 'Accepted';
    await customRequest.save();

    const shopDoc = await Shop.findById(customRequest.shop);
    if (shopDoc) {
      await createNotification({
        recipient: shopDoc.owner,
        title: 'Proposal Accepted by Customer!',
        message: `Customer accepted your proposal for "${customRequest.productRef}".`,
        type: 'CustomRequest',
        relatedId: customRequest._id
      });
    }

    res.status(200).json({
      success: true,
      message: 'Proposal accepted successfully',
      data: customRequest
    });
  } catch (error) {
    next(error);
  }
};

