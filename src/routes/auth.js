const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const router = express.Router();

function readCredentials(body) {
  const { email, password } = body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') return null;
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail) || password.length < 8 ||
      Buffer.byteLength(password, 'utf8') > 72) return null;
  return { email: normalizedEmail, password };
}

router.post('/register', async (req, res) => {
  const cred = readCredentials(req.body);
  if (!cred) return res.status(400).json({ error: 'Can email hop le va mat khau tu 8 ky tu, toi da 72 byte' });
  if (await User.exists({ email: cred.email })) {
    return res.status(409).json({ error: 'Email da duoc dang ky' });
  }
  const passwordHash = await bcrypt.hash(cred.password, 10);
  try {
    const user = await User.create({ email: cred.email, passwordHash });
    res.status(201).json({ id: user._id, email: user.email });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email da duoc dang ky' });
    throw err;
  }
});

router.post('/login', async (req, res) => {
  const cred = readCredentials(req.body);
  const user = cred && (await User.findOne({ email: cred.email }));
  const ok = user && (await bcrypt.compare(cred.password, user.passwordHash));
  if (!ok) return res.status(401).json({ error: 'Sai email hoac mat khau' });
  const token = jwt.sign({ sub: user._id.toString(), email: user.email },
    process.env.JWT_SECRET, { expiresIn: '1h', algorithm: 'HS256' });
  res.json({ token });
});

module.exports = router;
