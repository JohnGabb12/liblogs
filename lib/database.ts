import { Platform } from 'react-native';
import { getDatabaseConfig, validateConfig } from './dbConfig';

let db: any = null;

// Initialize database connection based on configuration
export async function initDatabase() {
  if (db) return db;

  const config = getDatabaseConfig();
  const errors = validateConfig(config);
  
  if (errors.length > 0) {
    throw new Error(`Database configuration errors: ${errors.join(', ')}`);
  }

  console.log(`Initializing ${config.type} database...`);

  // Only SQLite is supported in React Native/Expo currently
  // PostgreSQL and MySQL would require a backend API server
  if (config.type === 'sqlite') {
    // SQLite only works on native platforms (iOS/Android)
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      // Dynamically import expo-sqlite only on native platforms
      const SQLite = require('expo-sqlite');
      const dbName = config.sqlite?.databaseName || 'liblogs.db';
      db = await SQLite.openDatabaseAsync(dbName);
      await createSQLiteTables(db);
    } else {
      // Web fallback: use in-memory storage
      console.warn('SQLite not available on web, using in-memory storage');
      db = createInMemoryDatabase();
    }
  } else if (config.type === 'postgresql' || config.type === 'mysql') {
    // For PostgreSQL/MySQL, you would need to implement API calls to a backend server
    throw new Error(
      `${config.type} is not directly supported in React Native. ` +
      `You need to create a backend API server to connect to ${config.type}. ` +
      `For now, please use sqlite or implement a REST API layer.`
    );
  } else {
    throw new Error(`Unsupported database type: ${config.type}`);
  }

  return db;
}

// Create SQLite tables
async function createSQLiteTables(database: any) {
  // Create tables if they don't exist
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS libraries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      qrCode TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      genre TEXT NOT NULL,
      summary TEXT NOT NULL,
      shelf TEXT NOT NULL,
      coordinateX INTEGER NOT NULL,
      coordinateY INTEGER NOT NULL,
      status TEXT NOT NULL,
      libraryId TEXT NOT NULL,
      FOREIGN KEY (libraryId) REFERENCES libraries(id)
    );

    CREATE INDEX IF NOT EXISTS idx_books_library ON books(libraryId);
    CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
    CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
  `);
}

// In-memory database implementation for web
function createInMemoryDatabase() {
  const inMemoryDB = {
    libraries: [] as any[],
    books: [] as any[],
    isInMemory: true,
  };

  return {
    isInMemory: true,
    getAllAsync: async (sql: string, ...params: any[]) => {
      if (sql.includes('FROM libraries')) {
        if (sql.includes('WHERE qrCode')) {
          return inMemoryDB.libraries.filter(l => l.qrCode === params[0]);
        } else if (sql.includes('WHERE id')) {
          return inMemoryDB.libraries.filter(l => l.id === params[0]);
        }
        return inMemoryDB.libraries;
      } else if (sql.includes('FROM books')) {
        let results = [...inMemoryDB.books];
        if (sql.includes('WHERE libraryId')) {
          results = results.filter(b => b.libraryId === params[0]);
          if (sql.includes('LIKE')) {
            const query = params[1]?.replace(/%/g, '').toLowerCase();
            if (query) {
              results = results.filter(b =>
                b.title.toLowerCase().includes(query) ||
                b.author.toLowerCase().includes(query) ||
                b.genre.toLowerCase().includes(query)
              );
            }
          }
        } else if (sql.includes('LIKE')) {
          const query = params[0]?.replace(/%/g, '').toLowerCase();
          if (query) {
            results = results.filter(b =>
              b.title.toLowerCase().includes(query) ||
              b.author.toLowerCase().includes(query) ||
              b.genre.toLowerCase().includes(query)
            );
          }
        } else if (sql.includes('WHERE id')) {
          results = results.filter(b => b.id === params[0]);
        }
        return results;
      }
      return [];
    },
    getFirstAsync: async (sql: string, ...params: any[]) => {
      const mockDb = {
        getAllAsync: async (s: string, ...p: any[]) => {
          return await (db as any).getAllAsync(s, ...p);
        }
      };
      const results = await mockDb.getAllAsync(sql, ...params);
      return results[0] || null;
    },
    runAsync: async (sql: string, ...params: any[]) => {
      if (sql.includes('INSERT INTO libraries')) {
        const [id, name, location, qrCode] = params;
        inMemoryDB.libraries.push({ id, name, location, qrCode });
      } else if (sql.includes('INSERT INTO books')) {
        const [id, title, author, genre, summary, shelf, coordinateX, coordinateY, status, libraryId] = params;
        inMemoryDB.books.push({ id, title, author, genre, summary, shelf, coordinateX, coordinateY, status, libraryId });
      }
      return { changes: 1, lastInsertRowId: 0 };
    },
    execAsync: async (sql: string) => {
      // No-op for web
      return;
    },
  };
}

// Seed initial data (run once to populate)
export async function seedDatabase() {
  const database = await initDatabase();
  
  // Check if data already exists
  const libCount: any = await database.getFirstAsync('SELECT COUNT(*) as count FROM libraries');
  if (libCount && libCount.count > 0) {
    console.log('Database already seeded');
    return;
  }

  // Insert libraries
  await database.runAsync(
    'INSERT INTO libraries (id, name, location, qrCode) VALUES (?, ?, ?, ?)',
    'lib-001', 'UE LB Library', '3rd floor, LB Building, University of the East', 'LIB-UE-001'
  );
  await database.runAsync(
    'INSERT INTO libraries (id, name, location, qrCode) VALUES (?, ?, ?, ?)',
    'lib-002', 'UE 2nd Floor Podcit Library', '2nd floor, CCSS Building, University of the East', 'LIB-UE-002'
  );
  await database.runAsync(
    'INSERT INTO libraries (id, name, location, qrCode) VALUES (?, ?, ?, ?)',
    'lib-003', 'UE 3rd Floor Podcit Library', '3rd floor, CCSS Building, University of the East', 'LIB-UE-003'
  );

  // Insert books
  await database.runAsync(
    'INSERT INTO books (id, title, author, genre, summary, shelf, coordinateX, coordinateY, status, libraryId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    '9780143127741', 'The Martian', 'Andy Weir', 'Science Fiction',
    "An astronaut stranded on Mars uses ingenuity to survive and signal Earth.",
    'Aisle 3, Shelf 2', 3, 2, 'in_stock', 'lib-001'
  );
  await database.runAsync(
    'INSERT INTO books (id, title, author, genre, summary, shelf, coordinateX, coordinateY, status, libraryId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    '9780553386790', 'Thinking, Fast and Slow', 'Daniel Kahneman', 'Psychology',
    'Explores the dual systems that drive the way we think.',
    'Aisle 1, Shelf 5', 1, 5, 'borrowed', 'lib-001'
  );
  await database.runAsync(
    'INSERT INTO books (id, title, author, genre, summary, shelf, coordinateX, coordinateY, status, libraryId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    '9780062316110', 'Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', 'History',
    "A narrative of humanity's creation and evolution.",
    'Aisle 4, Shelf 1', 4, 1, 'reserved', 'lib-002'
  );

  console.log('Database seeded successfully');
}

export function getDatabase() {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}
