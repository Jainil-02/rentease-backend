const express = require('express');
const router = express.Router();
const { requireAdmin, requireAuth} = require('../middlewares/authMiddleware');
const adminController = require('../controllers/adminController');

router.use( requireAuth, requireAdmin );

router.get('/items', adminController.listPendingItems);
router.patch('/items/:id/approve', adminController.approveItem);
router.patch('/items/:id/reject', adminController.rejectItem);

module.exports = router;