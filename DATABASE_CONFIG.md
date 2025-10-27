# Database Configuration Guide

## Overview
LibLogs supports multiple database backends through environment configuration. Currently implemented:
- **SQLite** (Native iOS/Android + Web fallback)
- **PostgreSQL** (Requires backend API - not yet implemented)
- **MySQL** (Requires backend API - not yet implemented)

## Quick Start

### 1. Copy Environment Template
```bash
cp .env.example .env
```

### 2. Choose Your Database Type

#### Option A: SQLite (Recommended for Mobile)
Edit `.env`:
```env
DB_TYPE=sqlite
SQLITE_DATABASE_NAME=liblogs.db
```

**Pros:**
- ✅ Works on iOS and Android natively
- ✅ No external server required
- ✅ Data persists on device
- ✅ Fast and lightweight

**Cons:**
- ❌ Web uses in-memory fallback (data lost on refresh)
- ❌ Not suitable for multi-device sync

---

#### Option B: PostgreSQL (Future - Requires Backend)
Edit `.env`:
```env
DB_TYPE=postgresql
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DATABASE=liblogs
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_CONNECTION_TIMEOUT=30000
```

**Note:** PostgreSQL requires a backend API server. React Native cannot connect directly to PostgreSQL. You'll need to:
1. Create a Node.js/Express backend
2. Install `pg` package
3. Create REST API endpoints
4. Update app to call API instead of direct DB queries

---

#### Option C: MySQL (Future - Requires Backend)
Edit `.env`:
```env
DB_TYPE=mysql
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=liblogs
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_CONNECTION_TIMEOUT=30000
```

**Note:** Same limitations as PostgreSQL - requires backend API.

---

## Database Schema

### Libraries Table
```sql
CREATE TABLE libraries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  qrCode TEXT NOT NULL UNIQUE
);
```

### Books Table
```sql
CREATE TABLE books (
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
```

## Environment Variables Reference

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `DB_TYPE` | string | `sqlite` | Database type: `sqlite`, `postgresql`, or `mysql` |
| `SQLITE_DATABASE_NAME` | string | `liblogs.db` | SQLite database filename |
| `POSTGRES_HOST` | string | `localhost` | PostgreSQL server hostname |
| `POSTGRES_PORT` | number | `5432` | PostgreSQL server port |
| `POSTGRES_USER` | string | `postgres` | PostgreSQL username |
| `POSTGRES_PASSWORD` | string | - | PostgreSQL password |
| `POSTGRES_DATABASE` | string | `liblogs` | PostgreSQL database name |
| `MYSQL_HOST` | string | `localhost` | MySQL server hostname |
| `MYSQL_PORT` | number | `3306` | MySQL server port |
| `MYSQL_USER` | string | `root` | MySQL username |
| `MYSQL_PASSWORD` | string | - | MySQL password |
| `MYSQL_DATABASE` | string | `liblogs` | MySQL database name |
| `DB_POOL_MIN` | number | `2` | Minimum pool connections (PostgreSQL/MySQL) |
| `DB_POOL_MAX` | number | `10` | Maximum pool connections (PostgreSQL/MySQL) |
| `DB_CONNECTION_TIMEOUT` | number | `30000` | Connection timeout in ms (PostgreSQL/MySQL) |

## Implementation Notes

### Current Status
- ✅ SQLite: Fully implemented
  - Native: Uses `expo-sqlite`
  - Web: Falls back to in-memory storage
- ⚠️ PostgreSQL: Config only (needs backend API)
- ⚠️ MySQL: Config only (needs backend API)

### Web Behavior
When running on web (`npx expo start --web`), SQLite is not available. The app automatically uses an in-memory database that:
- Stores data in JavaScript memory
- Data is lost on page refresh
- Faster for testing
- Same API as SQLite

### Production Recommendations

**For Mobile Apps:**
- Use SQLite for offline-first experience
- Data persists on device
- No internet required

**For Multi-Device Sync:**
- Build a backend API (Node.js + Express)
- Use PostgreSQL or MySQL on backend
- Implement REST endpoints:
  - `GET /api/libraries`
  - `GET /api/books?library=:id`
  - `POST /api/books/search`
- Update `lib/books.ts` to call API instead of local DB

## Troubleshooting

### Error: "Database configuration errors"
- Check that all required env vars are set
- Verify `.env` file exists in project root
- Restart expo: `npx expo start --clear`

### Error: "wa-sqlite.wasm" not found on web
- This is expected - SQLite doesn't work on web
- App automatically falls back to in-memory storage
- Data won't persist across page refreshes on web

### PostgreSQL/MySQL Connection Error
- These databases require a backend API server
- Cannot connect directly from React Native
- See "Option B/C" above for implementation steps

## Security Best Practices

1. **Never commit `.env` to git**
   - Already in `.gitignore`
   - Use `.env.example` as template

2. **Use strong passwords**
   ```env
   POSTGRES_PASSWORD=MyS3cur3P@ssw0rd!
   ```

3. **Restrict database access**
   - PostgreSQL: Configure `pg_hba.conf`
   - MySQL: Use `GRANT` statements
   - Only allow app server IP

4. **Use SSL/TLS for remote connections**
   ```env
   POSTGRES_SSL=true
   MYSQL_SSL=true
   ```

## Migration Guide

### From In-Memory to SQLite
Already done! Your data now persists.

### From SQLite to PostgreSQL
1. Export current data:
   ```bash
   sqlite3 liblogs.db .dump > backup.sql
   ```

2. Set up PostgreSQL backend API

3. Import data to PostgreSQL:
   ```bash
   psql -U postgres -d liblogs -f backup.sql
   ```

4. Update `.env`:
   ```env
   DB_TYPE=postgresql
   ```

5. Update `lib/books.ts` to use API endpoints

## Support

For questions or issues:
1. Check this guide
2. Review `lib/database.ts` implementation
3. See `lib/dbConfig.ts` for config logic
