import { Slot } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import CustomNavbar from './CustomNavbar';
import Header from './Header'; // Import your new Header

export default function TabLayout() {
  return (
    <View style={styles.container}>
      {/* GLOBAL HEADER */}
      <Header />
      
      {/* PAGE CONTENT */}
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
      
      {/* GLOBAL NAVBAR */}
      <CustomNavbar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020d1a',
  },
});