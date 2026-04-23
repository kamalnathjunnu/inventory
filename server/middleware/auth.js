const jwt = require('jsonwebtoken');
const { User, Account } = require('../models');

// Secret key for JWT - in production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user and account info to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token.'
      });
    }
    
    // Get user from database
    const user = await User.findByPk(decoded.userId, {
      include: [
        { model: Account, as: 'accountData', attributes: ['id', 'companyName', 'legalName'] }
      ]
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found.'
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'User account is inactive.'
      });
    }
    
    // Attach user info to request
    req.user = {
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      accountId: user.accountId,
      account: user.accountData
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed.'
    });
  }
};

/**
 * Generate JWT token for user
 */
const generateToken = (userId, accountId) => {
  return jwt.sign(
    { userId, accountId },
    JWT_SECRET,
    { expiresIn: '30d' } // Token expires in 30 days
  );
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't fail if token is missing
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findByPk(decoded.userId);
        
        if (user && user.isActive) {
          req.user = {
            id: user.id,
            phone: user.phone,
            name: user.name,
            email: user.email,
            roleId: user.roleId,
            accountId: user.accountId
          };
        }
      } catch (error) {
        // Token is invalid, but we don't fail - just continue without user
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticate,
  generateToken,
  optionalAuth,
  JWT_SECRET
};
