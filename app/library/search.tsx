import * as Speech from 'expo-speech';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { getAllLibraries, Library } from '../../lib/books';
import { useLibrary } from '../../lib/libraryContext';
import { useRouter } from 'expo-router';
import { useSpeechToText } from '../../lib/speechToText';
import { BackButton } from '../../lib/BackButton';

export default function LibrarySearch() {
  const [query, setQuery] = useState('');
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLibraries() {
      try {
        const libs = await getAllLibraries();
        setLibraries(libs);
      } catch (error) {
        console.error('Failed to load libraries:', error);
      } finally {
        setLoading(false);
      }
    }
    loadLibraries();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return libraries;
    return libraries.filter(l => l.name.toLowerCase().includes(q) || (l.location?.toLowerCase().includes(q)));
  }, [query, libraries]);

  const { setSelectedLibraryId } = useLibrary();
  const router = useRouter();

  const selectLibrary = (lib: Library) => {
    setSelectedLibraryId(lib.id);
    Speech.speak(`Welcome to ${lib.name}`);
    router.push({ pathname: '/library/[id]', params: { id: lib.id } });
  };

  // Speech-to-Text on the search bar
  const { isSupported: sttSupported, isListening, transcript, start, stop } = useSpeechToText();
  useEffect(() => {
    if (transcript) setQuery(transcript);
  }, [transcript]);

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.header}>Search library</Text>
      <View style={styles.row}>
        <TextInput
          placeholder="Search libraries by name or location"
          value={query}
          onChangeText={setQuery}
          style={[styles.input, { flex: 1 }]}
          returnKeyType="search"
        />
        <Pressable onPress={isListening ? stop : start} style={styles.micButton} accessibilityLabel="Speech to text">
          <Text style={{ color: 'white', fontWeight: '600' }}>{isListening ? 'Stop' : (sttSupported ? 'Voice' : 'N/A')}</Text>
        </Pressable>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#111827" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable onPress={() => selectLibrary(item)} style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.location}>{item.location}</Text>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No libraries found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  header: { fontSize: 18, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 12, height: 44 },
  row: { flexDirection: 'row', columnGap: 8, alignItems: 'center' },
  micButton: { backgroundColor: '#111827', paddingHorizontal: 14, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  card: { padding: 16, marginTop: 8, backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12 },
  name: { fontWeight: '700' },
  location: { color: '#4B5563' },
  empty: { color: '#9CA3AF', marginTop: 8 },
});
