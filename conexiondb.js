const { Pool } = require('pg');

const pool = new Pool({
  user: 'jota', 
  /*host: 'dpg-d21dshbe5dus739qfq9g-a.oregon-postgres.render.com',*/
  host: 'dpg-d241k41r0fns73am15ug-a',
  database: 'apijwt_exc2', 
  password: 'jX8gJkGCJ7dqPN1Ky4rApGTLWObJnJBr', 
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});



module.exports = pool;