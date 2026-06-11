const bcrypt = require('bcryptjs');

const users = [];
let nextId = 1;

const UserModel = {
  findByEmail(email) {
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },
  findById(id) {
    return users.find(u => u.id === id) || null;
  },
  all() {
    return users.map(({ password, ...safe }) => safe);
  },
  async create({ name, email, password, phone = '', role = 'user', status = 'active' }) {
    const hashed = await bcrypt.hash(password, 10);
    const user = { id: nextId++, name, email: email.toLowerCase(), password: hashed, phone, role, status, createdAt: new Date().toISOString() };
    users.push(user);
    const { password: _, ...safe } = user;
    return safe;
  },
  async checkPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  },
  update(id, updates) {
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    const { password, ...safeUpdates } = updates;
    users[idx] = { ...users[idx], ...safeUpdates };
    const { password: _, ...safe } = users[idx];
    return safe;
  },
  delete(id) {
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return false;
    users.splice(idx, 1);
    return true;
  },
};

users.push({
  id: nextId++,
  name: 'Alex Morgan',
  email: 'admin@demo.com',
  password: '$2b$10$ssdNP/P.SHsTn/bib8K2A.n4Hiuvt4pfaYzi5Md2NaosJewCeQzR2',
  phone: '',
  role: 'admin',
  status: 'active',
  createdAt: new Date().toISOString(),
});

console.log('✓ Seeded: admin@demo.com / admin123');

module.exports = UserModel;