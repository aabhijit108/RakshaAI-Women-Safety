import { usePathname, useRouter } from "expo-router";
import { Phone, Settings, Shield, Users, Video } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CustomNavbar() {
  const router = useRouter();
  const pathname = usePathname();

  // Helper function to check if a tab is active
  const isActive = (path: string) => pathname === path;

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity style={styles.navItem} onPress={() => router.push("/")}>
        <Shield size={24} color={isActive("/") ? "#fff" : "#a0ced9"} />
        <Text style={[styles.navText, isActive("/") && styles.navTextActive]}>
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push("/contacts")}
      >
        <Users size={24} color={isActive("/contacts") ? "#fff" : "#a0ced9"} />
        <Text
          style={[
            styles.navText,
            isActive("/contacts") && styles.navTextActive,
          ]}
        >
          Contacts
        </Text>
      </TouchableOpacity>
	  
      <TouchableOpacity style={styles.navItem} onPress={() => router.push("/videos")}>
        <Video size={24} color={isActive("/videos") ? "#fff" : "#a0ced9"} />
        <Text style={[styles.navText, isActive("/videos") && styles.navTextActive]}>Videos</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push("/fake-call")}
      >
        <Phone size={24} color={isActive("/fake-call") ? "#fff" : "#a0ced9"} />
        <Text
          style={[
            styles.navText,
            isActive("/fake-call") && styles.navTextActive,
          ]}
        >
          Fake Call
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push("/settings")}
      >
        <Settings
          size={24}
          color={isActive("/settings") ? "#fff" : "#a0ced9"}
        />
        <Text
          style={[
            styles.navText,
            isActive("/settings") && styles.navTextActive,
          ]}
        >
          Settings
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "#006d64",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 10,
    elevation: 10,
  },
  navItem: { alignItems: "center" },
  navText: { color: "#a0ced9", fontSize: 10, marginTop: 4 },
  navTextActive: { color: "#fff", fontWeight: "bold" },
});
