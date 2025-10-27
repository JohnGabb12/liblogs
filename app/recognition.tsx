import { CameraView, useCameraPermissions } from 'expo-camera';
import { BarcodeScanningResult } from 'expo-camera/build/Camera.types';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { BOOKS, getLibraryByQRCode, getBookById } from '../lib/books';
import { analyzeCover } from '../lib/coverRecognition';
import { useLibrary } from '../lib/libraryContext';
import { logEvent } from '../lib/logger';
import { BackButton } from '../lib/BackButton';

// Real barcode recognition function
async function recognizeByBarcode(barcodeData: string): Promise<string | null> {
  // Check if scanned barcode matches any book ISBN
  const book = await getBookById(barcodeData);
  if (book) {
    logEvent(`Barcode matched: ${barcodeData} -> ${book.title}`);
    return book.id;
  }
  logEvent(`Barcode scanned but no match: ${barcodeData}`);
  return null;
}

export default function RecognitionScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scanningMode, setScanningMode] = useState<'barcode' | 'cover' | 'library' | 'idle'>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const router = useRouter();
  const lastScannedRef = useRef<string>('');
  const cameraRef = useRef<CameraView>(null);
  const { selectedLibraryId, setSelectedLibraryId } = useLibrary();

  useEffect(() => {
    logEvent('Opened Recognition screen');
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  // Initialize scanning mode from params (e.g., ?mode=library)
  useEffect(() => {
    if (params?.mode === 'library') {
      setScanningMode('library');
      Speech.speak('Point camera at library QR code');
      logEvent('Auto-started library QR scan from params');
    } else if (params?.mode === 'barcode') {
      setScanningMode('barcode');
      Speech.speak('Point camera at book barcode or ISBN');
      logEvent('Auto-started barcode scan from params');
    }
  }, [params?.mode]);

  // Handle barcode scanning (books OR library QR codes)
  const handleBarcodeScanned = async ({ type, data }: BarcodeScanningResult) => {
    if (isScanning || lastScannedRef.current === data) return;
    
    lastScannedRef.current = data;
    setIsScanning(true);

    logEvent(`Barcode scanned: type=${type}, data=${data}`);
    
    // Check if it's a library QR code
    if (scanningMode === 'library') {
      try {
        const library = await getLibraryByQRCode(data);
        if (library) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Speech.speak(`Library detected: ${library.name}`);
          logEvent(`Library QR matched: ${library.name}`);
          setSelectedLibraryId(library.id);
          
          setTimeout(() => {
            setScanningMode('idle');
            setIsScanning(false);
            lastScannedRef.current = '';
            router.push({ pathname: '/library/[id]', params: { id: library.id } });
          }, 1000);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Speech.speak('Library not recognized');
          logEvent('Library QR no match');
          setTimeout(() => {
            setIsScanning(false);
            lastScannedRef.current = '';
          }, 2000);
        }
      } catch (error) {
        console.error('Library QR lookup failed:', error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Speech.speak('Error looking up library');
        setTimeout(() => {
          setIsScanning(false);
          lastScannedRef.current = '';
        }, 2000);
      }
      return;
    }
    
    // Otherwise check for book ISBN
    try {
      const id = await recognizeByBarcode(data);
      if (id) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Speech.speak('Book recognized');
        logEvent(`Recognition matched id=${id}`);
        
        // Navigate after a short delay to Book Location screen per navigation tree
        setTimeout(() => {
          router.push({ pathname: '/book/location', params: { id } });
          setIsScanning(false);
          lastScannedRef.current = '';
        }, 500);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Speech.speak('Book not found in library');
        logEvent('Recognition no match');
        setTimeout(() => {
          setIsScanning(false);
          lastScannedRef.current = '';
        }, 2000);
      }
    } catch (error) {
      console.error('Book barcode lookup failed:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Speech.speak('Error looking up book');
      setTimeout(() => {
        setIsScanning(false);
        lastScannedRef.current = '';
      }, 2000);
    }
  };

  const onScan = () => {
    if (scanningMode === 'idle') {
      setScanningMode('barcode');
      Speech.speak('Point camera at book barcode or ISBN');
      logEvent('Started barcode scanning mode');
    } else {
      setScanningMode('idle');
      setIsScanning(false);
      setCapturedImage(null);
      lastScannedRef.current = '';
    }
  };

  const onLibraryScan = () => {
    if (scanningMode === 'library') {
      setScanningMode('idle');
      setIsScanning(false);
      lastScannedRef.current = '';
    } else {
      setScanningMode('library');
      Speech.speak('Point camera at library QR code');
      logEvent('Started library QR scanning mode');
    }
  };

  const onCoverScan = async () => {
    if (scanningMode === 'cover') {
      // Cancel cover scanning
      setScanningMode('idle');
      setCapturedImage(null);
      setIsScanning(false);
      return;
    }

    setScanningMode('cover');
    Speech.speak('Position book cover in frame');
    logEvent('Started cover scanning mode');

    // Wait a moment for user to position the book
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Capture the photo
    try {
      if (cameraRef.current) {
        setIsScanning(true);
        Speech.speak('Capturing image');
        
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: false,
        });

        if (photo && photo.uri) {
          setCapturedImage(photo.uri);
          logEvent(`Cover image captured: ${photo.uri}`);
          
          Speech.speak('Analyzing book cover');
          
          // Recognize the book from the cover
          const result = await analyzeCover(photo.uri);
          const id = result.bookId;
          
          if (id) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const book = BOOKS.find(b => b.id === id);
            const confidencePercent = Math.round(result.confidence * 100);
            Speech.speak(`Book recognized: ${book?.title}. ${confidencePercent} percent confidence`);
            logEvent(`Cover recognition matched id=${id}, confidence=${confidencePercent}%`);
            
            setTimeout(() => {
              router.push({ pathname: '/book/location', params: { id } });
              setScanningMode('idle');
              setIsScanning(false);
              setCapturedImage(null);
            }, 500);
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Speech.speak('Could not identify book cover');
            logEvent('Cover recognition: no match');
            setTimeout(() => {
              setScanningMode('idle');
              setIsScanning(false);
              setCapturedImage(null);
            }, 2000);
          }
        }
      }
    } catch (error) {
      logEvent(`Cover scan error: ${error}`);
      Speech.speak('Error capturing image');
      setIsScanning(false);
      setScanningMode('idle');
      setCapturedImage(null);
    }
  };

  if (!permission) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Requesting camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Text style={{ textAlign: 'center', marginBottom: 12 }}>We need your permission to show the camera</Text>
        <Pressable onPress={requestPermission} style={{ backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8 }}>
          <Text style={{ color: 'white' }}>Grant permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView 
        ref={cameraRef}
        style={{ flex: 1 }}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'code128', 'code39', 'upc_e', 'upc_a'],
        }}
        onBarcodeScanned={(scanningMode === 'barcode' || scanningMode === 'library') ? handleBarcodeScanned : undefined}
      >
        <View style={styles.overlay}>
          <View style={styles.backButtonContainer}>
            <BackButton />
          </View>
          {/* Captured image preview */}
          {capturedImage && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: capturedImage }} style={styles.previewImage} />
              <Text style={styles.analyzingText}>Analyzing...</Text>
            </View>
          )}

          {/* Scanning indicator for barcode */}
          {scanningMode === 'barcode' && !capturedImage && (
            <View style={styles.scanningIndicator}>
              <Text style={styles.scanningText}>
                {isScanning ? 'Processing...' : 'Scanning for barcode...'}
              </Text>
              <View style={styles.scanFrame} />
            </View>
          )}

          {/* Scanning indicator for library QR */}
          {scanningMode === 'library' && (
            <View style={styles.scanningIndicator}>
              <Text style={styles.scanningText}>
                {isScanning ? 'Processing...' : 'Scanning for library QR code...'}
              </Text>
              <View style={[styles.scanFrame, { borderColor: '#F59E0B' }]} />
            </View>
          )}

          {scanningMode === 'cover' && !capturedImage && !isScanning && (
            <View style={styles.scanningIndicator}>
              <Text style={styles.scanningText}>Position book cover in frame</Text>
              <View style={[styles.scanFrame, styles.coverFrame]} />
              <Text style={styles.scanningSubtext}>Photo will capture in 2 seconds</Text>
            </View>
          )}

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              {scanningMode === 'idle' 
                ? 'Choose scan method below' 
                : scanningMode === 'barcode'
                ? 'Point at book barcode or ISBN'
                : scanningMode === 'library'
                ? 'Point at library QR code'
                : 'Center the book cover'}
            </Text>
          </View>

          {/* Scan buttons */}
          <View style={styles.buttonContainer}>
            <View style={styles.buttonRow}>
              <Pressable
                onPress={onLibraryScan}
                disabled={isScanning || scanningMode === 'barcode' || scanningMode === 'cover'}
                style={[
                  styles.scanButton,
                  styles.thirdButton,
                  scanningMode === 'library' && styles.scanButtonActive,
                  (isScanning || scanningMode === 'barcode' || scanningMode === 'cover') && styles.scanButtonDisabled
                ]}
                accessibilityLabel={scanningMode === 'library' ? "Stop library scan" : "Scan library"}
              >
                <Text style={styles.scanButtonText}>
                  {scanningMode === 'library' ? '❌' : '🏛️'}
                </Text>
              </Pressable>

              <Pressable
                onPress={onScan}
                disabled={isScanning || scanningMode === 'cover' || scanningMode === 'library'}
                style={[
                  styles.scanButton,
                  styles.thirdButton,
                  scanningMode === 'barcode' && styles.scanButtonActive,
                  (isScanning || scanningMode === 'cover' || scanningMode === 'library') && styles.scanButtonDisabled
                ]}
                accessibilityLabel={scanningMode === 'barcode' ? "Stop barcode scan" : "Scan barcode"}
              >
                <Text style={styles.scanButtonText}>
                  {scanningMode === 'barcode' ? '❌' : '🔲'}
                </Text>
              </Pressable>

              <Pressable
                onPress={onCoverScan}
                disabled={isScanning || scanningMode === 'barcode' || scanningMode === 'library'}
                style={[
                  styles.scanButton,
                  styles.thirdButton,
                  scanningMode === 'cover' && styles.scanButtonActive,
                  (isScanning || scanningMode === 'barcode' || scanningMode === 'library') && styles.scanButtonDisabled
                ]}
                accessibilityLabel={scanningMode === 'cover' ? "Stop cover scan" : "Scan cover"}
              >
                <Text style={styles.scanButtonText}>
                  {isScanning ? '⏳' : scanningMode === 'cover' ? '❌' : '📚'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backButtonContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    zIndex: 100,
  },
  scanningIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  scanningSubtext: {
    color: 'white',
    fontSize: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 20,
  },
  scanFrame: {
    width: 250,
    height: 150,
    borderWidth: 3,
    borderColor: '#00FF00',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  coverFrame: {
    width: 200,
    height: 300,
    borderColor: '#3B82F6',
  },
  imagePreview: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  previewImage: {
    width: 250,
    height: 350,
    borderRadius: 12,
  },
  analyzingText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
  },
  instructions: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  scanButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 999,
    minWidth: 150,
    alignItems: 'center',
  },
  halfButton: {
    flex: 1,
    minWidth: 0,
  },
  thirdButton: {
    flex: 1,
    minWidth: 0,
    maxWidth: 80,
  },
  scanButtonActive: {
    backgroundColor: '#EF4444',
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});
