const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres', 
  host: 'dpg-d2q9c86r433s73e2o5g0-a.oregon-postgres.render.com',
  /*host: 'dpg-d241k41r0fns73am15ug-a',*/
  database: 'apijwt2', 
  password: 'ywSSSX5dI781z0aMnwjXCOUdOcGcXzm5', 
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});



module.exports = pool;