const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// PostgreSQL pool
const pool = new Pool({
  user: 'postgres',          // your postgres username
  host: 'localhost',
  database: ' JumpStart_Project_and_Beneficiary_Management_System', // your database name
  password: 'admin123', // replace with your postgres password
  port: 5000,
});

// Test endpoint
app.get('/', (req, res) => {
  res.send('Backend is running');
});

// Get all projects
app.get('/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching projects:", err.message);
    res.status(500).send('Server Error');
  }
});

// Add a new project
app.post('/projects', async (req, res) => {
  try {
    const { title, description, start_date, end_date, participants, accreditors } = req.body;

    const result = await pool.query(
      `INSERT INTO projects (title, description, start_date, end_date, participants, accreditors) 
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [title, description, start_date, end_date, participants, accreditors]
    );

    res.json({ success: true, project: result.rows[0] });
  } catch (err) {
    console.error("Error adding project:", err.message);
    res.status(500).json({ success: false, message: "Could not add project" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
