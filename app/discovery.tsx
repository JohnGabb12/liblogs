import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BackButton } from '../lib/BackButton';
import { Book, getAllLibraries, getLibraryById, Library, searchBooks } from '../lib/books';
import { useLibrary } from '../lib/libraryContext';
import { logEvent } from '../lib/logger';
import { useSpeechToText } from '../lib/speechToText';

export default function DiscoveryScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [allLibraries, setAllLibraries] = useState<Library[]>([]);
  const [selectedLibrary, setSelectedLibrary] = useState<Library | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { selectedLibraryId, setSelectedLibraryId } = useLibrary();

  useEffect(() => {
    async function loadInitialData() {
      try {
        logEvent('Opened Discovery screen');
        const libs = await getAllLibraries();
        setAllLibraries(libs);
        
        if (selectedLibraryId) {
          const lib = await getLibraryById(selectedLibraryId);
          setSelectedLibrary(lib ?? null);
          const allBooks = await searchBooks('', selectedLibraryId);
          setResults(allBooks);
        }
      } catch (error) {
        console.error('Failed to load discovery data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [selectedLibraryId]);

  const onSearch = async () => {
    try {
      const res = await searchBooks(query, selectedLibraryId || undefined);
      setResults(res);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Speech.speak(`${res.length} result${res.length === 1 ? '' : 's'} found`);
      logEvent(`Discovery search: "${query}" in library ${selectedLibraryId || 'all'} -> ${res.length} results`);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const selectLibrary = async (libraryId: string) => {
    try {
      setSelectedLibraryId(libraryId);
      const [allBooks, lib] = await Promise.all([
        searchBooks('', libraryId),
        getLibraryById(libraryId)
      ]);
      setResults(allBooks);
      setSelectedLibrary(lib ?? null);
      Speech.speak(`Switched to ${lib?.name}`);
      logEvent(`Changed library to: ${lib?.name}`);
    } catch (error) {
      console.error('Failed to select library:', error);
    }
  };

  // Speech-to-Text for the search bar
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

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Discovery</Text>
      
      {/* Library selection chips */}
      {!selectedLibrary ? (
        <View>
          <Text style={styles.helperText}>Select a library first (or go to Home)</Text>
          <View style={styles.chipsWrap}>
            {allLibraries.map(lib => (
              <Pressable key={lib.id} onPress={() => selectLibrary(lib.id)} style={styles.chip}>
                <Text style={styles.chipText}>{lib.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.searchScope}>
          <View>
            <Text style={styles.scopeLabel}>Searching in:</Text>
            <Text style={styles.scopeName}>{selectedLibrary.name}</Text>
          </View>
          <Pressable onPress={() => { setSelectedLibraryId(null); setSelectedLibrary(null); }} style={styles.scopeChangeButton}>
            <Text style={styles.scopeChangeText}>Change</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.helperText}>Find it - Say or input the book title/author.</Text>
      
      <View style={styles.searchRow}>
        <TextInput
          placeholder="Search books, authors, genres"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={onSearch}
          style={styles.searchInput}
          accessibilityLabel="Search input"
        />
        <Pressable onPress={onSearch} style={[styles.button, styles.buttonPrimary]}>
          <Text style={styles.buttonTextLight}>Search</Text>
        </Pressable>
        <Pressable onPress={isListening ? stop : start} style={[styles.button, styles.buttonDark]} accessibilityLabel="Speech to text">
          <Text style={styles.buttonTextLight}>{isListening ? 'Stop' : (sttSupported ? 'Voice' : 'N/A')}</Text>
        </Pressable>
      </View>
      
      <FlatList<Book>
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              Speech.speak(`${item.title} by ${item.author}. ${item.status.replace('_', ' ')}`);
              logEvent(`Open navigation for ${item.id}`);
              router.push({ pathname: '/book/navigation', params: { id: item.id } });
            }}
            style={styles.resultCard}
            accessibilityLabel={`Open ${item.title} details`}
          >
            <Text style={styles.resultTitle}>{item.title}</Text>
            <Text style={styles.resultMeta}>{item.author} • {item.genre}</Text>
            <Text numberOfLines={2} style={styles.resultSummary}>{item.summary}</Text>
            <View style={styles.resultExtra}>
              <Text>Location: {item.shelf}</Text>
              <Text>Status: {item.status.replace('_', ' ')}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {selectedLibraryId 
              ? query 
                ? 'No results found. Try a different search.'
                : 'All books in this library are displayed above.'
              : 'Select a library to see books.'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, padding: 16, rowGap: 12 },
  title: { fontSize: 22, fontWeight: '700' },
  helperText: { color: '#4B5563', marginBottom: 8 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8, rowGap: 8 },
  chip: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  chipText: { color: '#1D4ED8', fontWeight: '600', fontSize: 12 },
  searchScope: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scopeLabel: { fontSize: 10, color: '#2563EB' },
  scopeName: { fontWeight: '700', color: '#1E3A8A' },
  scopeChangeButton: { backgroundColor: '#E5E7EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  scopeChangeText: { color: '#374151', fontSize: 12 },
  searchRow: { flexDirection: 'row', columnGap: 8, alignItems: 'center' },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 12, height: 44 },
  button: { paddingHorizontal: 14, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  buttonPrimary: { backgroundColor: '#3B82F6' },
  buttonDark: { backgroundColor: '#111827' },
  buttonTextLight: { color: 'white', fontWeight: '600' },
  resultCard: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 10, backgroundColor: 'white' },
  resultTitle: { fontWeight: '700' },
  resultMeta: { color: '#4B5563' },
  resultSummary: { marginTop: 6 },
  resultExtra: { marginTop: 8 },
  emptyText: { color: '#9CA3AF' },
});
