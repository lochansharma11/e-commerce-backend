const express = require('express');
const { getUsers, getOrders, markOrderDelivered } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/admin/users - Get all users (admin only)
router.get('/users', protect, admin, getUsers);

// GET /api/admin/orders - Get all orders (admin only)
router.get('/orders', protect, admin, getOrders);

// PUT /api/admin/orders/:id/deliver - Mark order as delivered (admin only)
router.put('/orders/:id/deliver', protect, admin, markOrderDelivered);

module.exports = router;
