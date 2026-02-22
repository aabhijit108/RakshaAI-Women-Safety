import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  StatusBar 
} from 'react-native';
import { 
  Shield, 
  Phone, 
  Users, 
  Settings, 
  Mic, 
  Power, 
  Sun, 
  MapPin, 
  AlertTriangle 
} from 'lucide-react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerNamaste}>Namaste, Priya</Text>
            <Text style={styles.headerTitle}>Raksha Safety</Text>
          </View>
          <TouchableOpacity style={styles.themeToggle}>
            <Sun size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Monitoring Card */}
        <View style={styles.monitoringCard}>
          <View style={styles.monitoringLeft}>
            <View style={styles.grayDot} />
            <View>
              <Text style={styles.monitoringText}>Safety Monitoring Off</Text>
              <Text style={styles.monitoringSubText}>Tap to start guarding</Text>
            </View>
          </View>
          <Power size={24} color="#888" />
        </View>

        {/* AI Voice Command Card */}
        <View style={styles.voiceCard}>
          <View style={styles.voiceHeader}>
            <View style={styles.micCircle}>
              <Mic size={20} color="#00C4B4" />
            </View>
            <Text style={styles.voiceTitle}>AI Voice Command</Text>
          </View>
          <Text style={styles.voiceDescription}>
            Say "Help Me" (Bachao), "Danger" (Khatra), or "SOS" to trigger emergency actions.
          </Text>
          <View style={styles.tagContainer}>
            <View style={styles.tag}><Text style={styles.tagText}>Hindi: "Bachao"</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>English: "Help"</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>Region: "Khatra"</Text></View>
          </View>
        </View>

        {/* SOS Button Section */}
        <View style={styles.sosSection}>
          <TouchableOpacity style={styles.sosOuterCircle}>
            <View style={styles.sosInnerCircle}>
              <Shield size={60} color="#fff" fill="#fff" />
              <Text style={styles.sosLargeText}>SOS</Text>
              <Text style={styles.sosSmallText}>TAP FOR HELP</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.emergencyContacts}>
            Pressing SOS will share live location with Dad, Mom, Brother
          </Text>
        </View>

        {/* Action Grid (Fake Call & Share Location) */}
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.blueIconBg}>
              <Phone size={22} color="#556ee6" />
            </View>
            <Text style={styles.actionCardTitle}>Fake Call</Text>
            <Text style={styles.actionCardSub}>Get a fake call to escape</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.greenIconBg}>
              <MapPin size={22} color="#00C4B4" />
            </View>
            <Text style={styles.actionCardTitle}>Share Location</Text>
            <Text style={styles.actionCardSub}>Send live location now</Text>
          </TouchableOpacity>
        </View>

        {/* Night Travel Tip */}
        <View style={styles.tipCard}>
          <AlertTriangle size={24} color="#f39c12" />
          <View style={styles.tipTextContent}>
            <Text style={styles.tipTitle}>Night Travel Tip</Text>
            <Text style={styles.tipDescription}>
              Keep app open and screen on. Voice commands work best in quiet environments.
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Shield size={24} color="#fff" />
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Users size={24} color="#a0ced9" />
          <Text style={styles.navText}>Contacts</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Phone size={24} color="#a0ced9" />
          <Text style={styles.navText}>Fake Call</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Settings size={24} color="#a0ced9" />
          <Text style={styles.navText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020d1a', // Dark theme background
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120, // Space for bottom nav
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerNamaste: {
    color: '#00C4B4',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  themeToggle: {
    backgroundColor: '#1a2a3a',
    padding: 10,
    borderRadius: 25,
  },
  monitoringCard: {
    backgroundColor: '#0f1a2a',
    padding: 18,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e2d3d',
    marginBottom: 20,
  },
  monitoringLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  grayDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#666',
    marginRight: 15,
  },
  monitoringText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  monitoringSubText: {
    color: '#888',
    fontSize: 13,
  },
  voiceCard: {
    backgroundColor: '#0f1a2a',
    padding: 20,
    borderRadius: 20,
    marginBottom: 40,
  },
  voiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  micCircle: {
    backgroundColor: '#0a2e2a',
    padding: 8,
    borderRadius: 12,
    marginRight: 12,
  },
  voiceTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  voiceDescription: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 15,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#1e2d3d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a3b4d',
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
  },
  sosSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  sosOuterCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(230, 57, 70, 0.2)', // Red glow
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosInnerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#e63946',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#ff0000',
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  sosLargeText: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '900',
    marginTop: 5,
  },
  sosSmallText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  emergencyContacts: {
    color: '#88a',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    paddingHorizontal: 30,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionCard: {
    backgroundColor: '#0f1a2a',
    width: '48%',
    padding: 20,
    borderRadius: 20,
  },
  blueIconBg: {
    backgroundColor: '#162345',
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  greenIconBg: {
    backgroundColor: '#0a2e2a',
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionCardTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionCardSub: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  tipCard: {
    backgroundColor: '#1a120b',
    padding: 18,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  tipTextContent: {
    marginLeft: 15,
    flex: 1,
  },
  tipTitle: {
    color: '#f39c12',
    fontWeight: 'bold',
    fontSize: 15,
  },
  tipDescription: {
    color: '#888',
    fontSize: 13,
    marginTop: 5,
    lineHeight: 18,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    backgroundColor: '#006d64',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingBottom: 15,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    color: '#a0ced9',
    fontSize: 12,
    marginTop: 4,
  },
  navTextActive: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    fontWeight: 'bold',
  },
});