import {
  AlertTriangle,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Mic,
  Phone,
  Power,
  Shield,
  X,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Linking,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayer } from "expo-audio";
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import * as FileSystem from "expo-file-system";
import { Directory, File, Paths } from "expo-file-system";
import * as Location from "expo-location";
import { Accelerometer } from "expo-sensors";
import * as SMS from "expo-sms";
import * as SpeechRecognitionModule from "expo-speech-recognition";
import * as TaskManager from "expo-task-manager";
import { SafeAreaView } from "react-native-safe-area-context";
import FakeCallOverlay from "./FakeCallOverlay";
import * as KeepAwake from 'expo-keep-awake';
import { moveAsync } from "expo-file-system/legacy";




const LOCATION_TRACKING_TASK = "location-tracking";

// Background Task Definition
TaskManager.defineTask(LOCATION_TRACKING_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error("Background Task Error:", error);
    return;
  }

  if (data) {
    try {
      // 1. Check Master Monitoring Switch
      const isMonitoringActive = await AsyncStorage.getItem(
        "is_monitoring_active",
      );

      // 2. Check Specific App Settings
      const settingsRaw = await AsyncStorage.getItem("app_settings");
      const settings = settingsRaw ? JSON.parse(settingsRaw) : null;

      // Exit if monitoring is off OR if the user disabled location sharing in settings
      if (
        isMonitoringActive !== "true" ||
        settings?.notifications?.location === false
      ) {
        // Optimization: Stop updates if the user has explicitly disabled this feature
        await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK);
        return;
      }

      const { locations } = data;
      const { latitude, longitude } = locations[0].coords;

      // 3. Proceed with Email Update
      await sendBackgroundUpdate(latitude, longitude);
    } catch (err) {
      console.error("Error in background task logic:", err);
    }
  }
});

const sendBackgroundUpdate = async (latitude: number, longitude: number) => {
  try {
    const savedData = await AsyncStorage.getItem("emergency_contacts");
    if (!savedData) return;

    const activeContacts = JSON.parse(savedData).filter(
      (c: any) => c.isOn === true,
    );

    for (const contact of activeContacts) {
      if (contact.email) {
        await fetch("http://localhost:5000/send-location-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude,
            longitude,
            recipientEmail: contact.email,
            isSOS: false,
          }),
        });
      }
    }
  } catch (error) {
    console.error("Background Email Error:", error);
  }
};

export default function HomeScreen() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [riskLevel, setRiskLevel] = useState<"LOW" | "MEDIUM" | "HIGH">("LOW");
  const [subscription, setSubscription] = useState<any>(null);
  const [fakeCallVisible, setFakeCallVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [savedRingtone, setSavedRingtone] = useState<any>(null);
  const [selectedCaller, setSelectedCaller] = useState("");
  const [riskScore, setRiskScore] = useState(0);
  const sirenTimeoutRef = useRef<any>(null);
  const cameraRef = useRef<CameraView>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

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

  const sirenSource = require("../../assets/sounds/police_siren.mp3");
  const sirenPlayer = useAudioPlayer(sirenSource);

  // Sync state with storage on startup
  useEffect(() => {
    (async () => {
      const active = await AsyncStorage.getItem("is_monitoring_active");
      setIsMonitoring(active === "true");
    })();

    return () => {
      if (subscription) subscription.remove();
      if (sirenTimeoutRef.current) clearTimeout(sirenTimeoutRef.current);
    };
  }, []);

  SpeechRecognitionModule.useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results[0]?.transcript;
    if (transcript) analyzeDistress(transcript.toLowerCase());
  });

  const analyzeDistress = async (text: string) => {
    try {
      // Do not use 'localhost' if testing on a physical phone.
      const response = await fetch("http://localhost:5000/analyze-risk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();

      if (data.result) {
        const { risk_level, risk_score } = data.result;

        // Convert your 1-10 score to a percentage for the UI
        setRiskScore(risk_score * 10);
        setRiskLevel(risk_level.toUpperCase());

        // Trigger SOS automatically if the server flags it as High
        if (risk_level.toLowerCase() === "high") {
          triggerSOS();
		  
		  // ADDED: Explicitly ensure recording starts if not already active
          if (!isRecording) {
            console.log("High risk detected via voice: Starting Emergency Recording...");
            startEmergencyRecording();
          }
        }
      }
    } catch (error) {
      console.error("Server Risk Analysis Error:", error);
      // Fallback logic if server is down:
      setRiskLevel("LOW");
    }
  };

  const startMonitoring = async () => {
    try {
      // 1. Fetch User Settings first
      const settingsRaw = await AsyncStorage.getItem("app_settings");
      const settings = settingsRaw ? JSON.parse(settingsRaw) : null;

      // 2. Request Permissions
      const micRes =
        await SpeechRecognitionModule.ExpoSpeechRecognitionModule.requestPermissionsAsync();
      const locRes = await Location.requestBackgroundPermissionsAsync();

      if (!micRes.granted || locRes.status !== "granted") {
        Alert.alert(
          "Permissions Required",
          "Microphone and 'Always' Location are needed for full protection.",
        );
        return;
      }

      // 3. Mark Monitoring as Active
      await AsyncStorage.setItem("is_monitoring_active", "true");
      setIsMonitoring(true);

      // 4. Start Sensors (ONLY if enabled in settings)
      if (settings?.notifications?.sensors !== false) {
        Accelerometer.setUpdateInterval(100);
        const sub = Accelerometer.addListener((data) => {
          const totalForce = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
          if (totalForce > 5.0) {
            triggerSOS(); // Only triggered on high force
          }
        });
        setSubscription(sub);
        console.log("Sensor monitoring started.");
      }

      // 5. Start Voice Recognition (Required for AI analysis)
      SpeechRecognitionModule.ExpoSpeechRecognitionModule.start({
        lang: settings?.voiceLanguage === "Hindi" ? "hi-IN" : "en-US",
        continuous: true,
      });

      // 6. Start Location Tracking (ONLY if enabled in settings)
      if (settings?.notifications?.location !== false) {
        await Location.startLocationUpdatesAsync(LOCATION_TRACKING_TASK, {
          accuracy: Location.Accuracy.High,
          timeInterval: 60000,
          distanceInterval: 15,
          foregroundService: {
            notificationTitle: "Raksha Active",
            notificationBody: "Your safety is being monitored.",
            notificationColor: "#00C4B4",
          },
        });
        console.log("Background location tracking started.");
      }
    } catch (err) {
      console.error("Failed to start monitoring:", err);
      Alert.alert("Error", "Could not start safety monitoring.");
    }
  };

  const stopMonitoring = async () => {
    try {
      await AsyncStorage.setItem("is_monitoring_active", "false");
      setIsMonitoring(false);
      setRiskScore(0);
      setRiskLevel("LOW");

      const isRegistered = await TaskManager.isTaskRegisteredAsync(
        LOCATION_TRACKING_TASK,
      );
      if (isRegistered)
        await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK);

      if (subscription) {
        subscription.remove();
        setSubscription(null);
      }

      if (sirenTimeoutRef.current) clearTimeout(sirenTimeoutRef.current);
      if (sirenPlayer.playing) sirenPlayer.pause();

      SpeechRecognitionModule.ExpoSpeechRecognitionModule.stop();
    } catch (error) {
      console.error(error);
    }
  };

  const triggerSOS = async () => {
    const settingsRaw = await AsyncStorage.getItem("app_settings");
    const settings = settingsRaw ? JSON.parse(settingsRaw) : null;

    if (settings?.notifications?.sound !== false && sirenPlayer) {
      sirenPlayer.play();
      if (sirenTimeoutRef.current) clearTimeout(sirenTimeoutRef.current);

      sirenTimeoutRef.current = setTimeout(() => {
        try {
          if (sirenPlayer && sirenPlayer.playing) {
            sirenPlayer.pause();
          }
        } catch (e) {
          console.log("Siren released");
        }
      }, 10000);
    }
	
    if (settings?.notifications.record) {
    // Start the 1-hour recording
    startEmergencyRecording();
	}

    if (settings?.notifications.location) {
      handleManualShare(true);
    }
  };

  const handleManualShare = async (isSOS: boolean) => {
    try {
      // 1. Get Current Location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // 2. Fetch Active Contacts
      const savedData = await AsyncStorage.getItem("emergency_contacts");
      if (!savedData) return;

      const activeContacts = JSON.parse(savedData).filter(
        (c: any) => c.isOn === true,
      );

      if (activeContacts.length === 0) return;

      // 3. SEND EMAILS ONE BY ONE
      for (const contact of activeContacts) {
        if (contact.email) {
          try {
            await fetch("http://localhost:5000/send-location-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                latitude,
                longitude,
                recipientEmail: contact.email,
                isSOS, // Added this so your backend knows if it's an alert or just a check-in
              }),
            });

            // Wait 500ms before sending the next one to keep server load low
            await new Promise((resolve) => setTimeout(resolve, 500));

            console.log(`Email sent to: ${contact.email}`);
          } catch (emailError) {
            console.error("Email failed for:", contact.email, emailError);
          }
        }
      }
    } catch (e) {
      console.error("SOS Sharing Error:", e);
    }
  };

  // --- Logic for Specific Social Sharing ---

  const handleSpecificShare = async (type: "EMAIL" | "WHATSAPP" | "SMS") => {
    try {
      setShareModalVisible(false); // Close modal
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const mapUrl = `http://googleusercontent.com/maps.google.com/?q=${latitude},${longitude}`;

      const savedData = await AsyncStorage.getItem("emergency_contacts");
      if (!savedData) return;
      const contacts = JSON.parse(savedData).filter(
        (c: any) => c.isOn === true,
      );
      if (contacts.length === 0) {
        Alert.alert(
          "No Contacts",
          "Please add active emergency contacts first.",
        );
        return;
      }

      const message = `📍 My Location: ${mapUrl}`;

      if (type === "EMAIL") {
        // Sequentially send via your Node.js backend
        for (const contact of contacts) {
          if (contact.email) {
            await fetch("http://localhost:5000/send-location-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                latitude,
                longitude,
                recipientEmail: contact.email,
              }),
            });
            await new Promise((r) => setTimeout(r, 500));
          }
        }
        Alert.alert("Success", "Emails sent to active contacts.");
      } else if (type === "WHATSAPP") {
        // WhatsApp usually allows sharing to one specific person via URL
        // or opens the app with a prefilled message for the user to pick contacts
        const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
        const canOpen = await Linking.canOpenURL(whatsappUrl);
        if (canOpen) {
          await Linking.openURL(whatsappUrl);
        } else {
          Alert.alert("Error", "WhatsApp is not installed.");
        }
      } else if (type === "SMS") {
        const phones = contacts.map((c: any) => c.number);
        const isAvailable = await SMS.isAvailableAsync();
        if (isAvailable) {
          await SMS.sendSMSAsync(phones, message);
        }
      }
    } catch (e) {
      console.error("Sharing Error", e);
    }
  };

  const triggerFakeCall = async () => {
    const contactsData = await AsyncStorage.getItem("emergency_contacts");
    if (!contactsData) return;
    const active = JSON.parse(contactsData).filter((c: any) => c.isOn);
    if (active.length === 0) return;

    const selectedTone =
      (await AsyncStorage.getItem("selected_ringtone")) || "Classic Ring";
    const ringtoneAsset = getAssetForTone(selectedTone);

    setSavedRingtone(ringtoneAsset);

    setSelectedCaller(active[0].name);
    setCountdown(5);
    const t = setInterval(() => {
      setCountdown((p) => {
        if (p && p <= 1) {
          clearInterval(t);
          setFakeCallVisible(true);
          return null;
        }
        return p ? p - 1 : null;
      });
    }, 1000);
  };

  const startEmergencyRecording = async () => {
  if (isRecording || !cameraRef.current) return;

  try {
    // 1. Keep Awake logic
    try {
      if (await KeepAwake.isAvailableAsync()) {
        await KeepAwake.activateKeepAwakeAsync();
      }
    } catch (e) { console.warn(e); }

    // 2. Permissions
    const cameraStatus = await requestCameraPermission();
    const micStatus = await requestMicPermission();
    if (!cameraStatus.granted || !micStatus.granted) return;

    setIsRecording(true);
    
    // 3. Warm-up delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. Start Recording
    const video = await cameraRef.current.recordAsync({
      maxDuration: 3600, 
    });

    if (video && video.uri) {
      const fileName = `SOS_REC_${Date.now()}.mp4`;
      
      // 1. Define the vault directory using SDK 54 Paths
      const vaultFolder = new Directory(Paths.document, "raksha_videos");

      // 2. Ensure directory exists
      if (!vaultFolder.exists) {
        await vaultFolder.create();
      }

      // 3. Create the destination File object
      const destinationFile = new File(vaultFolder, fileName);

      // 4. ✅ Use the legacy moveAsync here
      // This is the most reliable way to handle the actual file transfer
      await moveAsync({ 
        from: video.uri, 
        to: destinationFile.uri 
      });
      
      console.log("Video secured in private vault:", destinationFile.uri);
    }

    setIsRecording(false);
    try { await KeepAwake.deactivateKeepAwake(); } catch(e) {}
    
  } catch (error) {
    console.error("Recording Error:", error);
    setIsRecording(false);
    try { await KeepAwake.deactivateKeepAwake(); } catch(e) {}
  }
};

  const stopRecordingManually = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording(); // Triggers the end of recordAsync
      setIsRecording(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={[
            styles.monitoringCard,
            isMonitoring && { borderColor: "#00C4B4" },
          ]}
          onPress={() => (isMonitoring ? stopMonitoring() : startMonitoring())}
        >
          <View style={styles.monitoringLeft}>
            <View
              style={[
                styles.grayDot,
                isMonitoring && { backgroundColor: "#00C4B4" },
              ]}
            />
            <View>
              <Text style={styles.monitoringText}>
                {isMonitoring ? "Monitoring On" : "Monitoring Off"}
              </Text>
              <Text style={styles.monitoringSubText}>
                {isMonitoring ? "Guarding Active" : "Tap to start"}
              </Text>
            </View>
          </View>
          <Power size={24} color={isMonitoring ? "#00C4B4" : "#888"} />
        </TouchableOpacity>

        <View style={styles.voiceCard}>
          <View style={styles.voiceHeader}>
            <View style={styles.micCircle}>
              <Mic size={20} color="#00C4B4" />
            </View>
            <Text style={styles.voiceTitle}>AI Voice Command</Text>
          </View>
          <Text style={styles.voiceDescription}>
            Say "Help Me" (Bachao), "Danger" (Khatra), or "SOS" to trigger
            emergency actions.
          </Text>
          <View style={styles.tagContainer}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Hindi: "Bachao"</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>English: "Help"</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Region: "Khatra"</Text>
            </View>
          </View>
        </View>

        <View style={styles.riskCard}>
          <Text style={styles.riskTitle}>Sensor Dashboard</Text>
          {/* FIXED: Changed <div> to <View> */}
          <View
            style={{ height: 1, backgroundColor: "#1e2d3d", marginBottom: 15 }}
          />
          <View style={styles.riskRow}>
            <Text style={styles.riskLabel}>Danger Level:</Text>
            <Text
              style={[
                styles.riskValue,
                riskLevel === "HIGH"
                  ? { color: "#e63946" }
                  : { color: "#00C4B4" },
              ]}
            >
              {riskLevel}
            </Text>
          </View>
          <View style={styles.riskRow}>
            <Text style={styles.riskLabel}>Confidence:</Text>
            <Text style={styles.riskValue}>{riskScore}%</Text>
          </View>
        </View>

        <View style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}>
          <CameraView
            ref={cameraRef}
            mode="video"
            facing="back" // Record through the back camera
            mute={false} // We want to capture audio for evidence
			videoQuality="720p" 
            style={{ width: 1, height: 1, opacity: 0 }} // Silent recording
          />
        </View>

        <View style={styles.sosSection}>
          <View style={styles.sosOuterCircle}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.sosInnerCircle}
              onPress={triggerSOS}
            >
              <Shield size={60} color="#fff" fill="#fff" />
              <Text style={styles.sosLargeText}>SOS</Text>
              <Text style={styles.sosSmallText}>TAP FOR HELP</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.emergencyContacts}>
            Pressing SOS will share live location with your emergency contacts
          </Text>
        </View>

        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={triggerFakeCall}>
            <View style={styles.blueIconBg}>
              <Phone size={22} color="#556ee6" />
            </View>
            <Text style={styles.actionCardTitle}>Fake Call</Text>
            <Text style={styles.actionCardSub}>Get a fake call to escape</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setShareModalVisible(true)}
          >
            <View style={styles.greenIconBg}>
              <MapPin size={22} color="#00C4B4" />
            </View>
            <Text style={styles.actionCardTitle}>Share Location</Text>
            <Text style={styles.actionCardSub}>Send live location now</Text>
          </TouchableOpacity>
        </View>

        {isRecording && (
          <TouchableOpacity
            style={styles.stopRecordingBtn}
            onPress={stopRecordingManually}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>
              🛑 STOP EMERGENCY RECORDING
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.tipCard}>
          <AlertTriangle size={24} color="#f39c12" />
          <View style={styles.tipTextContent}>
            <Text style={styles.tipTitle}>Night Travel Tip</Text>
            <Text style={styles.tipDescription}>
              Keep app open and screen on. Voice commands work best in quiet
              environments.
            </Text>
          </View>
        </View>
      </ScrollView>
      {/* Share Selection Modal */}
      <Modal visible={shareModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.shareSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Share Location Via</Text>
              <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                <X color="#888" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.shareOptions}>
              <TouchableOpacity
                style={styles.shareItem}
                onPress={() => handleSpecificShare("EMAIL")}
              >
                <View
                  style={[styles.shareIconBg, { backgroundColor: "#1e2d3d" }]}
                >
                  <Mail color="#556ee6" size={24} />
                </View>
                <Text style={styles.shareText}>Email</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareItem}
                onPress={() => handleSpecificShare("WHATSAPP")}
              >
                <View
                  style={[styles.shareIconBg, { backgroundColor: "#0a2e2a" }]}
                >
                  <MessageCircle color="#25D366" size={24} />
                </View>
                <Text style={styles.shareText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareItem}
                onPress={() => handleSpecificShare("SMS")}
              >
                <View
                  style={[styles.shareIconBg, { backgroundColor: "#2a1a1a" }]}
                >
                  <MessageSquare color="#e63946" size={24} />
                </View>
                <Text style={styles.shareText}>SMS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <FakeCallOverlay
        visible={fakeCallVisible}
        callerName={selectedCaller}
        ringtoneUri={savedRingtone}
        onHangUp={() => setFakeCallVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020d1a" },
  scrollContent: { padding: 20, paddingBottom: 120 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  headerNamaste: { color: "#00C4B4", fontSize: 14, fontWeight: "600" },
  headerTitle: { color: "#fff", fontSize: 26, fontWeight: "bold" },
  themeToggle: { backgroundColor: "#1a2a3a", padding: 8, borderRadius: 20 },
  monitoringCard: {
    backgroundColor: "#0f1a2a",
    padding: 18,
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1e2d3d",
    marginBottom: 20,
    marginTop: -20,
  },
  monitoringLeft: { flexDirection: "row", alignItems: "center" },
  grayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#666",
    marginRight: 12,
  },
  monitoringText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  monitoringSubText: { color: "#888", fontSize: 12 },
  voiceCard: {
    backgroundColor: "#0f1a2a",
    padding: 20,
    borderRadius: 20,
    marginBottom: 30,
  },
  voiceHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  micCircle: {
    backgroundColor: "#0a2e2a",
    padding: 8,
    borderRadius: 10,
    marginRight: 10,
  },
  voiceTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  voiceDescription: {
    color: "#aaa",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 15,
  },
  tagContainer: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    backgroundColor: "#1e2d3d",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  tagText: { color: "#fff", fontSize: 11 },
  sosSection: { alignItems: "center", marginBottom: 30 },
  sosOuterCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(230, 57, 70, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  sosInnerCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#e63946",
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
  },
  sosLargeText: { color: "#fff", fontSize: 36, fontWeight: "900" },
  sosSmallText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  emergencyContacts: {
    color: "#88a",
    textAlign: "center",
    marginTop: 15,
    fontSize: 12,
  },
  actionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  actionCard: {
    backgroundColor: "#0f1a2a",
    width: "48%",
    padding: 15,
    borderRadius: 15,
  },
  blueIconBg: {
    backgroundColor: "#162345",
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  greenIconBg: {
    backgroundColor: "#0a2e2a",
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  actionCardTitle: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  actionCardSub: { color: "#666", fontSize: 11, marginTop: 2 },
  tipCard: {
    backgroundColor: "#1a120b",
    padding: 15,
    borderRadius: 15,
    flexDirection: "row",
    borderLeftWidth: 4,
    borderLeftColor: "#f39c12",
  },
  tipTextContent: { marginLeft: 12, flex: 1 },
  tipTitle: { color: "#f39c12", fontWeight: "bold", fontSize: 14 },
  tipDescription: { color: "#888", fontSize: 12, marginTop: 3 },
  riskCard: {
    backgroundColor: "#0f1a2a",
    padding: 18,
    borderRadius: 15,
    marginBottom: 25,
  },
  riskTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  riskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  riskLabel: { color: "#888" },
  riskValue: { color: "#fff", fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  shareSheet: {
    backgroundColor: "#0f1a2a",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    paddingBottom: 65,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  sheetTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  shareOptions: { flexDirection: "row", justifyContent: "space-around" },
  shareItem: { alignItems: "center" },
  shareIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  shareText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  stopRecordingBtn: {
    backgroundColor: "rgba(230, 57, 70, 0.9)", // Red alert color with transparency
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    position: "absolute",
    bottom: 80, // Positioned above the navbar
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8, // Shadow for Android
    shadowColor: "#000", // Shadow for iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1000, // Ensure it stays on top of everything
  },

  stopRecordingText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
    textTransform: "uppercase",
  },
});
