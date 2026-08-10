const pool = require('../config/db')

async function getPendingItems(){
    const result = await pool.query(
        `SELECT id, owner_id, title, category, price, rental_unit, created_at
         FROM items
         WHERE listing_status = 'PENDING_REVIEW'
         ORDER BY created_at ASC`
    );

    return result.rows
}

async function approveItem(itemId) {
    const result = await pool.query(
        `UPDATE items
         SET listing_status = 'APPROVED', updated_at = NOW()
         WHERE id = $1 AND listing_status = 'PENDING_REVIEW'
         RETURNING *`, 
        [itemId]
    );

    if (result.rows.length === 0) {
        throw new Error('Item not found or not pending review');
    }
    return result.rows[0];
}

async function rejectItem(itemId, reason){
    const result = await pool.query(
        `UPDATE items
         SET listing_status = 'REJECTED', rejection_reason = $2, updated_at = NOW()
         WHERE id = $1 AND listing_status = 'PENDING_REVIEW
         RETURNING *`,
        [itemId, reason]
    )

    if (result.rows.length === 0) {
        throw new Error('Item not found or not pending review');
    }
    return result.rows[0]
}

module.exports = { getPendingItems, approveItem, rejectItem }