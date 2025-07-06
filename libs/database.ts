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
      position INTEGER NOT NULL DEFAULT 0,
      target_date INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_deleted INTEGER DEFAULT 0,
      FOREIGN KEY (parent_id) REFERENCES todos(id)
    );
  `)

  // Check if columns exist, if not add them (migration)
  const tableInfo = await db.getAllAsync(`PRAGMA table_info(todos);`)
  const hasStatusColumn = tableInfo.some((column: any) => column.name === 'status')
  const hasPositionColumn = tableInfo.some((column: any) => column.name === 'position')
  const hasTargetDateColumn = tableInfo.some((column: any) => column.name === 'target_date')

  if (!hasStatusColumn) {
    await db.execAsync(`ALTER TABLE todos ADD COLUMN status INTEGER DEFAULT 0;`)
  }

  if (!hasPositionColumn) {
    await db.execAsync(`ALTER TABLE todos ADD COLUMN position INTEGER NOT NULL DEFAULT 0;`)

    // Assign initial positions to existing todos
    const todos = await db.getAllAsync(`SELECT id, parent_id FROM todos WHERE is_deleted = 0 ORDER BY id;`)
    const todosByParent = new Map<number | null, any[]>()

    // Group by parent
    todos.forEach((todo: any) => {
      const parentId = todo.parent_id
      if (!todosByParent.has(parentId)) {
        todosByParent.set(parentId, [])
      }
      todosByParent.get(parentId)!.push(todo)
    })

    // Assign positions
    for (const [, children] of todosByParent) {
      for (let i = 0; i < children.length; i++) {
        await db.runAsync(`UPDATE todos SET position = ? WHERE id = ?`, [i + 1, children[i].id])
      }
    }
  }

  if (!hasTargetDateColumn) {
    // Add target_date column with default value
    await db.execAsync(`ALTER TABLE todos ADD COLUMN target_date INTEGER NOT NULL DEFAULT 0;`)

    // Migrate existing todos: extract date from created_at
    await db.execAsync(`
      UPDATE todos 
      SET target_date = CAST(strftime('%Y%m%d', created_at) AS INTEGER)
      WHERE target_date = 0;
    `)
  }
}
