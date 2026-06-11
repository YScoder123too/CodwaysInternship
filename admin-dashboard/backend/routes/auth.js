// routes/auth.js
const express = require('express');
const jwt     = require('jsonwebtoken');
const router  = express.Router();
const User    = require('../models/user');
const { requireAuth } = require('../middleware/auth');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * POST /api/auth/register
 * Register a new user.
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required.' });

    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });

    if (User.findByEmail(email))
      return res.status(409).json({ error: 'An account with this email already exists.' });

    const user = await User.create({ name, email, password, phone, role });
    const token = generateToken(user);

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate and return a JWT.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const dbUser = User.findByEmail(email);

    if (!dbUser)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const match = await User.checkPassword(password, dbUser.password);
    if (!match)
      return res.status(401).json({ error: 'Invalid email or password.' });

    if (dbUser.status === 'inactive')
      return res.status(403).json({ error: 'Account is inactive. Contact support.' });

    const { password: _, ...safeUser } = dbUser;
    const token = generateToken(safeUser);

    res.json({
      message: 'Login successful.',
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 * Protected route — requires valid JWT.
 */
router.get('/me', requireAuth, (req, res) => {
  const user = User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  const { password: _, ...safe } = user;
  res.json({ user: safe });
});

/**
 * POST /api/auth/logout
 * Client-side logout (JWT is stateless; instruct client to drop token).
 * For proper invalidation, implement a token blacklist or use short expiry + refresh tokens.
 */
router.post('/logout', requireAuth, (req, res) => {
  // In a real app: add token to a blacklist / invalidate refresh token here
  res.json({ message: 'Logged out successfully. Please discard your token.' });
});

module.exports = router;