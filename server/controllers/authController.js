import User from '../models/User.js';
import Budget from '../models/Budget.js';
import Vault from '../models/Vault.js';
import ReportSettings from '../models/ReportSettings.js';
import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  validateEmail, 
  validatePassword 
} from '../services/authService.js';

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const passCheck = validatePassword(password);
    if (!passCheck.valid) {
      return res.status(400).json({
        success: false,
        message: passCheck.message
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: `An account with email "${normalizedEmail}" already exists. Please Sign In.`
      });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    // Initialize Default User Entities (Clean Zero Baseline for new user)
    await Budget.create({
      userId: newUser._id,
      monthlyIncome: 0,
      categories: []
    });

    await Vault.create({
      userId: newUser._id,
      current: 0,
      target: 100000
    });

    await ReportSettings.create({
      userId: newUser._id,
      email: normalizedEmail
    });

    const token = generateToken({
      id: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name
    });

    return res.status(201).json({
      success: true,
      message: `Account created successfully for ${newUser.name}`,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        currency: newUser.currency,
        planTier: newUser.planTier,
        accountUid: newUser.accountUid
      }
    });
  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during user registration',
      error: err.message
    });
  }
};

/**
 * User login & JWT issuance
 * POST /api/v1/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        reason: 'not_found',
        message: `No account found for "${normalizedEmail}". Please create an account first.`
      });
    }

    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        reason: 'invalid_password',
        message: 'Incorrect password! Please check your credentials.'
      });
    }

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name
    });

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        planTier: user.planTier,
        accountUid: user.accountUid
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication',
      error: err.message
    });
  }
};

/**
 * Logout
 * POST /api/v1/auth/logout
 */
export const logout = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};
