import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { BackButton } from '../../lib/BackButton';
import { Book, getBookById } from '../../lib/books';
import { logEvent } from '../../lib/logger';

export default function BookDetails() {
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

  const announce = () => {
    const status = book.status.replace('_', ' ');
    const guidance = `Proceed to ${book.shelf}. Follow aisle ${book.coordinates.x} to shelf ${book.coordinates.y}.`;
    const fullMessage = `${book.title} by ${book.author}. Located at ${book.shelf}. Currently ${status}. Navigation: ${guidance}. Summary: ${book.summary}`;
    Speech.speak(fullMessage);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    logEvent(`Announce book ${book.id}`);
  };

  const guidanceText = `Proceed to ${book.shelf}. Follow aisle ${book.coordinates.x} to shelf ${book.coordinates.y}.`;

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>{book.title}</Text>
      <Text style={styles.meta}>{book.author} • {book.genre}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shelf location</Text>
        <Text>{book.shelf}</Text>
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Status</Text>
        <Text>{book.status.replace('_', ' ')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Navigation guidance</Text>
        <Text>{guidanceText}</Text>
      </View>

      {/* Move summary/synopsis after navigation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <Text style={{ marginTop: 6 }}>{book.summary}</Text>
      </View>

      <View style={styles.actionsRow}>
        <Pressable onPress={announce} style={[styles.actionButton, styles.actionPrimary]}>
          <Text style={styles.actionPrimaryText}>Speak Details</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={[styles.actionButton, styles.actionSecondary]}>
          <Text style={styles.actionSecondaryText}>Back</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  container: { flex: 1, padding: 16, rowGap: 12 },
  title: { fontSize: 22, fontWeight: '700' },
  meta: { color: '#6B7280' },
  section: { marginTop: 12 },
  sectionTitle: { fontWeight: '600' },
  actionsRow: { flexDirection: 'row', columnGap: 12, marginTop: 16 },
  actionButton: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  actionPrimary: { backgroundColor: '#3B82F6' },
  actionSecondary: { backgroundColor: '#E5E7EB' },
  actionPrimaryText: { color: 'white', fontWeight: '600' },
  actionSecondaryText: { color: '#111827', fontWeight: '600' },
});
