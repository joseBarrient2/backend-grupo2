const { Pool } = require('pg');

const pool = new Pool({
  user: 'javier2025', 
  host: 'dpg-d21dshbe5dus739qfq9g-a.oregon-postgres.render.com',
  database: 'apijwt_x7j5', 
  password: 'C07rRBXcd6AZTF1yZqZBCc2sluaQFVEj', 
  port: 5432,
});

module.exports = pool;