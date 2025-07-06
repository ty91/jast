import * as SQLite from 'expo-sqlite'

const DATABASE_NAME = 'jast.db'

export const db = SQLite.openDatabaseSync(DATABASE_NAME)

export const initializeDatabase = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id INTEGER,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_deleted INTEGER DEFAULT 0,
      FOREIGN KEY (parent_id) REFERENCES todos(id)
    );
  `)
}
