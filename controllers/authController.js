
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ success: false, msg: 'User already exists' });

    user = new User({ name, email, password });
    await user.save();

    const payload = {
      user: {
        id: user._id,
        name: user.name,
      }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ success: true, token });
  } catch (err) {
    console.error('Registration Error:', err.message);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const payload = {
      user: {
        id: user._id,
        name: user.name,
      }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ success: true, token });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, msg: 'User not found' });

    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('GetMe Error:', err.message);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};
