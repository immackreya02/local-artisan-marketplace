const User = require('../models/User');
const Shop = require('../models/Shop');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Register a new user (Customer or Artisan)
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role, shopName, location, phone, description, category } = req.body;

    // 1. Mandatory field validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // 2. Email format validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // 3. Password minimum length check
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // 4. Block public registration as admin
    const requestedRole = (role || 'customer').toLowerCase();
    if (requestedRole === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Public registration as admin is strictly prohibited'
      });
    }

    if (!['customer', 'artisan'].includes(requestedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Allowed roles for registration are customer or artisan'
      });
    }

    // 5. Check if user email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email address'
      });
    }

    // 6. Set user status according to project workflow
    // Customers are Active immediately; Artisans start as Pending awaiting admin approval
    const userStatus = requestedRole === 'artisan' ? 'Pending' : 'Active';

    // 7. Create User
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: requestedRole,
      status: userStatus,
      location: location || '',
      phone: phone || ''
    });

    // 8. If Artisan, create initial Pending Shop storefront
    let createdShop = null;
    if (requestedRole === 'artisan') {
      const finalDesc = description || (req.body.shop && req.body.shop.description) || 'Authentic handmade creations from local Indian artisans.';
      const finalCategory = category || (req.body.shop && req.body.shop.category) || 'Handmade Crafts';
      createdShop = await Shop.create({
        name: shopName || `${name}'s Artisan Shop`,
        owner: user._id,
        ownerName: name,
        category: finalCategory,
        description: finalDesc,
        location: location || '',
        phone: phone || '',
        email: email.toLowerCase(),
        status: 'Pending'
      });
    }

    // 9. Generate JWT Token
    const token = generateToken(user._id, user.role);

    // 10. Clean user output (password omitted automatically via select: false)
    return res.status(201).json({
      success: true,
      message: requestedRole === 'artisan'
        ? 'Artisan registration successful! Account and shop are pending admin approval.'
        : 'Customer registration successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        location: user.location
      },
      shop: createdShop ? { id: createdShop._id, name: createdShop.name, status: createdShop.status } : null
    });
  } catch (error) {
    console.error('Register Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
};

/**
 * @desc    Authenticate user & get token (Login)
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Field validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanPassword = typeof password === 'string' ? password.trim() : '';

    // 2. Find user & explicitly select password
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    // Demo accounts convenience: allow password123, admin123, or the original seeded password
    const isDemoAccount = ['admin@lam.in', 'artisan@lam.in', 'customer@lam.in'].includes(cleanEmail);
    const isDemoPassword = isDemoAccount && (
      cleanPassword === 'password123' ||
      cleanPassword === 'admin123' ||
      (cleanEmail === 'admin@lam.in' && (cleanPassword === 'ArtisanAdmin#2026!' || cleanPassword === 'admin')) ||
      (cleanEmail === 'artisan@lam.in' && cleanPassword === 'JaipurArtisan#2026!') ||
      (cleanEmail === 'customer@lam.in' && cleanPassword === 'CraftCustomer#2026!')
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = isDemoPassword || (await user.matchPassword(password)) || (await user.matchPassword(cleanPassword));

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // 3. Status checks: Block Suspended and Rejected users
    if (user.status === 'Suspended' || user.status === 'Rejected') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status}. Access denied.`
      });
    }

    // Note: Pending artisans ARE allowed to log in per existing frontend workflow!

    // 4. Generate JWT
    const token = generateToken(user._id, user.role);

    // 5. Clean user response
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        location: user.location
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
};

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private (Protected)
 */
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        status: req.user.status,
        phone: req.user.phone,
        location: req.user.location,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('GetMe Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching user profile'
    });
  }
};

/**
 * @desc    Google OAuth 2.0 Login / Authentication
 * @route   POST /api/auth/google
 * @access  Public
 */
const googleLogin = async (req, res) => {
  try {
    const { idToken, credential, token: inputToken } = req.body;
    const rawToken = idToken || credential || inputToken;

    if (!rawToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required'
      });
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '1082345678901-placeholder.apps.googleusercontent.com';

    let payload;
    try {
      let OAuth2Client;
      try {
        OAuth2Client = require('google-auth-library').OAuth2Client;
      } catch (e) {
        OAuth2Client = null;
      }

      if (OAuth2Client) {
        const client = new OAuth2Client(googleClientId);
        const ticket = await client.verifyIdToken({
          idToken: rawToken,
          audience: googleClientId
        });
        payload = ticket.getPayload();
      } else {
        // Fallback: Verify token using Google tokeninfo REST API
        const https = require('https');
        payload = await new Promise((resolve, reject) => {
          https.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(rawToken)}`, (response) => {
            let body = '';
            response.on('data', chunk => body += chunk);
            response.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                if (parsed.error_description || parsed.error) {
                  reject(new Error(parsed.error_description || parsed.error));
                } else {
                  resolve(parsed);
                }
              } catch (err) {
                reject(err);
              }
            });
          }).on('error', reject);
        });
      }
    } catch (err) {
      console.error('Google ID Token Verification Failed:', err.message);
      return res.status(401).json({
        success: false,
        message: `Google authentication failed: ${err.message}`
      });
    }

    if (!payload || !payload.email) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token payload'
      });
    }

    const issuer = payload.iss;
    if (issuer !== 'accounts.google.com' && issuer !== 'https://accounts.google.com') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token issuer'
      });
    }

    // Never trust client-supplied name/email. Always use verified token payload!
    const googleId = payload.sub;
    const email = payload.email.toLowerCase();
    const name = payload.name || payload.given_name || email.split('@')[0];
    const picture = payload.picture || '';

    let user = await User.findOne({ $or: [{ email }, { googleId }] });

    if (!user) {
      // Create a new customer user with Google verified identity
      const randomPassword = `G_${Math.random().toString(36).slice(-8)}${Date.now()}!`;
      user = await User.create({
        name,
        email,
        password: randomPassword,
        role: 'customer',
        status: 'Active',
        googleId,
        profileImage: picture,
        location: 'Google Verified'
      });
    } else {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    }

    if (user.status === 'Suspended' || user.status === 'Rejected') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status}. Access denied.`
      });
    }

    // Issue application JWT Token using our existing JWT system
    const appToken = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      token: appToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone || '',
        location: user.location || ''
      }
    });
  } catch (error) {
    console.error('Google OAuth Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during Google OAuth authentication'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  googleLogin
};

