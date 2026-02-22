import { Audio } from "expo-av";
import {
  Grid,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Phone,
  PhoneOff,
  User,
  Volume2,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");
const SLIDE_WIDTH = width * 0.8;

interface FakeCallProps {
  visible: boolean;
  callerName: string;
  onHangUp: () => void;
  ringtoneUri?: any;
}

export default function FakeCallOverlay({
  visible,
  callerName,
  onHangUp,
  ringtoneUri,
}: FakeCallProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [callStatus, setCallStatus] = useState("Incoming Call...");
  const [timer, setTimer] = useState(0);
  const [isAccepted, setIsAccepted] = useState(false);

  const translateX = useRef(new Animated.Value(0)).current;

  // Handle Ringtone Lifecycle
  useEffect(() => {
    if (visible && !isAccepted) {
      playRingtone();
    } else {
      stopRingtone();
    }

    return () => {
      stopRingtone();
    };
  }, [visible, isAccepted]);

  const playRingtone = async () => {
    try {
      // Unload any existing sound first
      await stopRingtone();

      // Fallback to a default asset if no URI is provided
      const source = ringtoneUri
        ? typeof ringtoneUri === "string"
          ? { uri: ringtoneUri }
          : ringtoneUri
        : require("../assets/sounds/classic.mp3");

      const { sound: newSound } = await Audio.Sound.createAsync(source, {
        shouldPlay: true,
        isLooping: true,
        volume: 1.0,
      });
      setSound(newSound);
    } catch (error) {
      console.error("Error playing ringtone:", error);
    }
  };

  const stopRingtone = async () => {
    if (sound) {
      try {
        const status = await sound.getStatusAsync();

        // Only attempt to stop/unload if the sound is actually loaded
        if (status.isLoaded) {
          await sound.stopAsync();
          await sound.unloadAsync();
        }
      } catch (error) {
        // If it fails, it's likely already unloaded, so we just log it silently
        console.log("Sound already unloaded or missing.");
      } finally {
        setSound(null); // Always clear the state
      }
    }
  };

  const handleAccept = () => {
    stopRingtone(); // Stop ringing when user answers
    Vibration.cancel();
    setIsAccepted(true);
    setCallStatus("Connected");
  };

  const handleHangUp = () => {
    stopRingtone(); // Stop ringing on decline
    Vibration.cancel();
    onHangUp();
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isAccepted) {
      interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
      if (!visible) {
        setIsAccepted(false);
        setTimer(0);
        translateX.setValue(0);
      }
    };
  }, [isAccepted, visible]);

  useEffect(() => {
    if (visible && !isAccepted) {
      const interval = setInterval(() => Vibration.vibrate([500, 1000]), 1500);
      return () => {
        Vibration.cancel();
        clearInterval(interval);
      };
    }
  }, [visible, isAccepted]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 120) {
          handleAccept();
        } else if (gestureState.dx < -120) {
          onHangUp();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const sliderColor = translateX.interpolate({
    inputRange: [-120, 0, 120],
    outputRange: ["#ff3b30", "#fff", "#4cd964"],
    extrapolate: "clamp",
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
    >
      <View style={styles.callContainer}>
        <StatusBar
          hidden={true}
          translucent={true}
          backgroundColor="transparent"
        />

        <SafeAreaView style={styles.safeArea}>
          {/* Top Info Section */}
          <View
            style={[styles.topSection, isAccepted && styles.topSectionAccepted]}
          >
            <View
              style={[
                styles.avatarContainer,
                isAccepted && styles.avatarContainerAccepted,
              ]}
            >
              <User size={isAccepted ? 60 : 100} color="#fff" />
            </View>
            <Text
              style={[
                styles.callerName,
                isAccepted && styles.callerNameAccepted,
              ]}
            >
              {callerName}
            </Text>
            <Text style={styles.statusText}>
              {isAccepted ? formatTime(timer) : callStatus}
            </Text>
          </View>

          {!isAccepted ? (
            /* INCOMING CALL UI (SLIDER) */
            <View style={styles.bottomControls}>
              <TouchableOpacity style={styles.messageWrapper}>
                <MessageCircle size={28} color="#fff" />
                <Text style={styles.smallLabel}>Message</Text>
              </TouchableOpacity>

              <View style={styles.sliderTrack}>
                <View style={styles.sliderLabelRow}>
                  <Text style={styles.trackLabel}>Decline</Text>
                  <Text style={styles.trackLabel}>Answer</Text>
                </View>

                <Animated.View
                  style={[
                    styles.sliderButton,
                    {
                      transform: [{ translateX }],
                      backgroundColor: sliderColor,
                    },
                  ]}
                  {...panResponder.panHandlers}
                >
                  <Animated.View
                    style={{
                      transform: [
                        {
                          rotate: translateX.interpolate({
                            inputRange: [-120, 0, 10],
                            outputRange: ["135deg", "0deg", "0deg"],
                            extrapolate: "clamp",
                          }),
                        },
                      ],
                    }}
                  >
                    <Phone size={35} color="#1c1c1c" />
                  </Animated.View>
                </Animated.View>
              </View>
            </View>
          ) : (
            /* CONNECTED CALL UI (GRID) */
            <View style={styles.activeCallUI}>
              <View style={styles.gridContainer}>
                <CallOption
                  icon={<Grid color="#fff" size={28} />}
                  label="Keypad"
                />
                <CallOption
                  icon={<Mic color="#fff" size={28} />}
                  label="Mute"
                />
                <CallOption
                  icon={<Volume2 color="#fff" size={28} />}
                  label="Speaker"
                />
                <CallOption
                  icon={<MoreHorizontal color="#fff" size={28} />}
                  label="More"
                />
              </View>

              <View style={styles.hangupArea}>
                <TouchableOpacity
                  style={[styles.btnCircle, styles.declineBtn]}
                  onPress={onHangUp}
                  activeOpacity={0.7}
                >
                  <PhoneOff size={40} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const CallOption = ({ icon, label }: { icon: any; label: string }) => (
  <View style={styles.optionBox}>
    <View style={styles.optionCircle}>{icon}</View>
    <Text style={styles.optionText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  callContainer: {
    flex: 1,
    backgroundColor: "#1c1c1c",
    width: width,
    height: height,
  },
  safeArea: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 40,
  },
  topSection: {
    alignItems: "center",
    marginTop: 40,
    width: "100%",
  },
  topSectionAccepted: {
    marginTop: 20,
  },
  avatarContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  avatarContainerAccepted: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  callerName: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "300",
  },
  callerNameAccepted: {
    fontSize: 36,
  },
  statusText: {
    color: "#fff",
    fontSize: 18,
    marginTop: 10,
    opacity: 0.6,
  },
  bottomControls: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 40,
  },
  messageWrapper: {
    alignItems: "center",
    marginBottom: 50,
  },
  smallLabel: {
    color: "#fff",
    fontSize: 14,
    marginTop: 8,
    opacity: 0.8,
  },
  sliderTrack: {
    width: SLIDE_WIDTH,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  sliderLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 40,
    position: "absolute",
  },
  trackLabel: {
    color: "rgba(255,255,255,0.3)",
    fontWeight: "bold",
    fontSize: 14,
  },
  sliderButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  activeCallUI: {
    flex: 1,
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 40,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
    gap: 20,
    marginBottom: 40,
  },
  optionBox: {
    alignItems: "center",
    width: width * 0.25,
  },
  optionCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  optionText: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.9,
  },
  hangupArea: {
    width: "100%",
    alignItems: "center",
    marginTop: 40,
  },
  btnCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
  iconCenterer: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  declineBtn: {
    backgroundColor: "#ff3b30",
  },
});
