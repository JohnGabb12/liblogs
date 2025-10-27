// Temporary type shims to unblock TS until editor picks up package types
// These are intentionally broad and can be removed once the environment resolves module types correctly.
declare module 'expo-router' {
  export const Tabs: any;
  export const Link: any;
  export const Stack: any;
  export function useRouter(): any;
  export function useLocalSearchParams<T extends Record<string, string>>(): T;
}

declare module 'expo-haptics' {
  export const ImpactFeedbackStyle: any;
  export const NotificationFeedbackType: any;
  export function impactAsync(style?: any): Promise<void>;
  export function notificationAsync(type?: any): Promise<void>;
}

declare module '@expo/vector-icons' {
  export const Ionicons: any;
}
