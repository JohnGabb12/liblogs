import { Link, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { getLibraryById, Library } from '../../lib/books';
import { BackButton } from '../../lib/BackButton';
import { useEffect, useState } from 'react';

export default function LibraryWelcome() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [library, setLibrary] = useState<Library | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLibrary() {
      if (typeof id === 'string') {
        try {
          const lib = await getLibraryById(id);
          setLibrary(lib ?? null);
        } catch (error) {
          console.error('Failed to load library:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    loadLibrary();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  if (!library) {
    return (
      <View style={styles.center}>
        <BackButton />
        <Text>Library not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.header}>Welcome to {library.name}</Text>

      <View style={styles.actions}>
        <Link href={{ pathname: '/recognition', params: { mode: 'barcode' } }} asChild>
          <Pressable style={StyleSheet.flatten([styles.button, styles.primary])}>
            <Text style={styles.primaryText}>Identify book (Scan cover / Barcode)</Text>
          </Pressable>
        </Link>

        <Link href={{ pathname: '/library/[id]/search-books', params: { id: library.id } }} asChild>
          <Pressable style={StyleSheet.flatten([styles.button, styles.dark])}>
            <Text style={styles.darkText}>Locate book (Search)</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, padding: 16, gap: 16 },
  header: { fontSize: 20, fontWeight: '700' },
  actions: { gap: 12 },
  button: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  primary: { backgroundColor: '#3B82F6' },
  primaryText: { color: 'white', fontWeight: '600' },
  dark: { backgroundColor: '#111827' },
  darkText: { color: 'white', fontWeight: '600' },
});
