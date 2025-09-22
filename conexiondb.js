require('dotenv').config();
const { Pool } = require('pg');


const pool = new Pool({
  user: process.env.DB_USER, 
  host: process.env.DB_HOST,
  /*host: 'dpg-d241k41r0fns73am15ug-a',*/
  database: process.env.DB_DATABASE, 
  password: process.env.DB_PASSWORD, 
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  }
});



module.exports = pool;