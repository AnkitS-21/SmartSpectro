import React from 'react';
import { View, Button, Image, StyleSheet, Alert, Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

export default function AnalysisScreen({ route }) {
  const { analyzedImage } = route.params;

  const saveImage = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access media library is required!');
        return;
      }

      const filename = FileSystem.documentDirectory + 'spectrum.png';
      await FileSystem.writeAsStringAsync(filename, analyzedImage.split(',')[1], { encoding: FileSystem.EncodingType.Base64 });

      const asset = await MediaLibrary.createAssetAsync(filename);
      await MediaLibrary.createAlbumAsync('Spectroscopy', asset, false);
      Alert.alert('Image Saved', 'The spectrum image has been saved to your gallery.');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Save error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      {analyzedImage && <Image source={{ uri: analyzedImage }} style={styles.image} />}
      <Button title="Save Spectrum Image" onPress={saveImage} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  image: {
    width: 300,
    height: 300,
    marginVertical: 10,
  },
});
