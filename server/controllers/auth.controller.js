const { User, Account, Role } = require('../models');
const { generateToken } = require('../middleware/auth');

// Default OTP for testing (in production, this would be sent via SMS)
const DEFAULT_OTP = '123456';

// In-memory OTP storage (in production, use Redis or database)
const otpStore = new Map();

/**
 * Send OTP to user's phone
 * POST /api/auth/send-otp
 */
exports.sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }
    
    // Check if user exists
    const user = await User.findOne({ where: { phone } });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found with this phone number'
      });
    }
    
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'User account is inactive'
      });
    }
    
    // Generate OTP (using default for now)
    const otp = DEFAULT_OTP;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Store OTP with expiry
    otpStore.set(phone, {
      otp,
      expiresAt,
      attempts: 0
    });
    
    // Update user with OTP info
    await user.update({
      otpCode: otp,
      otpExpiresAt: expiresAt
    });
    
    // In production, send OTP via SMS here
    console.log(`OTP for ${phone}: ${otp}`);
    
    res.json({
      success: true,
      message: 'OTP sent successfully',
      // For development/testing, include OTP in response
      // Remove this in production!
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP'
    });
  }
};

/**
 * Verify OTP and login
 * POST /api/auth/verify-otp
 */
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and OTP are required'
      });
    }
    
    // Get user
    const user = await User.findOne({
      where: { phone },
      include: [
        { model: Account, as: 'accountData' },
        { model: Role, as: 'roleData' }
      ]
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check OTP from store
    const storedOTP = otpStore.get(phone);
    
    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        error: 'OTP not found or expired. Please request a new OTP.'
      });
    }
    
    // Check if OTP expired
    if (new Date() > storedOTP.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json({
        success: false,
        error: 'OTP has expired. Please request a new OTP.'
      });
    }
    
    // Check OTP attempts
    if (storedOTP.attempts >= 5) {
      otpStore.delete(phone);
      return res.status(429).json({
        success: false,
        error: 'Too many failed attempts. Please request a new OTP.'
      });
    }
    
    // Verify OTP
    if (storedOTP.otp !== otp) {
      storedOTP.attempts += 1;
      return res.status(401).json({
        success: false,
        error: 'Invalid OTP',
        attemptsRemaining: 5 - storedOTP.attempts
      });
    }
    
    // OTP is valid - clear it
    otpStore.delete(phone);
    
    // Update last login
    await user.update({
      lastLogin: new Date(),
      otpCode: null,
      otpExpiresAt: null
    });
    
    // Generate JWT token
    const token = generateToken(user.id, user.accountId);
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        role: user.roleData?.name,
        accountId: user.accountId,
        account: {
          id: user.accountData?.id,
          companyName: user.accountData?.companyName,
          legalName: user.accountData?.legalName
        }
      }
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP'
    });
  }
};

/**
 * Get current user info
 * GET /api/auth/me
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        { model: Account, as: 'accountData' },
        { model: Role, as: 'roleData' }
      ]
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        role: user.roleData?.name,
        accountId: user.accountId,
        account: {
          id: user.accountData?.id,
          companyName: user.accountData?.companyName,
          legalName: user.accountData?.legalName,
          gstin: user.accountData?.gstin
        }
      }
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user information'
    });
  }
};

/**
 * Logout (client-side only, just invalidate token)
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is mainly client-side
    // The client should remove the token
    // Optionally, you could maintain a token blacklist in Redis
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to logout'
    });
  }
};
