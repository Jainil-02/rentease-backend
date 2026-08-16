const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function registerUser({name, email, password}){
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if(existing.rows.length > 0){
        throw new Error('Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
        `INSERT INTO users (name, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, name, email, is_admin, created_at`,
        [name, email, passwordHash]
    );

    const user = result.rows[0]

    const token = jwt.sign(
        {userId: user.id, isAdmin: user.is_admin},
        process.env.JWT_SECRET,
        {expiresIn: process.env.JWT_EXPIRES_IN}
    );

    return {token, user}
}

async function loginUser({email, password}){
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if(!user){
        throw new Error('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if(!passwordMatches){
        throw new Error('Invalid email or password')
    }

    const token = jwt.sign(
        {userId: user.id, isAdmin: user.is_admin},
        process.env.JWT_SECRET,
        {expiresIn: process.env.JWT_EXPIRES_IN}
    );

    return {
        token,
        user: {id: user.id, name: user.name, email: user.email, is_admin: user.is_admin },
    };
}

module.exports = { registerUser, loginUser };