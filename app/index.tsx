import { useRouter } from "expo-router";
import * as Speech from 'expo-speech';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from "react-native";
import { logEvent } from "../lib/logger";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    logEvent('Opened Home screen');
  }, []);

  const getStarted = () => {
    Speech.speak('Let\'s get started');
    router.push('/library');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>LibLogs</Text>
          <Text style={styles.subtitle}>
            See it. Scan it. Know it. Find it. Follow it. Get it.
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable onPress={getStarted} style={StyleSheet.flatten([styles.actionButton, styles.actionButtonPrimary])}>
          <Text style={styles.actionButtonPrimaryText}>Get Started</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center' },
  title: { fontSize: 30, fontWeight: '800', marginBottom: 8 },
  subtitle: { textAlign: 'center', marginHorizontal: 24, color: '#4B5563' },

  buttonContainer: { marginBottom: '20%' },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonPrimary: { backgroundColor: '#3B82F6' },
  actionButtonDark: { backgroundColor: '#111827' },
  actionButtonPrimaryText: { color: 'white', fontWeight: '600', textAlign: 'center' },
  actionButtonDarkText: { color: 'white', fontWeight: '600', textAlign: 'center' },
  
});
