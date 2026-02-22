import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator // ADDED: Missing import
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Paths, Directory, File } from 'expo-file-system'; 
import { useVideoPlayer, VideoView } from 'expo-video';
import { Lock, Play, Trash2, FileVideo, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function VideoLibrary() {
  const [videos, setVideos] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [savedPin, setSavedPin] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const player = useVideoPlayer(selectedVideo || '', (player) => {
    player.loop = false;
    if (selectedVideo) player.play();
  });

  // Combine loads into one mount effect
  useEffect(() => {
    checkPinStatus();
    loadPrivateVideos();
  }, []);

  const loadPrivateVideos = async () => {
    try {
      const vaultFolder = new Directory(Paths.document, "raksha_videos");
      const doesExist = vaultFolder.exists; 
      
      if (!doesExist) {
        await vaultFolder.create();
        setVideos([]);
        return;
      }

      const contents = await vaultFolder.list();
      const videoFiles = contents
        .filter((item): item is File => item instanceof File && item.name.endsWith('.mp4'))
        .map(file => file.uri);
          
      setVideos(videoFiles);
    } catch (err) {
      console.error("Vault Load Error:", err);
    }
  };

  const checkPinStatus = async () => {
    try {
      const pin = await AsyncStorage.getItem("vault_pin");
      setSavedPin(pin);
      if (!pin) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error loading PIN:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPin = () => {
    if (pinInput === savedPin) {
      setIsAuthenticated(true);
    } else {
      Alert.alert("Access Denied", "The PIN you entered is incorrect.");
      setPinInput("");
    }
  };

  const deleteVideo = async (uri: string) => {
    Alert.alert("Delete Recording", "Permanently remove this from the vault?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          try {
            const fileToDelete = new File(uri);
            await fileToDelete.delete();
            if (selectedVideo === uri) setSelectedVideo(null);
            loadPrivateVideos();
          } catch (e) {
            console.error("Delete failed", e);
          }
        } 
      }
    ]);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00C4B4" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.lockContent}>
          <View style={styles.lockIconCircle}>
            <Lock size={40} color="#00C4B4" />
          </View>
          <Text style={styles.lockTitle}>Vault Protected</Text>
          <Text style={styles.lockSubtitle}>Enter your 4-digit security PIN</Text>
          
          <TextInput
            style={styles.pinInput}
            placeholder="0 0 0 0"
            placeholderTextColor="#444"
            keyboardType="numeric"
            secureTextEntry
            maxLength={4}
            value={pinInput}
            onChangeText={setPinInput}
            autoFocus
          />

          <TouchableOpacity style={styles.unlockBtn} onPress={verifyPin}>
            <Text style={styles.unlockBtnText}>Unlock Videos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitleText}>Private Vault</Text>
        <Text style={styles.subHeader}>Secured Internal Storage</Text>
      </View>

      {selectedVideo && (
        <View style={styles.playerContainer}>
          <VideoView player={player} style={styles.videoPlayer} allowsFullscreen />
          <TouchableOpacity style={styles.closePlayerBtn} onPress={() => setSelectedVideo(null)}>
            <X size={18} color="#fff" />
            <Text style={styles.closeText}>Close Player</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={videos}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View style={styles.videoCard}>
            <TouchableOpacity style={styles.videoInfo} onPress={() => setSelectedVideo(item)}>
              <View style={styles.playIconBg}><Play size={18} color="#fff" fill="#fff" /></View>
              <Text style={styles.videoName} numberOfLines={1}>{item.split('/').pop()}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteVideo(item)}>
              <Trash2 size={20} color="#e63946" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FileVideo size={64} color="#1e2d3d" />
            <Text style={styles.emptyText}>Vault is Empty</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020d1a', paddingHorizontal: 20 },
  headerContainer: { marginTop: 10, marginBottom: 25 },
  headerTitleText: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  subHeader: { color: '#00C4B4', fontSize: 13, marginTop: 4 },
  playerContainer: { width: '100%', height: 250, marginBottom: 20, backgroundColor: '#000', borderRadius: 20, overflow: 'hidden' },
  videoPlayer: { flex: 1 },
  closePlayerBtn: { flexDirection: 'row', backgroundColor: '#1e2d3d', padding: 12, alignItems: 'center', justifyContent: 'center', gap: 8 },
  closeText: { color: '#fff', fontWeight: 'bold' },
  videoCard: { flexDirection: 'row', backgroundColor: '#0f1a2a', padding: 15, borderRadius: 18, marginBottom: 12, alignItems: 'center', justifyContent: 'space-between' },
  videoInfo: { flexDirection: 'row', alignItems: 'center', flex: 0.85 },
  playIconBg: { backgroundColor: '#006d64', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  videoName: { color: '#fff', fontSize: 14 },
  emptyContainer: { flex: 1, marginTop: 100, alignItems: 'center', justifyContent: 'center', opacity: 0.5 },
  emptyText: { color: '#888', fontSize: 16, marginTop: 10 },
  lockContent: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30 },
  lockIconCircle: { backgroundColor: "#0a2e2a", padding: 20, borderRadius: 50, marginBottom: 20 },
  lockTitle: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  lockSubtitle: { color: "#888", fontSize: 14, marginTop: 5, marginBottom: 30 },
  pinInput: {
    backgroundColor: "#0f1a2a",
    color: "#fff",
    width: "60%",
    height: 60,
    borderRadius: 15,
    fontSize: 28,
    textAlign: "center",
    letterSpacing: 10,
    borderWidth: 1,
    borderColor: "#1e2d3d",
    marginBottom: 25,
  },
  unlockBtn: {
    backgroundColor: "#00C4B4",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 5,
  },
  unlockBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 }
});