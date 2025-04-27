const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure nodemailer (use your email service credentials)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: 'If your email is registered, you will receive a reset link.' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    const resetUrl = `http://localhost:3000/reset-password/${token}`;
    await transporter.sendMail({
      to: user.email,
      subject: 'Password Reset',
      html: `<p>You requested a password reset.</p><p>Click <a href="${resetUrl}">here</a> to reset your password. This link will expire in 1 hour.</p>`
    });
    res.status(200).json({ message: 'If your email is registered, you will receive a reset link.' });
  } catch (err) {
    res.status(500).json({ message: 'Error sending reset email.' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.status(200).json({ message: 'Password reset successful!' });
  } catch (err) {
    res.status(500).json({ message: 'Error resetting password.' });
  }
};

exports.updateAddress = async (req, res) => {
  const { id } = req.params;
  const { phone, addresses } = req.body;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (phone !== undefined) user.phone = phone;
    if (Array.isArray(addresses)) user.addresses = addresses;
    await user.save();
    res.status(200).json({ message: 'Profile updated', phone: user.phone, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile' });
  }
};

// Handle profile picture upload
exports.uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Optionally remove old image if you want
    user.profilePic = `/uploads/profile-pics/${req.file.filename}`;
    await user.save();
    res.status(200).json({ url: user.profilePic });
  } catch (err) {
    res.status(500).json({ message: 'Error uploading profile picture' });
  }
};
