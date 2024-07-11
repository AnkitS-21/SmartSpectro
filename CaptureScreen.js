import React, { useState } from 'react';
import { View, Button, Image, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const SERVER_URL = 'http://10.7.63.15:5000';

export default function CaptureScreen({ navigation }) {
  const [referenceImage, setReferenceImage] = useState(null);
  const [sampleImage, setSampleImage] = useState(null);
  const [analyzedImage, setAnalyzedImage] = useState(null);

  const pickImage = async (type) => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      if (type === 'reference') {
        setReferenceImage(result.assets[0].uri);
        uploadImage(result.assets[0].uri, 'capture_reference');
      } else if (type === 'sample') {
        setSampleImage(result.assets[0].uri);
        uploadImage(result.assets[0].uri, 'analyze_sample');
      }
    }
  };

  const uploadImage = async (uri, endpoint) => {
    let formData = new FormData();
    formData.append('image', {
      uri,
      name: 'image.jpg',
      type: 'image/jpeg',
    });

    try {
      console.log(`Uploading image to ${SERVER_URL}/${endpoint}`);
      const response = await axios.post(`${SERVER_URL}/${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'image/png' // Ensure the server sends the image back
        },
        responseType: 'arraybuffer', // Expect a binary response
      });

      console.log('Server response:', response);

      if (response.status === 200) {
        const base64 = btoa(
          new Uint8Array(response.data).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ''
          )
        );
        const imageUri = `data:image/png;base64,${base64}`;
        setAnalyzedImage(imageUri);
        navigation.navigate('AnalysisScreen', { analyzedImage: imageUri });
        Alert.alert('Success', 'Spectrum analyzed successfully.');
      } else {
        Alert.alert('Error', 'Failed to upload image.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Capture Reference Spectrum" onPress={() => pickImage('reference')} />
      {referenceImage && <Image source={{ uri: referenceImage }} style={styles.image} />}

      <Button title="Capture Sample Spectrum" onPress={() => pickImage('sample')} disabled={!referenceImage} />
      {sampleImage && <Image source={{ uri: sampleImage }} style={styles.image} />}

      <Button title="Analyze Spectrum" onPress={() => uploadImage(sampleImage, 'analyze_sample')} disabled={!sampleImage} />
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
    width: 200,
    height: 200,
    marginVertical: 10,
  },
});
