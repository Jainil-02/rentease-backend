const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const pool = require('./config/db')
const { requireAuth } = require('./middlewares/authMiddleware.js')

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}))
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/items', require('./routes/itemRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

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