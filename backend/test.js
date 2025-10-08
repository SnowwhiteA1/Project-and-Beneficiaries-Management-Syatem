const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'jumpstart_project_and_beneficiary_management_system',
  password: 'YOUR_PASSWORD',
  port: 5432,
});

async function test() {
  try {
    const res = await pool.query('SELECT * FROM projects;');
    console.log(res.rows);
    pool.end();
  } catch (err) {
    console.error('Error connecting to DB:', err);
  }
}

test();
