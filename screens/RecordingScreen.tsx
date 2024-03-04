import React, { useState, useEffect } from 'react'
import {
  View,
  Button,
  StyleSheet,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native'
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Audio } from 'expo-av'
import 'react-native-get-random-values' // do it before uuid
import { v4 as uuidv4 } from 'uuid'
import { Ionicons } from '@expo/vector-icons'

type RecordingScreenRouteProp = RouteProp<
  {
    params: {
      recordingId?: string
    }
  },
  'params'
>

const RecordingScreen: React.FC = () => {
  // Recording
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [recording, setRecording] = useState<Audio.Recording | null>(null)

  // Play back
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [sound, setSound] = useState<Audio.Sound | null>(null)

  const [transcript, setTranscript] = useState<string | null>(null)

  // Editing
  const [isEditing, setIsEditing] = useState(false)
  const [editableTitle, setEditableTitle] = useState('')
  const [originalTitle, setOriginalTitle] = useState('')

  const route = useRoute<RecordingScreenRouteProp>()
  const navigation = useNavigation()

  const { recordingId } = route.params || {}

  useEffect(() => {
    if (recordingId) {
      loadRecordingDetails()
    } else {
      startRecording()
    }
  }, [recordingId])

  useEffect(() => {
    ;(async () => {
      // Request permission to access the audio recording
      const permission = await Audio.requestPermissionsAsync()
      if (permission.status !== 'granted') {
        Alert.alert(
          'Permission not granted',
          'Please enable microphone access in your system settings.'
        )
        return
      }

      // Prepare the audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      })
    })()
  }, [])

  // =========== Title Editing  =================
  const startEditing = () => {
    setIsEditing(true)
    setOriginalTitle(editableTitle) // Save the original title in case of cancel
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditableTitle(originalTitle) // Restore the original title
  }

  const handleSaveTitle = async () => {
    if (recordingId) {
      setIsEditing(false)
      // Update the AsyncStorage with the new title, keeping other details the same
      try {
        const recordingDetailsJson = await AsyncStorage.getItem(recordingId)
        if (recordingDetailsJson !== null) {
          const recordingDetails = JSON.parse(recordingDetailsJson)
          recordingDetails.displayName = editableTitle // Update title
          await AsyncStorage.setItem(
            recordingId,
            JSON.stringify(recordingDetails)
          )
        }
      } catch (error) {
        console.error('Error saving new title:', error)
        Alert.alert('Error', 'Failed to save the new title.')
      }
    } else {
      console.log('cannot save title when there is no recording target')
    }
  }
  // =========== Title Editing  =================

  // ===========  Loading  =================
  const loadRecordingDetails = async () => {
    if (recordingId) {
      try {
        const recordingDetailsJson = await AsyncStorage.getItem(recordingId)
        if (recordingDetailsJson) {
          const recordingDetails = JSON.parse(recordingDetailsJson)
          setEditableTitle(recordingDetails.displayName)
          // Initialize originalTitle as well, if needed
          setOriginalTitle(recordingDetails.displayName)
          const { uri, transcript } = recordingDetails
          console.log('file uri is ', uri)
          // Load the recording for playback
          const { sound } = await Audio.Sound.createAsync({ uri: uri })
          setSound(sound)
          setTranscript(transcript || 'No transcript available.')
        } else {
          Alert.alert('Recording not found')
        }
      } catch (error) {
        console.error('Error loading recording details:', error)
        Alert.alert('Error loading recording')
      }
    } else {
      // Handle new recording setup if needed
    }
  }
  // ===========  Loading  =================

  // ===========  Recording  =================
  const startRecording = async () => {
    if (isRecording) {
      return
    }
    try {
      console.log('Starting recording...')
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      )
      setRecording(recording)
      setIsRecording(true)
      console.log('Recording started')
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }

  const stopRecording = async () => {
    if (!recording) return
    setIsRecording(false)
    await recording.stopAndUnloadAsync()
    const uri = recording.getURI()
    const id = uuidv4() // Generate a UUID for the filename
    const fileName = `${id}.m4a`
    const displayName = 'Untitled'
    console.log('Recording stopped and stored at', uri)

    const metadata = {
      id,
      uri,
      displayName,
      fileName,
      date: new Date().toISOString(),
    }

    await AsyncStorage.setItem(id, JSON.stringify(metadata))
    setRecording(null)
  }
  // ===========  Recording  =================

  // ===========  Playback  =================
  const handlePlayPause = async () => {
    if (!sound) return
    const status = await sound.getStatusAsync()
    if ('isLoaded' in status && status.isLoaded) {
      if (status.isPlaying) {
        sound.pauseAsync()
        setIsPlaying(false)
      } else {
        sound.playAsync()
        setIsPlaying(true)
      }
    } else {
      console.error('Audio file is not loaded.')
    }
  }

  const handleSeekForward = async () => {
    if (!sound) return
    const status = await sound.getStatusAsync()
    if ('isLoaded' in status && status.isLoaded) {
      await sound.setPositionAsync(status.positionMillis + 10000) // Forward 10 seconds
    } else {
      console.error('Audio file is not loaded.')
    }
  }

  const handleSeekBackward = async () => {
    if (!sound) return
    const status = await sound.getStatusAsync()
    if ('isLoaded' in status && status.isLoaded) {
      await sound.setPositionAsync(Math.max(0, status.positionMillis - 10000)) // Backward 10 seconds
    } else {
      console.error('Audio file is not loaded.')
    }
  }
  // ===========  Playback  =================

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
          <View style={styles.titleContainer}>
            {isEditing ? (
              <>
                <Text>dead</Text>
                <TouchableOpacity onPress={handleCancelEdit}>
                  <Ionicons name="close" size={24} color="black" />
                </TouchableOpacity>
                <TextInput
                  value={editableTitle}
                  onChangeText={setEditableTitle}
                  autoFocus={true}
                  style={styles.editableTitle}
                />
                <TouchableOpacity onPress={handleSaveTitle}>
                  <Ionicons name="checkmark" size={24} color="black" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={() => startEditing()}>
                  <Text style={styles.titleText}>
                    {editableTitle || 'Tap to edit title'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text> Here here </Text>
          <Text>{transcript}</Text>

          <View style={styles.controlsContainer}>
            <TouchableOpacity
              onPress={handleSeekBackward}
              style={styles.backwardButton}
            >
              <Ionicons name="play-back" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePlayPause}
              style={styles.playButton}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={32}
                color="black"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSeekForward}
              style={styles.forwardButton}
            >
              <Ionicons name="play-forward" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    backgroundColor: 'lightblue',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  editableTitle: {
    flex: 1,
    marginHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'grey',
  },
  titleText: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E1E1E1', // Light gray background, adjust color as needed
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  backwardButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E1E1E1', // Light gray background, adjust color as needed
    justifyContent: 'center',
    alignItems: 'center',
  },
  forwardButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E1E1E1', // Light gray background, adjust color as needed
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default RecordingScreen
