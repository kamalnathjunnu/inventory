const { Category } = require('../models');
const { Sequelize } = require('sequelize');

/**
 * Get pagination parameters
 */
const getPagination = (page, size) => {
  const limit = size ? +size : 10;
  const offset = page ? (page - 1) * limit : 0;
  return { limit, offset };
};

/**
 * Get all categories with pagination and search
 */
exports.getAll = async (req, res) => {
  const { page, size, search } = req.query;
  const { limit, offset } = getPagination(page, size);
  
  const where = {};
  
  // Search filter
  if (search) {
    where.name = { [Sequelize.Op.like]: `%${search}%` };
  }
  
  try {
    const data = await Category.findAndCountAll({ 
      where,
      limit, 
      offset,
      order: [['name', 'ASC']]
    });
    
    res.json({
      success: true,
      totalItems: data.count,
      items: data.rows,
      totalPages: Math.ceil(data.count / limit),
      currentPage: page ? +page : 1
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch categories' 
    });
  }
};

/**
 * Get category by ID
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findByPk(id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false,
        error: 'Category not found' 
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch category' 
    });
  }
};

/**
 * Create new category
 */
exports.create = async (req, res) => {
  try {
    const categoryData = req.body;
    
    // Set accountId from authenticated user
    categoryData.accountId = req.user.accountId;
    
    // Validate required fields
    if (!categoryData.name) {
      return res.status(400).json({ 
        success: false,
        error: 'Category name is required' 
      });
    }
    
    // Check if category name is unique within account
    const existingCategory = await Category.findOne({ 
      where: { 
        name: categoryData.name,
        accountId: categoryData.accountId
      }
    });
    
    if (existingCategory) {
      return res.status(409).json({ 
        success: false,
        error: 'Category with this name already exists in your account' 
      });
    }
    
    const category = await Category.create(categoryData);
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create category' 
    });
  }
};

/**
 * Update category
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const categoryData = req.body;
    
    const category = await Category.findByPk(id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false,
        error: 'Category not found' 
      });
    }
    
    // Check if category name is unique (if being updated)
    if (categoryData.name && categoryData.name !== category.name) {
      const existingCategory = await Category.findOne({ 
        where: { 
          name: categoryData.name,
          accountId: category.accountId
        }
      });
      
      if (existingCategory) {
        return res.status(409).json({ 
          success: false,
          error: 'Category with this name already exists in your account' 
        });
      }
    }
    
    await category.update(categoryData);
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update category' 
    });
  }
};

/**
 * Delete category
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findByPk(id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false,
        error: 'Category not found' 
      });
    }
    
    await category.destroy();
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete category' 
    });
  }
};
