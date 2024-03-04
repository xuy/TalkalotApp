import React, { useState, useEffect } from 'react';
import { View, Button, StyleSheet, Alert, Text } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import "react-native-get-random-values";  // do it before uuid
import { v4 as uuidv4 } from 'uuid';

type RecordingScreenRouteProp = RouteProp<{ params: {
  recordingId?: string
} }, 'params'>;

const RecordingScreen: React.FC = () => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);

  const route = useRoute<RecordingScreenRouteProp>();
  const navigation = useNavigation();

  const { recordingId } = route.params || {};

  useEffect(() => {
    if (recordingId) {
      loadRecordingDetails();
    } else {
      startRecording();
    }
  }, [recordingId]);

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

  const loadRecordingDetails = async () => {
    if (recordingId) {
      try {
        const recordingDetailsJson = await AsyncStorage.getItem(recordingId);
        if (recordingDetailsJson) {
          const recordingDetails = JSON.parse(recordingDetailsJson);
          const { uri, displayName, transcript } = recordingDetails;
          console.log("file uri is ", uri);
          // Load the recording for playback
          const { sound } = await Audio.Sound.createAsync({ uri: uri });
          setSound(sound);
          setTranscript(transcript || 'No transcript available.');
        } else {
          Alert.alert('Recording not found');
        }
      } catch (error) {
        console.error('Error loading recording details:', error);
        Alert.alert('Error loading recording');
      }
    } else {
      // Handle new recording setup if needed
    }
  };

  const startRecording = async () => {
    if (isRecording) {
      return;
    }
    try {
      console.log('Starting recording...');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
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
    const displayName = "Untitled";
    console.log('Recording stopped and stored at', uri);

    const metadata = {
      id,
      uri,
      displayName,
      fileName,
      date: new Date().toISOString(),
    };

    await AsyncStorage.setItem(id, JSON.stringify(metadata));
    setRecording(null);
  };

  const handlePlayPause = async () => {
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if ('isLoaded' in status && status.isLoaded) {
    if (status.isPlaying) {
      sound.pauseAsync();
    } else {
      sound.playAsync();
    }
  } else {
    console.error("Audio file is not loaded.");
  }
  };

  const handleSeekForward = async () => {
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if ('isLoaded' in status && status.isLoaded) {
      await sound.setPositionAsync(status.positionMillis + 10000); // Forward 10 seconds
    } else {
      console.error("Audio file is not loaded.");
    }
  };

  const handleSeekBackward = async () => {
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if ('isLoaded' in status && status.isLoaded) {
      await sound.setPositionAsync(Math.max(0, status.positionMillis - 10000)); // Backward 10 seconds
    } else {
      console.error("Audio file is not loaded.");
    }
  };


  return (
    <View style={styles.container}>
      {!recordingId ? (
        <>
          {isRecording ? (
            <Button title="Stop Recording" onPress={stopRecording} />
          ) : (
            <Button title="Start Recording" onPress={startRecording} />
          )}
        </>
      ) : (
        <>
          <Text>{transcript}</Text>

          <Button title="Backward 10s" onPress={handleSeekBackward} />
          <Button title="Play/Pause" onPress={handlePlayPause} />
          <Button title="Forward 10s" onPress={handleSeekForward} />

        </>
      )}
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
