import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

export default function QRScanner({
  expectedValue,
  onScanSuccess,
}: {
  expectedValue: string;
  onScanSuccess: () => void;
}) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [hasPermission, setHasPermission] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // Request camera permission
  useEffect(() => {
    const getPermission = async () => {
      const { status } = await requestPermission();
      setHasPermission(status === 'granted');
    };

    getPermission();
  }, [requestPermission]);

  const toggleCameraFacing = () => {
    setFacing(facing === 'back' ? 'front' : 'back');
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return; // If already scanned, prevent further scans
    setScanned(true);

    console.log("Data: ", data, "Expected value: ", expectedValue);
    if (data !== expectedValue) {
      Alert.alert('Failure', 'The scanned value does not match its device.');
    } else {
      onScanSuccess(); // Call the function when scan is successful
    }
  };

  if (!hasPermission) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <Text style={styles.text}>Flip Camera</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    left: '50%',
  },
  button: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
  },
  text: {
    color: 'white',
    fontSize: 18,
  },
});
