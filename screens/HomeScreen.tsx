import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

interface RecordingItem {
  id: string;
  uri: string;
  fileName: string;
  date: string;
}

const HomeScreen: React.FC = () => {
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);

  useEffect(() => {
    const fetchRecordings = async () => {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      const recordings = items
        .map(item => JSON.parse(item[1] || '{}') as RecordingItem)
        .sort((a, b) => b.date.localeCompare(a.date)); // Sort by date in reverse chronological order
      setRecordings(recordings);
    };

    fetchRecordings();
  }, []);

  const playSound = async (uri: string) => {
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true }
    );
    await sound.playAsync();
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={recordings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text>{item.fileName} - {new Date(item.date).toLocaleString()}</Text>
            <Button title="Play" onPress={() => playSound(item.uri)} />
          </View>
        )}
      />
    </View>
  );
};

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
});

export default HomeScreen;
