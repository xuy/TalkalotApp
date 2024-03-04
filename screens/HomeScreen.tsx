import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Button,
  FlatList,
} from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Audio } from 'expo-av'
import { Ionicons } from '@expo/vector-icons'

interface RecordingItem {
  id: string
  uri: string
  displayName: string
  fileName: string
  date: string
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation()
  const navigateToRecording = () => {
    navigation.navigate('Recording', { startRecording: true })
  }
  const [recordings, setRecordings] = useState<RecordingItem[]>([])

  const fetchRecordings = async () => {
    const keys = await AsyncStorage.getAllKeys()
    const items = await AsyncStorage.multiGet(keys)
    const recordings = items
      .map((item) => JSON.parse(item[1] || '{}') as RecordingItem)
      .sort((a, b) => b.date.localeCompare(a.date)) // Sort by date in reverse chronological order
    setRecordings(recordings)
  }

  useFocusEffect(
    useCallback(() => {
      fetchRecordings()
    }, [])
  )

  const playSound = async (uri: string) => {
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true }
    )
    await sound.playAsync()
  }

  const RecordingItemC = ({ item, onPress }) => {
    // Format the date
    const date = new Date(item.date)
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date)

    return (
      <TouchableOpacity onPress={onPress} style={styles.itemContainer}>
        <View style={styles.itemTextContainer}>
          <Text style={styles.titleText}>{item.displayName}</Text>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>
        <Ionicons name="play-sharp" size={24} color="black" />
      </TouchableOpacity>
    )
  }

  const handlePressRecordingItem = (recordingId: string) => {
    navigation.navigate('Recording', { recordingId: recordingId })
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={recordings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <RecordingItemC
              item={item}
              onPress={() => handlePressRecordingItem(item.id)}
            />
          </View>
        )}
      />
      <TouchableOpacity
        onPress={navigateToRecording}
        style={styles.recordButton}
      >
        <Text style={styles.recordButtonText}>⬤</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  recordButton: {
    position: 'relative',
    bottom: 50,
    right: 0,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonText: {
    fontSize: 40,
    color: '#ffffff',
    textAlign: 'center',
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTextContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
    color: 'grey',
  },
})

export default HomeScreen
