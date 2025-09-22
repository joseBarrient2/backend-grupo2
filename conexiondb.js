require('dotenv').config();
const { Pool } = require('pg');


const pool = new Pool({
  user: process.env.USER, 
  host: process.env.DB_HOST,
  /*host: 'dpg-d241k41r0fns73am15ug-a',*/
  database: process.env.DATABASE, 
  password: process.env.PASSWORD, 
  port: process.env.PORT,
  ssl: {
    rejectUnauthorized: false
  }
});



module.exports = pool;