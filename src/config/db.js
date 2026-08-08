const { Pool } = require('pg');
require('dotenv').config();

const poll = new Pool({
    connectionString: process.env.DATABASE_URL
})

module.exports = poll;