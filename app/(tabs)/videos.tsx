import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Paths, Directory, File } from 'expo-file-system'; // Use these new classes
import { useVideoPlayer, VideoView } from 'expo-video';
import { Play, Trash2, FileVideo, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VideoLibrary() {
  const [videos, setVideos] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const player = useVideoPlayer(selectedVideo || '', (player) => {
    player.loop = false;
    if (selectedVideo) player.play();
  });

  useEffect(() => {
    loadPrivateVideos();
  }, []);

  const loadPrivateVideos = async () => {
  try {
    // Use Paths.document to avoid "Authority Component" errors
    const vaultFolder = new Directory(Paths.document, "raksha_videos");
    
    // FIX: exists is a property, not a function. Remove the ()
    const doesExist = vaultFolder.exists; 
    
    if (!doesExist) {
      await vaultFolder.create();
      setVideos([]);
      return;
    }

    // list() is an async method that returns the folder contents
    const contents = await vaultFolder.list();
    
    const videoFiles = contents
      .filter((item): item is File => item instanceof File && item.name.endsWith('.mp4'))
      .map(file => file.uri);
        
    setVideos(videoFiles);
  } catch (err) {
    console.error("Vault Load Error:", err);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Private Vault</Text>
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
  header: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  subHeader: { color: '#00C4B4', fontSize: 13, marginTop: 4 },
  playerContainer: { width: '100%', height: 250, marginBottom: 20, backgroundColor: '#000', borderRadius: 20, overflow: 'hidden' },
  videoPlayer: { flex: 1 },
  closePlayerBtn: { flexDirection: 'row', backgroundColor: '#1e2d3d', padding: 12, alignItems: 'center', justifyContent: 'center', gap: 8 },
  closeText: { color: '#fff', fontWeight: 'bold' },
  videoCard: { flexDirection: 'row', backgroundColor: '#0f1a2a', padding: 15, borderRadius: 18, marginBottom: 12, alignItems: 'center', justifyContent: 'space-between' },
  videoInfo: { flexDirection: 'row', alignItems: 'center', flex: 0.85 },
  playIconBg: { backgroundColor: '#006d64', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  videoName: { color: '#fff', fontSize: 14 },
  emptyContainer: { marginTop: 100, alignItems: 'center' },
  emptyText: { color: '#555', fontSize: 16, marginTop: 10 }
});