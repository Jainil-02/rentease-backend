const adminService = require('../services/adminService')

async function listPendingItems(req, res) {
    try {
        const items = await adminService.getPendingItems();
        res.json({ items });
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
}

async function approveItem(req, res) {
    try {
        const { id } = req.params;
        const item = await adminService.approveItem(id);
        res.json({ item });
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
}

async function rejectItem(req, res) {
    try {
        const { id } = req.param;
        const { reason } = req.body;

        if(!reason) {
            return res.status(400).json({ error: 'Rejection reason is required' })
        }

        const item = await adminService.rejectItem(id, reason);
        res.json({ item });
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
}

module.exports = { listPendingItems, approveItem, rejectItem }