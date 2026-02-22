import { Lock, Bell, Check, ChevronRight, Globe, Info, ShieldCheck, X } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Alert,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SettingsScreen() { 
  const [notifications, setNotifications] = useState({
    sound: true,
    location: true,
    sensors: true,
	record: true,
  });
  const [pinVisible, setPinVisible] = useState(false);
  const [currentSavedPin, setCurrentSavedPin] = useState<string | null>(null);
  const [oldPinInput, setOldPinInput] = useState("");
  const [newPinInput, setNewPinInput] = useState("");

  // 1. Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem("app_settings");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setNotifications(parsed.notifications);
      }
    } catch (error) {
      console.error("Failed to load settings", error);
    }
  };

  // 2. Save settings to AsyncStorage
  const saveSettings = async () => {
    try {
      const settingsToSave = {
        language,
        notifications,
      };
      await AsyncStorage.setItem("app_settings", JSON.stringify(settingsToSave));
      Alert.alert("Success", "Settings saved successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to save settings.");
    }
  };

  const toggleSwitch = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [aboutVisible, setAboutVisible] = useState(false);
  
  useEffect(() => {
    loadSettings();
    checkExistingPin();
  }, []);

  const checkExistingPin = async () => {
    const pin = await AsyncStorage.getItem("vault_pin");
    setCurrentSavedPin(pin);
  };

  const handleSavePin = async () => {
    if (newPinInput.length !== 4) {
      Alert.alert("Error", "PIN must be exactly 4 digits.");
      return;
    }

    if (currentSavedPin) {
      // Logic for changing PIN
      if (oldPinInput !== currentSavedPin) {
        Alert.alert("Error", "Old PIN is incorrect.");
        return;
      }
    }

    await AsyncStorage.setItem("vault_pin", newPinInput);
    setCurrentSavedPin(newPinInput);
    setPinVisible(false);
    setOldPinInput("");
    setNewPinInput("");
    Alert.alert("Success", "Vault PIN updated successfully.");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Settings</Text>
		
		{/* --- NEW: Vault Security Section --- */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBg, { backgroundColor: "#2d0a0a" }]}>
              <Lock size={20} color="#e63946" />
            </View>
            <Text style={styles.sectionTitle}>Vault Security</Text>
          </View>
          <TouchableOpacity 
            style={styles.optionItem} 
            onPress={() => setPinVisible(true)}
          >
            <Text style={styles.optionText}>
              {currentSavedPin ? "Change Vault PIN" : "Create Vault PIN"}
            </Text>
            <ChevronRight size={18} color="#888" />
          </TouchableOpacity>
        </View>

        

        {/* Notifications Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBg, { backgroundColor: "#162345" }]}>
              <Bell size={20} color="#556ee6" />
            </View>
            <Text style={styles.sectionTitle}>App Controls</Text>
          </View>

          {[
            { key: "sound", label: "Sound Alerts", sub: "Loud siren on SOS" },
            { key: "location", label: "Live Location", sub: "Share location continuously" },
            { key: "sensors", label: "Sensors", sub: "Sensitive detection enabled" },
			{ key: "record", label: "Video Record", sub: "Video Record detection enabled" },
          ].map((item, index) => (
            <React.Fragment key={item.key}>
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>{item.label}</Text>
                  <Text style={styles.switchSubLabel}>{item.sub}</Text>
                </View>
                <Switch
                  value={notifications[item.key as keyof typeof notifications]}
                  onValueChange={() => toggleSwitch(item.key as keyof typeof notifications)}
                  trackColor={{ false: "#3a4a5a", true: "#00C4B4" }}
                  thumbColor="#fff"
                />
              </View>
              {index < 3 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* App Preferences Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBg, { backgroundColor: "#211645" }]}>
              <ShieldCheck size={20} color="#a855f7" />
            </View>
            <Text style={styles.sectionTitle}>App Preferences</Text>
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.prefLeft}>
              <Globe size={18} color="#888" />
              <Text style={styles.prefLabel}>Dark Mode</Text>
            </View>
            <Text style={styles.prefValue}>Use header toggle</Text>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.preferenceItem}
            onPress={() => setAboutVisible(true)}
          >
            <View style={styles.prefLeft}>
              <Info size={18} color="#888" />
              <Text style={styles.prefLabel}>About Raksha</Text>
            </View>
            <ChevronRight size={18} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={saveSettings}>
          <Text style={styles.saveBtnText}>Save Settings</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* I adding model here */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={aboutVisible}
        onRequestClose={() => setAboutVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setAboutVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About Raksha Safety</Text>
              <TouchableOpacity onPress={() => setAboutVisible(false)}>
                <X size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <Text style={styles.aboutText}>
              Raksha Safety is a comprehensive personal security application
              designed to provide peace of mind through AI-powered voice
              triggers, one-tap SOS alerts, and safety tools like Fake Calling.
            </Text>

            <View style={styles.devSection}>
              <Text style={styles.devTitle}>Developers</Text>
              <Text style={styles.devName}>• Abhijit</Text>
              <Text style={styles.devName}>• Purnima</Text>
            </View>

            <Text style={styles.versionText}>Version 1.0.0 (Beta)</Text>
          </View>
        </Pressable>
      </Modal>
	  
	  {/* --- PIN MODAL --- */}
      <Modal visible={pinVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{currentSavedPin ? "Change PIN" : "Setup PIN"}</Text>
            
            {currentSavedPin && (
              <TextInput
                style={styles.pinInput}
                placeholder="Enter Old PIN"
                placeholderTextColor="#555"
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                value={oldPinInput}
                onChangeText={setOldPinInput}
              />
            )}

            <TextInput
              style={styles.pinInput}
              placeholder={currentSavedPin ? "Enter New 4-Digit PIN" : "Create 4-Digit PIN"}
              placeholderTextColor="#555"
              keyboardType="numeric"
              secureTextEntry
              maxLength={4}
              value={newPinInput}
              onChangeText={setNewPinInput}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity style={[styles.saveBtn, { flex: 1, backgroundColor: '#1e2d3d' }]} onPress={() => setPinVisible(false)}>
                <Text style={styles.saveBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { flex: 1 }]} onPress={handleSavePin}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020d1a" },
  scrollBody: { padding: 20, paddingBottom: 120 },
  title: { color: "#fff", fontSize: 28, fontWeight: "bold", marginBottom: 25 },

  sectionCard: {
    backgroundColor: "#0f1a2a",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  iconBg: { padding: 8, borderRadius: 10 },
  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  sectionSubtitle: {
    color: "#888",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 15,
  },

  optionItem: {
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
  optionItemActive: {
    borderColor: "#00C4B4",
    backgroundColor: "rgba(0, 196, 180, 0.05)",
  },
  optionText: { color: "#888", fontSize: 15, fontWeight: "500" },
  optionTextActive: { color: "#fff" },

  timerRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  timerBtn: {
    flex: 1,
    backgroundColor: "#1e2d3d",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a3b4d",
  },
  timerBtnActive: { backgroundColor: "#f39c12", borderColor: "#f39c12" },
  timerText: { color: "#888", fontWeight: "bold" },
  timerTextActive: { color: "#fff" },

  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  switchLabel: { color: "#fff", fontSize: 15, fontWeight: "600" },
  switchSubLabel: { color: "#888", fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: "#1e2d3d", marginVertical: 4 },

  preferenceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
  },
  prefLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  prefLabel: { color: "#fff", fontSize: 15 },
  prefValue: { color: "#888", fontSize: 13 },

  saveBtn: {
    backgroundColor: "#00C4B4",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 10,
    elevation: 5,
    shadowColor: "#00C4B4",
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  saveBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  //   Model css
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)", // Darkens the background
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#0f1a2a",
    borderRadius: 25,
    padding: 25,
    borderWidth: 1,
    borderColor: "#1e2d3d",
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: "#00C4B4",
    fontSize: 20,
    fontWeight: "bold",
  },
  aboutText: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  devSection: {
    backgroundColor: "#1e2d3d",
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
  },
  devTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  devName: {
    color: "#00C4B4",
    fontSize: 15,
    marginBottom: 5,
    fontWeight: "500",
  },
  versionText: {
    color: "#555",
    textAlign: "center",
    fontSize: 12,
  },
  pinInput: {
    backgroundColor: '#1e2d3d',
    color: '#fff',
    padding: 15,
    borderRadius: 12,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#2a3b4d'
  },
});
