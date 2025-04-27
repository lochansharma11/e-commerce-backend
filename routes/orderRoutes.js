const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

// Use Razorpay test keys (replace with live keys in production)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_test_secret',
});

// Create new order
router.post('/', async (req, res) => {
  try {
    const { user, orderItems, shippingAddress, totalPrice } = req.body;
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ error: 'No order items' });
    }
    const order = new Order({
      user,
      orderItems,
      shippingAddress,
      totalPrice,
    });
    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get orders for a user
router.get('/myorders/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create Razorpay order
router.post('/create-razorpay-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
});

// Verify Razorpay payment
router.post('/verify-razorpay-payment', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'your_test_secret';
  const generated_signature = crypto
    .createHmac('sha256', key_secret)
    .update(razorpay_order_id + '|' + razorpay_payment_id)
    .digest('hex');
  if (generated_signature === razorpay_signature) {
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, error: 'Invalid signature' });
  }
});

// Verify Khalti payment
router.post('/verify-khalti-payment', async (req, res) => {
  const axios = require('axios');
  const { token, amount } = req.body;
  const secretKey = process.env.KHALTI_SECRET_KEY || 'test_secret_key_dc74b5e3b3a94b6c8c9b6c8e7a6b6a8b';
  try {
    const response = await axios.post(
      'https://khalti.com/api/v2/payment/verify/',
      { token, amount },
      { headers: { Authorization: `Key ${secretKey}` } }
    );
    if (response.data && response.data.idx) {
      res.json({ success: true, data: response.data });
    } else {
      res.status(400).json({ success: false, error: 'Khalti verification failed' });
    }
  } catch (err) {
    res.status(400).json({ success: false, error: err.response?.data?.detail || 'Khalti verification failed' });
  }
});

// Verify eSewa payment
router.post('/verify-esewa-payment', async (req, res) => {
  const axios = require('axios');
  const { amt, rid, pid, scd } = req.body;
  try {
    const params = new URLSearchParams();
    params.append('amt', amt);
    params.append('rid', rid);
    params.append('pid', pid);
    params.append('scd', scd);
    const response = await axios.post('https://uat.esewa.com.np/epay/transrec', params);
    // eSewa returns XML, e.g. <response><response_code>Success</response_code>...</response>
    if (response.data && response.data.includes('<response_code>Success</response_code>')) {
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, error: 'eSewa verification failed' });
    }
  } catch (err) {
    res.status(400).json({ success: false, error: 'eSewa verification failed' });
  }
});

module.exports = router;
