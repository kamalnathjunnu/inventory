const { sequelize, Account, User, Role } = require('../models');

/**
 * Register a new account
 * Creates account and admin user in a transaction
 */
exports.register = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { companyName, phone, legalName, gstNumber, panNumber, email, addressLine1, addressLine2, city, state, postalCode, country } = req.body;
    
    // Validate required fields
    if (!companyName || !phone) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        error: 'Company name and phone are required' 
      });
    }
    
    // Check if account already exists
    const existingAccount = await Account.findOne({ 
      where: { phone },
      transaction 
    });
    
    if (existingAccount) {
      await transaction.rollback();
      return res.status(409).json({ 
        success: false, 
        error: 'Account with this phone number already exists' 
      });
    }
    
    // Check if legal name is unique (if provided)
    if (legalName) {
      const existingLegalName = await Account.findOne({ 
        where: { legalName },
        transaction 
      });
      
      if (existingLegalName) {
        await transaction.rollback();
        return res.status(409).json({ 
          success: false, 
          error: 'Account with this legal name already exists' 
        });
      }
    }
    
    // Check if GST number is unique (if provided)
    if (gstNumber) {
      const existingGst = await Account.findOne({ 
        where: { gstNumber },
        transaction 
      });
      
      if (existingGst) {
        await transaction.rollback();
        return res.status(409).json({ 
          success: false, 
          error: 'Account with this GST number already exists' 
        });
      }
    }
    
    // Check if PAN number is unique (if provided)
    if (panNumber) {
      const existingPan = await Account.findOne({ 
        where: { panNumber },
        transaction 
      });
      
      if (existingPan) {
        await transaction.rollback();
        return res.status(409).json({ 
          success: false, 
          error: 'Account with this PAN number already exists' 
        });
      }
    }
    
    // Create account
    const account = await Account.create({
      companyName,
      legalName,
      gstNumber,
      panNumber,
      email,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isActive: true
    }, { transaction });
    
    // Get admin role
    let adminRole = await Role.findOne({ 
      where: { name: 'admin' },
      transaction 
    });
    
    // Create admin role if it doesn't exist
    if (!adminRole) {
      adminRole = await Role.create({
        name: 'admin',
        description: 'Administrator with full access'
      }, { transaction });
    }
    
    // Create admin user for the account
    const user = await User.create({
      phone,
      name: 'Admin User',
      isActive: true,
      roleId: adminRole.id,
      accountId: account.id
    }, { transaction });
    
    // Generate OTP for first login
    const DEFAULT_OTP = '123456';
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await user.update({
      otpCode: DEFAULT_OTP,
      otpExpiresAt: otpExpiresAt
    }, { transaction });
    
    await transaction.commit();
    
    // Log OTP for development
    console.log(`Account created. OTP for ${phone}: ${DEFAULT_OTP}`);
    
    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please verify OTP to login.',
      data: {
        account: {
          id: account.id,
          companyName: account.companyName,
          phone: account.phone
        },
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name
        },
        // For development - include OTP in response
        otp: process.env.NODE_ENV === 'development' ? DEFAULT_OTP : undefined
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating account:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create account' 
    });
  }
};

/**
 * Get account details by ID
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const account = await Account.findByPk(id);
    
    if (!account) {
      return res.status(404).json({ 
        success: false, 
        error: 'Account not found' 
      });
    }
    
    res.json({
      success: true,
      data: account
    });
    
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch account' 
    });
  }
};

/**
 * Update account details
 * Phone number cannot be updated
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName, legalName, gstNumber, panNumber, email, phone, addressLine1, addressLine2, city, state, postalCode, country, logo } = req.body;
    
    const account = await Account.findByPk(id);
    
    if (!account) {
      return res.status(404).json({ 
        success: false, 
        error: 'Account not found' 
      });
    }
    
    // Phone number cannot be updated
    if (phone && phone !== account.phone) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number cannot be updated' 
      });
    }
    
    // Check for unique constraints
    if (legalName && legalName !== account.legalName) {
      const existingLegalName = await Account.findOne({ 
        where: { legalName }
      });
      
      if (existingLegalName) {
        return res.status(409).json({ 
          success: false, 
          error: 'Account with this legal name already exists' 
        });
      }
    }
    
    if (gstNumber && gstNumber !== account.gstNumber) {
      const existingGst = await Account.findOne({ 
        where: { gstNumber }
      });
      
      if (existingGst) {
        return res.status(409).json({ 
          success: false, 
          error: 'Account with this GST number already exists' 
        });
      }
    }
    
    if (panNumber && panNumber !== account.panNumber) {
      const existingPan = await Account.findOne({ 
        where: { panNumber }
      });
      
      if (existingPan) {
        return res.status(409).json({ 
          success: false, 
          error: 'Account with this PAN number already exists' 
        });
      }
    }
    
    // Update account (phone excluded)
    await account.update({
      companyName: companyName || account.companyName,
      legalName: legalName || account.legalName,
      gstNumber: gstNumber !== undefined ? gstNumber : account.gstNumber,
      panNumber: panNumber !== undefined ? panNumber : account.panNumber,
      email: email !== undefined ? email : account.email,
      addressLine1: addressLine1 !== undefined ? addressLine1 : account.addressLine1,
      addressLine2: addressLine2 !== undefined ? addressLine2 : account.addressLine2,
      city: city !== undefined ? city : account.city,
      state: state !== undefined ? state : account.state,
      postalCode: postalCode !== undefined ? postalCode : account.postalCode,
      country: country !== undefined ? country : account.country,
      logo: logo !== undefined ? logo : account.logo
    });
    
    res.json({
      success: true,
      message: 'Account updated successfully',
      data: account
    });
    
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update account' 
    });
  }
};
