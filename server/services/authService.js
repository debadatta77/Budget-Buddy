/**
 * ============================================================================
 * Authentication & Security Service
 * ============================================================================
 * Pure business logic for bcrypt password hashing, JWT token issuance,
 * token verification, and credential format validation.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const DEFAULT_JWT_SECRET = 'budget_buddy_super_secret_jwt_key_2026';

/**
 * Hashes a plaintext password using bcrypt
 *
 * @param {string} password - Raw user password
 * @returns {Promise<string>} Salted hash string
 */
export const hashPassword = async (password) => {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compares plaintext password against stored bcrypt hash
 *
 * @param {string} password - Plaintext password
 * @param {string} hash - Stored hash
 * @returns {Promise<boolean>} True if match, false otherwise
 */
export const verifyPassword = async (password, hash) => {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
};

/**
 * Issues signed JWT token for authenticated user
 *
 * @param {Object} payload - Token payload ({ id, email, name })
 * @param {string} [secret] - JWT secret (falls back to process.env.JWT_SECRET)
 * @param {string} [expiresIn] - Expiry string (default '7d')
 * @returns {string} Signed JWT Bearer token
 */
export const generateToken = (payload = {}, secret = null, expiresIn = '7d') => {
  const jwtSecret = secret || process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
  return jwt.sign(payload, jwtSecret, { expiresIn });
};

/**
 * Verifies JWT token and extracts decoded payload
 *
 * @param {string} token - Raw JWT string
 * @param {string} [secret] - JWT secret
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token, secret = null) => {
  const jwtSecret = secret || process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
  return jwt.verify(token, jwtSecret);
};

/**
 * Validates email format using RFC 5322 regex pattern
 *
 * @param {string} email - Email address
 * @returns {boolean} True if valid email format
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
};

/**
 * Validates password meets baseline security standards (min 6 characters)
 *
 * @param {string} password - User password
 * @returns {{ valid: boolean, message: string }}
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }
  return { valid: true, message: 'Password is valid' };
};
