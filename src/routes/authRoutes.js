const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middlewares/authMiddleware.js')

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', requireAuth, authController.me)
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({message: 'Logged out'})
})

module.exports = router;