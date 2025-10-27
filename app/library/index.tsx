import { Link } from 'expo-router';
import * as Speech from 'expo-speech';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BackButton } from '../../lib/BackButton';

export default function LibraryHome() {
  const onSearch = () => Speech.speak('Search library');
  const onScan = () => Speech.speak('Scan library QR code');

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.header}>What library are we exploring today?</Text>

      <View style={styles.actions}>
        <Link href="/library/search" asChild>
          <Pressable onPress={onSearch} style={StyleSheet.flatten([styles.button, styles.primary])}>
            <Text style={styles.primaryText}>Search Library</Text>
          </Pressable>
        </Link>

        <Link href={{ pathname: '/recognition', params: { mode: 'library' } }} asChild>
          <Pressable onPress={onScan} style={StyleSheet.flatten([styles.button, styles.dark])}>
            <Text style={styles.darkText}>Scan Library QR Code</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  header: { fontSize: 20, fontWeight: '700' },
  actions: { gap: 12 },
  button: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  primary: { backgroundColor: '#3B82F6' },
  primaryText: { color: 'white', fontWeight: '600' },
  dark: { backgroundColor: '#111827' },
  darkText: { color: 'white', fontWeight: '600' },
});
