import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

export function useSpeechToText() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const isSupported = useMemo(() => {
    if (Platform.OS !== 'web') return false;
    const w = (globalThis as any) as { SpeechRecognition?: any; webkitSpeechRecognition?: any };
    return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
  }, []);

  useEffect(() => {
    if (!isSupported) return;
    const w = (globalThis as any) as { SpeechRecognition?: any; webkitSpeechRecognition?: any };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setTranscript('');
      setError(null);
      setIsListening(true);
    };
    recognition.onresult = (event: any) => {
      let temp = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        temp += event.results[i][0].transcript;
      }
      setTranscript(temp.trim());
    };
    recognition.onerror = (e: any) => {
      setError(e?.error || 'speech-error');
    };
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    return () => {
      try { recognition.stop(); } catch {}
      recognitionRef.current = null;
    };
  }, [isSupported]);

  const start = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition not supported on this platform.');
      return;
    }
    try {
      recognitionRef.current?.start();
    } catch (e) {
      // Some browsers require stop before start
      try { recognitionRef.current?.stop(); } catch {}
      try { recognitionRef.current?.start(); } catch {}
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch {}
  }, []);

  return { isSupported, isListening, transcript, error, start, stop };
}
