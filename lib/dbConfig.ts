// Database configuration helper
// Reads from environment variables to determine database type and connection settings

export type DatabaseType = 'sqlite' | 'postgresql' | 'mysql';

export interface DatabaseConfig {
  type: DatabaseType;
  sqlite?: {
    databaseName: string;
  };
  postgresql?: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  mysql?: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  pool?: {
    min: number;
    max: number;
    connectionTimeout: number;
  };
}

function getEnv(key: string, defaultValue: string = ''): string {
  // In Expo/React Native, use process.env with expo-constants
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  return defaultValue;
}

export function getDatabaseConfig(): DatabaseConfig {
  const dbType = (getEnv('DB_TYPE', 'sqlite') as DatabaseType);

  const config: DatabaseConfig = {
    type: dbType,
  };

  switch (dbType) {
    case 'sqlite':
      config.sqlite = {
        databaseName: getEnv('SQLITE_DATABASE_NAME', 'liblogs.db'),
      };
      break;

    case 'postgresql':
      config.postgresql = {
        host: getEnv('POSTGRES_HOST', 'localhost'),
        port: parseInt(getEnv('POSTGRES_PORT', '5432')),
        user: getEnv('POSTGRES_USER', 'postgres'),
        password: getEnv('POSTGRES_PASSWORD', ''),
        database: getEnv('POSTGRES_DATABASE', 'liblogs'),
      };
      config.pool = {
        min: parseInt(getEnv('DB_POOL_MIN', '2')),
        max: parseInt(getEnv('DB_POOL_MAX', '10')),
        connectionTimeout: parseInt(getEnv('DB_CONNECTION_TIMEOUT', '30000')),
      };
      break;

    case 'mysql':
      config.mysql = {
        host: getEnv('MYSQL_HOST', 'localhost'),
        port: parseInt(getEnv('MYSQL_PORT', '3306')),
        user: getEnv('MYSQL_USER', 'root'),
        password: getEnv('MYSQL_PASSWORD', ''),
        database: getEnv('MYSQL_DATABASE', 'liblogs'),
      };
      config.pool = {
        min: parseInt(getEnv('DB_POOL_MIN', '2')),
        max: parseInt(getEnv('DB_POOL_MAX', '10')),
        connectionTimeout: parseInt(getEnv('DB_CONNECTION_TIMEOUT', '30000')),
      };
      break;
  }

  return config;
}

// Validate configuration
export function validateConfig(config: DatabaseConfig): string[] {
  const errors: string[] = [];

  if (!config.type) {
    errors.push('DB_TYPE must be specified (sqlite, postgresql, or mysql)');
  }

  if (config.type === 'postgresql' && config.postgresql) {
    if (!config.postgresql.host) errors.push('POSTGRES_HOST is required');
    if (!config.postgresql.user) errors.push('POSTGRES_USER is required');
    if (!config.postgresql.database) errors.push('POSTGRES_DATABASE is required');
  }

  if (config.type === 'mysql' && config.mysql) {
    if (!config.mysql.host) errors.push('MYSQL_HOST is required');
    if (!config.mysql.user) errors.push('MYSQL_USER is required');
    if (!config.mysql.database) errors.push('MYSQL_DATABASE is required');
  }

  return errors;
}
