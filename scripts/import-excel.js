require('dotenv').config();
const XLSX = require('xlsx');
const { Pool } = require('pg');
const { normalizeName, validNationalId, hashNationalId, encryptPassword } = require('../src/security');

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node scripts/import-excel.js "/path/to/AI INFO.xlsx"');
  process.exit(1);
}
if (!process.env.DATABASE_URL || !process.env.NATIONAL_ID_HMAC_KEY || !process.env.PASSWORD_ENCRYPTION_KEY) {
  console.error('Set DATABASE_URL, NATIONAL_ID_HMAC_KEY, and PASSWORD_ENCRYPTION_KEY in your local .env file.');
  process.exit(1);
}

function asText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return String(Math.trunc(value));
  return String(value).trim();
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
  max: 2
});

(async () => {
  let client;
  try {
    const workbook = XLSX.readFile(filePath, { cellDates: false, raw: true });
    const sheetName = workbook.SheetNames.find(n => /بيانات الطلاب/.test(n)) || workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '', raw: true });
    if (!rows.length) throw new Error('No student rows found.');

    const get = (row, candidates) => {
      const keys = Object.keys(row);
      const found = keys.find(k => candidates.includes(String(k).trim()));
      return found === undefined ? '' : row[found];
    };

    const validRows = [];
    let skipped = 0;
    for (const row of rows) {
      const studentName = asText(get(row, ['اسم الطالب', 'اسم الطالب ']));
      const studentCode = asText(get(row, ['الكود', 'كود الطالب']));
      const username = asText(get(row, ['اسم المستخدم', 'اسم المستخدم ']));
      const password = asText(get(row, ['كلمة المرور', 'كلمه المرور']));
      let nationalId = asText(get(row, ['الرقم القومي', 'الرقم القومى', 'الرقم القومي '])).replace(/\s/g, '');
      if (!studentName && !nationalId) continue;
      if (!studentName || !validNationalId(nationalId) || !studentCode || !username || !password) {
        skipped++;
        continue;
      }
      validRows.push({
        studentName,
        nameNormalized: normalizeName(studentName),
        nationalHash: hashNationalId(nationalId),
        studentCode,
        username,
        passwordEncrypted: encryptPassword(password)
      });
    }

    if (!validRows.length) throw new Error('No valid records. Check the worksheet column headings and national-ID formatting.');
    client = await pool.connect();
    await client.query('BEGIN');
    for (const row of validRows) {
      await client.query(`
        INSERT INTO students (national_id_hash, student_name, name_normalized, student_code, username, password_encrypted)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (national_id_hash) DO UPDATE SET
          student_name = EXCLUDED.student_name,
          name_normalized = EXCLUDED.name_normalized,
          student_code = EXCLUDED.student_code,
          username = EXCLUDED.username,
          password_encrypted = EXCLUDED.password_encrypted,
          updated_at = NOW()
      `, [row.nationalHash, row.studentName, row.nameNormalized, row.studentCode, row.username, row.passwordEncrypted]);
    }
    await client.query('COMMIT');
    console.log(`Import complete. Processed ${validRows.length} records; skipped ${skipped} incomplete/invalid rows.`);
    console.log('No student names, national IDs, usernames, or passwords were printed.');
  } catch (error) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch {}
    }
    console.error('Import failed:', error.message || 'Unknown error.');
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end();
  }
})();
