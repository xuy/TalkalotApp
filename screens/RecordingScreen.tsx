import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

function RecordingScreen() {
  return (
    <View style={styles.container}>
      <Text>Recording...</Text>
      <Button title="Pause" onPress={() => {}} />
      <Button title="Save" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RecordingScreen;
