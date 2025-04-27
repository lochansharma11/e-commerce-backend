const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Google Auth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/' }), async (req, res) => {
  // Issue JWT and redirect or respond with token
  const token = jwt.sign({ id: req.user._id, isAdmin: req.user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.redirect(`http://localhost:3000/login?token=${token}`); // Adjust frontend URL as needed
});

// Facebook Auth
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback', passport.authenticate('facebook', { session: false, failureRedirect: '/' }), async (req, res) => {
  const token = jwt.sign({ id: req.user._id, isAdmin: req.user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.redirect(`http://localhost:3000/login?token=${token}`); // Adjust frontend URL as needed
});

module.exports = router;
