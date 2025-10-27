import { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { initDatabase, seedDatabase } from './database';

type LibraryContextType = {
  selectedLibraryId: string | null;
  setSelectedLibraryId: (id: string | null) => void;
};

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(null);
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    async function setupDatabase() {
      try {
        await initDatabase();
        await seedDatabase();
        setDbReady(true);
      } catch (error) {
        console.error('Database initialization failed:', error);
        setDbError(error instanceof Error ? error.message : 'Unknown error');
      }
    }
    setupDatabase();
  }, []);

  if (dbError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Database Error: {dbError}</Text>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading database...</Text>
      </View>
    );
  }

  return (
    <LibraryContext.Provider value={{ selectedLibraryId, setSelectedLibraryId }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within LibraryProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
  },
});
