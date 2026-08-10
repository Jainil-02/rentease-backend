const pool = require('../config/db');

async function addItem({owner_id, title, description, category, price, rental_unit, images}){

    const result = await pool.query(
        `INSERT into items (owner_id, title, description, category, price, rental_unit, images)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, owner_id, title, description, category, price, rental_unit, images, listing_status, created_at`,
        [owner_id, title, description, category, price, rental_unit, images]
    )

    return result.rows[0]
}

async function getPublicItems({ category, search, page = 1, limit = 12}) {
    const conditions = [`listing_status = 'APPROVED'`];
    const values = [];

    if(category) {
        values.push(category);
        conditions.push(`category = $${values.length}`);
    }

    if(search) {
        values.push(`%${search}%`);
        conditions.push(`title ILIKE $${values.length}`);
    }

    const whereClause = conditions.join(' AND ');
    const offset = (page - 1) * limit;

    values.push(limit, offset);

    const result = await pool.query(
        `SELECT id, owner_id, title, category, price, rental_unit, images, created_at
         FROM items
         WHERE ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${values.length - 1} OFFSET $${values.length}`,
        values
    );

    return result.rows;
}

async function getPublicItemById(id){
    const result = await pool.query(
        `SELECT i.*, u.name AS owner_name
         FROM items i
         JOIN users u ON u.id = i.owner_id
         where i.id = $1 AND i.listing_status = 'APPROVED'`,
         [id]
    );

    if (result.rows.length === 0) {
        throw new Error('Item not found or not available');
    }
    return result.rows[0]
}

module.exports = { addItem, getPublicItems, getPublicItemById };