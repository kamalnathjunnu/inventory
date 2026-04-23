const { Brand } = require('../models');
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
 * Get all brands with pagination and search
 */
exports.getAll = async (req, res) => {
  const { page, size, search } = req.query;
  const { limit, offset } = getPagination(page, size);
  
  const where = {
    accountId: req.user.accountId
  };
  
  // Search filter
  if (search) {
    where.name = { [Sequelize.Op.like]: `%${search}%` };
  }
  
  try {
    const data = await Brand.findAndCountAll({ 
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
    console.error('Error fetching brands:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch brands' 
    });
  }
};

/**
 * Get brand by ID
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const brand = await Brand.findByPk(id);
    
    if (!brand) {
      return res.status(404).json({ 
        success: false,
        error: 'Brand not found' 
      });
    }
    
    res.json({
      success: true,
      data: brand
    });
  } catch (error) {
    console.error('Error fetching brand:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch brand' 
    });
  }
};

/**
 * Create new brand
 */
exports.create = async (req, res) => {
  try {
    const brandData = req.body;
    
    // Set accountId from authenticated user
    brandData.accountId = req.user.accountId;
    
    // Validate required fields
    if (!brandData.name) {
      return res.status(400).json({ 
        success: false,
        error: 'Brand name is required' 
      });
    }
    
    // Check if brand name is unique within account
    const existingBrand = await Brand.findOne({ 
      where: { 
        name: brandData.name,
        accountId: brandData.accountId
      }
    });
    
    if (existingBrand) {
      return res.status(409).json({ 
        success: false,
        error: 'Brand with this name already exists in your account' 
      });
    }
    
    const brand = await Brand.create(brandData);
    
    res.status(201).json({
      success: true,
      message: 'Brand created successfully',
      data: brand
    });
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create brand' 
    });
  }
};

/**
 * Update brand
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const brandData = req.body;
    
    const brand = await Brand.findByPk(id);
    
    if (!brand) {
      return res.status(404).json({ 
        success: false,
        error: 'Brand not found' 
      });
    }
    
    // Check if brand name is unique (if being updated)
    if (brandData.name && brandData.name !== brand.name) {
      const existingBrand = await Brand.findOne({ 
        where: { 
          name: brandData.name,
          accountId: brand.accountId
        }
      });
      
      if (existingBrand) {
        return res.status(409).json({ 
          success: false,
          error: 'Brand with this name already exists in your account' 
        });
      }
    }
    
    await brand.update(brandData);
    
    res.json({
      success: true,
      message: 'Brand updated successfully',
      data: brand
    });
  } catch (error) {
    console.error('Error updating brand:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update brand' 
    });
  }
};

/**
 * Delete brand
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    
    const brand = await Brand.findByPk(id);
    
    if (!brand) {
      return res.status(404).json({ 
        success: false,
        error: 'Brand not found' 
      });
    }
    
    await brand.destroy();
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete brand' 
    });
  }
};
