import { getDatabase } from './database';

export type BookStatus = 'in_stock' | 'borrowed' | 'reserved';
export type Coordinates = { x: number; y: number };

export type Library = {
  id: string;
  name: string;
  location: string;
  qrCode: string; // QR code value for scanning
};

export type Book = {
  id: string;
  title: string;
  author: string;
  genre: string;
  summary: string;
  shelf: string;
  coordinates: Coordinates;
  status: BookStatus;
  libraryId: string; // Links book to library
};

// Helper to convert DB row to Book object
function rowToBook(row: any): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    genre: row.genre,
    summary: row.summary,
    shelf: row.shelf,
    coordinates: { x: row.coordinateX, y: row.coordinateY },
    status: row.status as BookStatus,
    libraryId: row.libraryId,
  };
}

// Helper to convert DB row to Library object
function rowToLibrary(row: any): Library {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    qrCode: row.qrCode,
  };
}

export async function searchBooks(query: string, libraryId?: string): Promise<Book[]> {
  const db = getDatabase();
  const q = query.trim().toLowerCase();
  
  let sql = 'SELECT * FROM books';
  const params: any[] = [];
  
  if (libraryId && q) {
    sql += ' WHERE libraryId = ? AND (LOWER(title) LIKE ? OR LOWER(author) LIKE ? OR LOWER(genre) LIKE ?)';
    params.push(libraryId, `%${q}%`, `%${q}%`, `%${q}%`);
  } else if (libraryId) {
    sql += ' WHERE libraryId = ?';
    params.push(libraryId);
  } else if (q) {
    sql += ' WHERE LOWER(title) LIKE ? OR LOWER(author) LIKE ? OR LOWER(genre) LIKE ?';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  
  const rows = await db.getAllAsync(sql, ...params);
  return rows.map(rowToBook);
}

export async function getBookById(id: string): Promise<Book | undefined> {
  const db = getDatabase();
  const row = await db.getFirstAsync('SELECT * FROM books WHERE id = ?', id);
  return row ? rowToBook(row) : undefined;
}

export async function getLibraryById(id: string): Promise<Library | undefined> {
  const db = getDatabase();
  const row = await db.getFirstAsync('SELECT * FROM libraries WHERE id = ?', id);
  return row ? rowToLibrary(row) : undefined;
}

export async function getLibraryByQRCode(qrCode: string): Promise<Library | undefined> {
  const db = getDatabase();
  const row = await db.getFirstAsync('SELECT * FROM libraries WHERE qrCode = ?', qrCode);
  return row ? rowToLibrary(row) : undefined;
}

export async function getAllLibraries(): Promise<Library[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync('SELECT * FROM libraries');
  return rows.map(rowToLibrary);
}

// Keep the old BOOKS export for recognition.tsx which uses it directly
// This is a temporary bridge - ideally recognition should also use async functions
export const BOOKS: Book[] = [];
