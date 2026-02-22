import { Clock, Minus, Music, Phone, Plus, User, FolderOpen, CheckCircle } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import FakeCallOverlay from './FakeCallOverlay';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';

export default function FakeCallScreen() {
  const [selectedCaller, setSelectedCaller] = useState("");
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [customRingtone, setCustomRingtone] = useState<{ name: string, uri: string } | null>(null);
  const [selectedRingtone, setSelectedRingtone] = useState("Soft Melody");
  const [delay, setDelay] = useState(5);
  const [callers, setCallers] = useState<string[]>([]);
  const [fakeCallVisible, setFakeCallVisible] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Audio cleanup
  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  // 1. Load saved ringtone on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedTone = await AsyncStorage.getItem('selected_ringtone');
        const savedCustom = await AsyncStorage.getItem('custom_ringtone');
        
        if (savedTone) setSelectedRingtone(savedTone);
        if (savedCustom) setCustomRingtone(JSON.parse(savedCustom));
      } catch (e) {
        console.error("Failed to load ringtone settings", e);
      }
    };
    loadSettings();
  }, []);

  // 1. Load Dynamic Names from Contacts Page
  useEffect(() => {
    const loadContactNames = async () => {
      try {
        const savedData = await AsyncStorage.getItem('emergency_contacts');
        if (savedData) {
          const contacts = JSON.parse(savedData);
          // Only show contacts that are toggled "ON"
          const activeNames = contacts
            .filter((c: any) => c.isOn)
            .map((c: any) => c.name);
          
          setCallers(activeNames);
          if (activeNames.length > 0) setSelectedCaller(activeNames[0]);
        }
      } catch (e) {
        console.error("Failed to load names", e);
      }
    };
    loadContactNames();
  }, []);

  // Ringtone
  const ringtones = ["Classic Ring", "Modern Tone", "Urgent Beep", "Soft Melody"];
  const pickCustomRingtone = async () => {
  try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (!result.canceled) {
        const file = result.assets[0];
        const customData = { name: file.name, uri: file.uri };
        setCustomRingtone(customData);
        setSelectedRingtone(file.name);
        
        await AsyncStorage.setItem('selected_ringtone', file.name);
        await AsyncStorage.setItem('custom_ringtone', JSON.stringify(customData));
        // playPreview logic...
      }

    if (!result.canceled) {
      const file = result.assets[0];
      setCustomRingtone({ name: file.name, uri: file.uri });
      setSelectedRingtone(file.name);
      // Automatically preview the sound
      playPreview(file.uri);
    }
  } catch (err) {
    console.error("Error picking document", err);
  }
};

const playPreview = async (uriOrAsset: any) => {
  // Stop existing sound
  if (sound) {
    await sound.stopAsync();
    await sound.unloadAsync();
  }

  const { sound: newSound } = await Audio.Sound.createAsync(
    typeof uriOrAsset === 'string' ? { uri: uriOrAsset } : uriOrAsset,
    { shouldPlay: true, volume: 1.0 }
  );
  setSound(newSound);
};

const handleToneSelection = async (tone: string) => {
  setSelectedRingtone(tone);

  try {
      await AsyncStorage.setItem('selected_ringtone', tone);
    } catch (e) {
      console.error("Failed to save ringtone", e);
    }
  
  // Logic to play specific asset based on name
  let asset;
  switch(tone) {
    case "Classic Ring": asset = require("../../assets/sounds/classic.mp3"); break;
    case "Modern Tone": asset = require("../../assets/sounds/modern.mp3"); break;
    case "Urgent Beep": asset = require("../../assets/sounds/urgent.mp3"); break;
    case "Soft Melody": asset = require("../../assets/sounds/soft.mp3"); break;
    default: return; // Custom ringtone is handled via URI
  }
  playPreview(asset);
};

const getAssetForTone = (toneName: string) => {
  switch (toneName) {
    case "Classic Ring":
      return require("../../assets/sounds/classic.mp3");
    case "Modern Tone":
      return require("../../assets/sounds/modern.mp3");
    case "Urgent Beep":
      return require("../../assets/sounds/urgent.mp3");
    case "Soft Melody":
      return require("../../assets/sounds/soft.mp3");
    default:
      // Fallback to a default sound if no match is found
      return require("../../assets/sounds/classic.mp3");
  }
};

  // 2. Schedule Logic
  const handleSchedule = () => {
    if (!selectedCaller) {
      Alert.alert("Action Required", "Please turn ON a contact in the Contacts page first.");
      return;
    }

    Alert.alert("Call Scheduled", `Incoming call from ${selectedCaller} in ${delay} seconds.`, [
      { text: "Cancel", style: "cancel" },
      { text: "OK", onPress: startTimer }
    ]);
  };

  const startTimer = () => {
    setCountdown(delay);
    const timerId: any = setInterval(() => {
      setCountdown((prev) => {
        if (prev && prev <= 1) {
          clearInterval(timerId);
          setFakeCallVisible(true); // Trigger the Overlay
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Fake Call</Text>
        <Text style={styles.subtitle}>Schedule a fake call to escape uncomfortable situations</Text>

        {/* Who is calling? Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <User size={20} color="#fff" />
            <Text style={styles.sectionTitle}>Who is calling?</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {callers.length > 0 ? callers.map((caller) => (
              <TouchableOpacity
                key={caller}
                style={[styles.chip, selectedCaller === caller && styles.chipActive]}
                onPress={() => setSelectedCaller(caller)}
              >
                <Text style={[styles.chipText, selectedCaller === caller && styles.chipTextActive]}>
                  {caller}
                </Text>
              </TouchableOpacity>
            )) : <Text style={{color: '#888'}}>No active contacts found.</Text>}
          </ScrollView>
        </View>

        {/* Ringtone Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Music size={20} color="#fff" />
            <Text style={styles.sectionTitle}>Ringtone</Text>
          </View>

          {/* Custom Ringtone Button */}
          <TouchableOpacity 
            style={[styles.listOption, styles.customOption]} 
            onPress={pickCustomRingtone}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <FolderOpen size={20} color="#556ee6" />
              <Text style={styles.optionText}>
                {customRingtone ? customRingtone.name : "Add Custom Ringtone"}
              </Text>
            </View>
            {selectedRingtone === customRingtone?.name && <View style={styles.radioDot} />}
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Default Ringtones */}
          {ringtones.map((tone) => (
            <TouchableOpacity
              key={tone}
              style={[styles.listOption, selectedRingtone === tone && styles.listOptionActive]}
              onPress={() => handleToneSelection(tone)}
            >
              <Text style={styles.optionText}>{tone}</Text>
              {selectedRingtone === tone && <View style={styles.radioDot} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Delay Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color="#fff" />
            <Text style={styles.sectionTitle}>Delay (Seconds)</Text>
          </View>
          <View style={styles.counterRow}>
            <TouchableOpacity style={styles.counterBtn} onPress={() => setDelay(Math.max(1, delay - 1))}>
              <Minus size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.delayDisplay}>
              <Text style={styles.delayText}>{countdown !== null ? countdown : delay}s</Text>
            </View>
            <TouchableOpacity style={styles.counterBtn} onPress={() => setDelay(delay + 1)}>
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Schedule Button */}
        <TouchableOpacity style={styles.scheduleBtn} onPress={handleSchedule}>
          <Phone size={24} color="#fff" style={styles.btnIcon} />
          <Text style={styles.scheduleBtnText}>
            {countdown !== null ? `Calling in ${countdown}s...` : "Schedule Fake Call"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* The Actual Call Screen */}
      <FakeCallOverlay 
        visible={fakeCallVisible} 
        callerName={selectedCaller} 
        ringtoneUri={customRingtone?.uri || getAssetForTone(selectedRingtone)}
        onHangUp={() => setFakeCallVisible(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020d1a" },
  scrollBody: { padding: 20, paddingBottom: 120 },
  title: { color: "#fff", fontSize: 28, fontWeight: "bold" },
  subtitle: { color: "#888", fontSize: 14, marginTop: 5, marginBottom: 25 },

  sectionCard: {
    backgroundColor: "#0f1a2a",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 10,
  },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  chipRow: { flexDirection: "row" },
  chip: {
    backgroundColor: "#1e2d3d",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#2a3b4d",
  },
  chipActive: {
    backgroundColor: "rgba(43, 91, 159, 0.3)",
    borderColor: "#2b5b9f",
  },
  chipText: { color: "#888", fontWeight: "bold" },
  chipTextActive: { color: "#556ee6" },

  listOption: {
    backgroundColor: "#1e2d3d",
    padding: 18,
    borderRadius: 15,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a3b4d",
  },
  listOptionActive: {
    backgroundColor: "rgba(43, 91, 159, 0.2)",
    borderColor: "#2b5b9f",
  },
  optionText: { color: "#fff", fontSize: 15 },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#556ee6",
  },

  counterRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  counterBtn: {
    backgroundColor: "#1e2d3d",
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  delayDisplay: {
    backgroundColor: "#1e2d3d",
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#2a3b4d",
  },
  delayText: { color: "#fff", fontSize: 32, fontWeight: "bold" },

  scheduleBtn: {
    backgroundColor: "#2b5b9f",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
    borderRadius: 15,
    marginTop: 10,
    shadowColor: "#2b5b9f",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  btnIcon: { marginRight: 10 },
  scheduleBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  customOption: {
  borderStyle: 'dashed',
  borderColor: '#556ee6',
  backgroundColor: 'rgba(85, 110, 230, 0.05)',
},
divider: {
  height: 1,
  backgroundColor: '#1e2d3d',
  marginVertical: 15,
},
});
