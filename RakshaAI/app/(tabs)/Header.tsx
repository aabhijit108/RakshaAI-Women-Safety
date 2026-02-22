import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Sun } from 'lucide-react-native';

export default function Header() {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.greeting}>Namaste, Priya</Text>
        <Text style={styles.brand}>Raksha Safety</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#006d64",
    paddingTop: 50, // Safety for status bar
  },
  greeting: { color: "#00C4B4", fontSize: 12 },
  brand: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  sunIcon: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
  },
});