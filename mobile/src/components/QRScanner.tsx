import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button } from 'react-native-paper';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { RNCamera } from 'react-native-camera';
import { useNavigation } from '@react-navigation/native';

interface QRScannerProps {
  onScan: (data: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan }) => {
  const navigation = useNavigation();
  const [scanned, setScanned] = useState(false);

  const onSuccess = (e: any) => {
    if (!scanned) {
      setScanned(true);
      onScan(e.data);
      Alert.alert('QR Code', e.data, [
        {
          text: 'OK',
          onPress: () => {
            setScanned(false);
            navigation.goBack();
          },
        },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <QRCodeScanner
        onRead={onSuccess}
        flashMode={RNCamera.Constants.FlashMode.off}
        topContent={<Text style={styles.title}>Quét QR Code</Text>}
        bottomContent={
          <Button mode="contained" onPress={() => navigation.goBack()}>
            Đóng
          </Button>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
});

export default QRScanner;

