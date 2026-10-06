const Category = require('../models/Category');
const Product = require('../models/Product');

// Helper to generate clean URL slug
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
};

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public
 */
const getCategories = async (req, res) => {
  try {
    const { all } = req.query;
    const filter = {};

    // Only active categories returned for public unless all=true requested
    if (all !== 'true') {
      filter.active = true;
    }

    const categories = await Category.find(filter).sort({ name: 1 });

    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({
          $or: [{ category: cat._id }, { categorySlug: cat.slug }],
          status: 'Active'
        });
        return {
          ...cat.toObject(),
          productCount
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: categoriesWithCount.length,
      data: categoriesWithCount
    });
  } catch (error) {
    console.error('getCategories Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving categories'
    });
  }
};

/**
 * @desc    Get single category by ID or slug
 * @route   GET /api/categories/:id
 * @access  Public
 */
const getCategoryById = async (req, res) => {
  try {
    const param = req.params.id;
    // Check if param is Mongo ObjectId or slug
    const isObjectId = param.match(/^[0-9a-fA-F]{24}$/);
    const filter = isObjectId ? { _id: param } : { slug: param.toLowerCase() };

    const category = await Category.findOne(filter);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('getCategoryById Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving category'
    });
  }
};

/**
 * @desc    Create new category (Admin only)
 * @route   POST /api/categories
 * @access  Private/Admin
 */
const createCategory = async (req, res) => {
  try {
    const { name, description, icon, active, slug } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    const generatedSlug = slug ? slugify(slug) : slugify(name);

    // Duplicate check
    const existingCategory = await Category.findOne({
      $or: [{ name: name.trim() }, { slug: generatedSlug }]
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Category with this name or slug already exists'
      });
    }

    const category = await Category.create({
      name: name.trim(),
      slug: generatedSlug,
      description: description || '',
      icon: icon || '',
      active: active !== undefined ? active : true
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('createCategory Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating category'
    });
  }
};

/**
 * @desc    Update category (Admin only)
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const { name, description, icon, active, slug } = req.body;

    if (name) {
      const newSlug = slug ? slugify(slug) : slugify(name);
      // Check duplicate name/slug on other categories
      const duplicate = await Category.findOne({
        _id: { $ne: category._id },
        $or: [{ name: name.trim() }, { slug: newSlug }]
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: 'Another category already exists with this name or slug'
        });
      }

      category.name = name.trim();
      category.slug = newSlug;
    }

    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (active !== undefined) category.active = active;

    const updatedCategory = await category.save();

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    console.error('updateCategory Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating category'
    });
  }
};

/**
 * @desc    Delete category (Admin only)
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('deleteCategory Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting category'
    });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
