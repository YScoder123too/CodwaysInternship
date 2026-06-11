// routes/users.js
const express = require('express');
const router  = express.Router();
const User    = require('../models/user');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// All routes below require a valid JWT
router.use(requireAuth);

/**
 * GET /api/users
 * List all users (admin only).
 */
router.get('/', requireAdmin, (req, res) => {
  let list = User.all();

  // Optional query filters: ?role=admin&status=active&search=alex
  const { role, status, search } = req.query;
  if (role)   list = list.filter(u => u.role === role.toLowerCase());
  if (status) list = list.filter(u => u.status === status.toLowerCase());
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }

  res.json({ users: list, total: list.length });
});

/**
 * GET /api/users/:id
 * Get a single user. Admins can get any; regular users can only get themselves.
 */
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (req.user.role !== 'admin' && req.user.id !== id) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const user = User.findById(id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  const { password: _, ...safe } = user;
  res.json({ user: safe });
});

/**
 * POST /api/users
 * Create a user (admin only).
 */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, email, password, phone, role, status } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required.' });
    if (User.findByEmail(email))
      return res.status(409).json({ error: 'Email already in use.' });
    const user = await User.create({ name, email, password, phone, role, status });
    res.status(201).json({ message: 'User created.', user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

/**
 * PUT /api/users/:id
 * Update a user. Admins can update any; users can update only themselves (non-role fields).
 */
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (req.user.role !== 'admin' && req.user.id !== id)
    return res.status(403).json({ error: 'Access denied.' });

  const updates = req.body;

  // Non-admins cannot change their own role or status
  if (req.user.role !== 'admin') {
    delete updates.role;
    delete updates.status;
  }

  const updated = User.update(id, updates);
  if (!updated) return res.status(404).json({ error: 'User not found.' });
  res.json({ message: 'User updated.', user: updated });
});

/**
 * DELETE /api/users/:id
 * Delete a user (admin only). Admins cannot delete themselves.
 */
router.delete('/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  if (req.user.id === id)
    return res.status(400).json({ error: 'You cannot delete your own account.' });
  const deleted = User.delete(id);
  if (!deleted) return res.status(404).json({ error: 'User not found.' });
  res.json({ message: 'User deleted.' });
});

module.exports = router;