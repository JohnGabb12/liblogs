import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

export function BackButton() {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.back()} style={styles.button} accessibilityLabel="Go back">
      <Text style={styles.text}>← Back</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
});
