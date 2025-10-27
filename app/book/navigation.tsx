import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { getBookById, Book } from '../../lib/books';
import { BackButton } from '../../lib/BackButton';
import { useEffect, useState } from 'react';

export default function BookNavigation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBook() {
      if (typeof id === 'string') {
        try {
          const b = await getBookById(id);
          setBook(b ?? null);
        } catch (error) {
          console.error('Failed to load book:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    loadBook();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.center}>
        <BackButton />
        <Text>Book not found</Text>
      </View>
    );
  }

  const guidanceText = `Proceed to ${book.shelf}. Follow aisle ${book.coordinates.x} to shelf ${book.coordinates.y}.`;

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.header}>Book Navigation</Text>
      <Text>{guidanceText}</Text>

      <Pressable onPress={() => router.push({ pathname: '/book/[id]', params: { id: book.id } })} style={[styles.button, styles.primary]}>
        <Text style={styles.primaryText}>View Details</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, padding: 16, gap: 12 },
  header: { fontSize: 18, fontWeight: '700' },
  button: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, marginTop: 16, alignItems: 'center' },
  primary: { backgroundColor: '#3B82F6' },
  primaryText: { color: 'white', fontWeight: '600' },
});
