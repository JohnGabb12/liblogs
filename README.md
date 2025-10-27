# LibLogs: Camera-Based Book Identification

LibLogs is an AI-inspired prototype to make library book discovery and identification fast and accessible.

Tagline: See it. Scan it. Know it. Find it. Follow it. Get it.

## Modes
- Discovery: Search by title/author/genre and get shelf location, availability, and simple guidance with optional speech and haptics.
- Recognition: Use the camera to mock-recognize a book and jump to details with speech/haptic feedback.

## Tech
- Expo Router (file-based navigation)
- React Native (TypeScript)
- Expo modules: Camera, Haptics, Speech, FileSystem

## Run it
1. Install deps
   - Windows PowerShell
   ```powershell
   npm install
   ```
2. Start
   ```powershell
   npx expo start
   ```
3. Open on Android (recommended for camera/haptics).

## Notes
- Dataset is local and minimal (`lib/books.ts`).
- Recognition is mocked for the prototype; no advanced security is applied.
- All user actions are logged to a device file (see `lib/logger.ts`).
