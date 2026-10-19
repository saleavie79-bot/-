require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('Set DATABASE_URL first.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false }
});

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        national_id_hash TEXT PRIMARY KEY,
        student_name TEXT NOT NULL,
        name_normalized TEXT NOT NULL,
        student_code TEXT NOT NULL,
        username TEXT NOT NULL,
        password_encrypted TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS students_name_normalized_idx ON students(name_normalized);
    `);
    console.log('Database schema is ready.');
  } catch {
    console.error('Could not initialize the database. Check DATABASE_URL and database permissions.');
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
