const express = require('express')
const pool = require('./config/db')

const app = express();
const PORT = process.env.PORT || 5000;

app.get('/api/health', async (req, res) => {
    try{
        const result = await pool.query('SELECT NOW()');
        res.json({
            status: 'ok',
            message: 'Backend and Database connected successfully',
            dbTime: result.rows[0].now,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({status: 'error', message: 'Database connection failed'});
    }
})

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});