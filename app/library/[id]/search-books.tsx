import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { Book, getLibraryById, searchBooks, Library } from '../../../lib/books';
import { useSpeechToText } from '../../../lib/speechToText';
import { BackButton } from '../../../lib/BackButton';

export default function LibraryBookSearch() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const libraryId = typeof id === 'string' ? id : undefined;
  const [library, setLibrary] = useState<Library | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadLibraryAndBooks() {
      if (libraryId) {
        try {
          const [lib, books] = await Promise.all([
            getLibraryById(libraryId),
            searchBooks('', libraryId)
          ]);
          setLibrary(lib ?? null);
          setResults(books);
        } catch (error) {
          console.error('Failed to load library or books:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    loadLibraryAndBooks();
  }, [libraryId]);

  const onSearch = async () => {
    if (!libraryId) return;
    try {
      const res = await searchBooks(query, libraryId);
      setResults(res);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Speech.speak(`${res.length} result${res.length === 1 ? '' : 's'} found`);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const onSelect = (item: Book) => {
    Speech.speak(`${item.title} by ${item.author}.`);
    router.push({ pathname: '/book/navigation', params: { id: item.id } });
  };

  // Speech-to-Text integration for the search bar
  const { isSupported: sttSupported, isListening, transcript, start, stop } = useSpeechToText();
  useEffect(() => {
    if (transcript) setQuery(transcript);
  }, [transcript]);
  useEffect(() => {
    if (!isListening && transcript) onSearch();
  }, [isListening]);

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
      <Text style={styles.header}>Search in {library.name}</Text>
      <View style={styles.row}>
        <TextInput
          placeholder="Search books, authors, genres"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={onSearch}
          style={[styles.input, { flex: 1 }]}
        />
        <Pressable onPress={isListening ? stop : start} style={styles.micButton} accessibilityLabel="Speech to text">
          <Text style={{ color: 'white', fontWeight: '600' }}>{isListening ? 'Stop' : (sttSupported ? 'Voice' : 'N/A')}</Text>
        </Pressable>
      </View>
      <View style={{ height: 8 }} />
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => onSelect(item)} style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>{item.author} • {item.genre}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No books found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, padding: 16 },
  header: { fontSize: 18, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 12, height: 44, marginTop: 8 },
  row: { flexDirection: 'row', columnGap: 8, alignItems: 'center', marginTop: 8 },
  micButton: { backgroundColor: '#111827', paddingHorizontal: 14, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  card: { padding: 12, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: 'white', marginBottom: 8 },
  title: { fontWeight: '700' },
  meta: { color: '#4B5563' },
  empty: { color: '#9CA3AF' },
});
