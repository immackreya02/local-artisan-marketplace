const jwt = require('jsonwebtoken');

/**
 * Generate JWT token signed with JWT_SECRET from process.env
 * @param {string} id - User ObjectId
 * @param {string} role - User role
 * @returns {string} Signed JWT token
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

module.exports = generateToken;
