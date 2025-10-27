import { Stack } from "expo-router";
import { LibraryProvider } from "../lib/libraryContext";

export default function RootLayout() {
  return (
    <LibraryProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="library/index" />
        <Stack.Screen name="library/search" />
        <Stack.Screen name="library/[id]" />
        <Stack.Screen name="library/[id]/search-books" />
        <Stack.Screen name="discovery" />
        <Stack.Screen name="recognition" />
        <Stack.Screen name="book/[id]" />
        <Stack.Screen name="book/location" />
        <Stack.Screen name="book/navigation" />
      </Stack>
    </LibraryProvider>
  );
}
