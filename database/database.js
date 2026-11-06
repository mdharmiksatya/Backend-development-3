const path = require('path');
const fs = require('fs');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

// Resolve database file path, supporting Render Persistent Disks via DATABASE_PATH env var
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'books.db');
let db = null;

/**
 * Initializes the SQLite database connection.
 * Creates the table if missing and seeds records ONLY if the table is completely empty.
 * Never resets or overwrites existing records on server restart.
 */
async function initializeDB() {
  if (db) return db;

  try {
    // Ensure parent directory exists (especially for mounted volumes like /var/data)
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Check if table 'book' exists
    const tableCheck = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='book';"
    );

    if (!tableCheck) {
      console.log('Table "book" does not exist. Initializing schema and seed data...');
      const initSqlPath = path.join(__dirname, 'init_db.sql');
      if (fs.existsSync(initSqlPath)) {
        const initSql = fs.readFileSync(initSqlPath, 'utf-8');
        await db.exec(initSql);
        console.log('Database schema and initial seed data created from init_db.sql');
      }
    } else {
      // Table exists: ONLY seed if table is completely empty
      const countResult = await db.get('SELECT COUNT(*) AS count FROM book;');
      if (countResult && countResult.count === 0) {
        console.log('Table "book" is empty. Seeding initial records...');
        const initSqlPath = path.join(__dirname, 'init_db.sql');
        if (fs.existsSync(initSqlPath)) {
          const initSql = fs.readFileSync(initSqlPath, 'utf-8');
          await db.exec(initSql);
          console.log('Seed records inserted.');
        }
      } else {
        console.log(`Database ready. Existing records found: ${countResult.count}`);
      }
    }

    return db;
  } catch (error) {
    console.error(`Database Initialization Error: ${error.message}`);
    throw error;
  }
}

/**
 * Returns active database instance.
 */
function getDB() {
  if (!db) {
    throw new Error('Database has not been initialized. Call initializeDB() first.');
  }
  return db;
}

module.exports = {
  initializeDB,
  getDB,
  dbPath,
};
