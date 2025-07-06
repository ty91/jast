import * as SQLite from 'expo-sqlite'

const DATABASE_NAME = 'jast.db'

export const db = SQLite.openDatabaseSync(DATABASE_NAME)

export const initializeDatabase = async () => {
  // Create table if not exists
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id INTEGER,
      title TEXT NOT NULL,
      status INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_deleted INTEGER DEFAULT 0,
      FOREIGN KEY (parent_id) REFERENCES todos(id)
    );
  `)

  // Check if status column exists, if not add it (migration)
  const tableInfo = await db.getAllAsync(`PRAGMA table_info(todos);`)
  const hasStatusColumn = tableInfo.some((column: any) => column.name === 'status')

  if (!hasStatusColumn) {
    await db.execAsync(`ALTER TABLE todos ADD COLUMN status INTEGER DEFAULT 0;`)
  }
}
