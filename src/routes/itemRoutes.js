const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { requireAuth } = require('../middlewares/authMiddleware')

router.post('/', requireAuth, itemController.createItem);
router.get('/', itemController.listItems);
router.get('/:id', itemController.getItemById)

module.exports = router;