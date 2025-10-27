import * as Speech from 'expo-speech';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { getBookById, Book } from '../../lib/books';
import { BackButton } from '../../lib/BackButton';
import { useEffect, useState } from 'react';

export default function BookLocation() {
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

  const speakLocation = () => {
    Speech.speak(`Proceed to ${book.shelf}. Follow aisle ${book.coordinates.x} to shelf ${book.coordinates.y}.`);
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.header}>Book Location</Text>
      <Text>Location: {book.shelf}</Text>
      <Text style={{ marginTop: 6 }}>Guidance: Proceed to {book.shelf}. Follow aisle {book.coordinates.x} to shelf {book.coordinates.y}.</Text>

      <View style={styles.actions}>
        <Pressable onPress={speakLocation} style={[styles.button, styles.dark]}>
          <Text style={styles.darkText}>Speak</Text>
        </Pressable>
        <Pressable onPress={() => router.push({ pathname: '/book/[id]', params: { id: book.id } })} style={[styles.button, styles.primary]}>
          <Text style={styles.primaryText}>Show Details</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, padding: 16, gap: 12 },
  header: { fontSize: 18, fontWeight: '700' },
  actions: { flexDirection: 'row', columnGap: 12, marginTop: 16 },
  button: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  primary: { backgroundColor: '#3B82F6' },
  primaryText: { color: 'white', fontWeight: '600' },
  dark: { backgroundColor: '#111827' },
  darkText: { color: 'white', fontWeight: '600' },
});
