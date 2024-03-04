import React, { useState, useEffect } from 'react';
import { View, Button, StyleSheet, Alert, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import "react-native-get-random-values";  // do it before uuid
import { v4 as uuidv4 } from 'uuid';

const RecordingScreen: React.FC = () => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      // Request permission to access the audio recording
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission not granted', 'Please enable microphone access in your system settings.');
        return;
      }

      // Prepare the audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
    })();
  }, []);

  const startRecording = async () => {
    try {
      // Start recording
      console.log('Starting recording...');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };


  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    const id = uuidv4(); // Generate a UUID for the filename
    const fileName = `${id}.m4a`;
    console.log('Recording stopped and stored at', uri);

    const metadata = {
      id,
      uri,
      fileName,
      date: new Date().toISOString(),
    };

    await AsyncStorage.setItem(id, JSON.stringify(metadata));
    setRecording(null);
  };

  return (
    <View style={styles.container}>
      <Text>{isRecording ? 'Recording...' : 'Tap the button to start recording'}</Text>
      <Button
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
        onPress={isRecording ? stopRecording : startRecording}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RecordingScreen;
