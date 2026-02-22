import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Mail,
  Pencil,
  Phone,
  Plus,
  Power,
  Trash2,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Types for individual contacts
interface Contact {
  id: string;
  initials: string;
  name: string;
  email: string;
  relation: string;
  number: string;
  isOn: boolean;
}

// Props for the UI Card
interface ContactCardProps extends Contact {
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

const ContactCard = ({
  initials,
  name,
  relation,
  number,
  email,
  isOn,
  onToggle,
  onDelete,
  onEdit,
}: ContactCardProps) => (
  <View style={styles.contactCard}>
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>

    <View style={styles.contactInfo}>
      <Text style={styles.nameText}>{name}</Text>
      <Text style={styles.relationText}>{relation}</Text>
      <View style={styles.phoneRow}>
        <Phone size={14} color="#888" />
        <Text style={styles.numberText}>{number}</Text>
      </View>
      {email ? (
        <View style={[styles.phoneRow, { marginTop: 2 }]}>
          <Mail size={12} color="#888" />
          <Text style={styles.numberText}>{email}</Text>
        </View>
      ) : null}
    </View>

    <View style={styles.actionColumn}>
      <TouchableOpacity
        style={[styles.toggleBtn, !isOn && styles.toggleBtnOff]}
        onPress={onToggle}
      >
        <Power size={14} color={isOn ? "#00FFAB" : "#888"} />
        <Text style={[styles.toggleText, !isOn && styles.toggleTextOff]}>
          {isOn ? "ON" : "OFF"}
        </Text>
      </TouchableOpacity>

      <View style={styles.iconRow}>
        <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
          <Pencil size={18} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
          <Trash2 size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Load contacts from storage on mount
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const saved = await AsyncStorage.getItem("emergency_contacts");
        if (saved) {
          setContacts(JSON.parse(saved));
        } else {
          const initialData = [
            {
              id: "1",
              initials: "PA",
              name: "Papa",
              relation: "Dad",
              number: "No Number",
              email: "",
              isOn: true,
            },
            {
              id: "2",
              initials: "MU",
              name: "Mummy",
              relation: "Mom",
              number: "No Number",
              email: "",
              isOn: true,
            },
          ];
          setContacts(initialData);
          await AsyncStorage.setItem(
            "emergency_contacts",
            JSON.stringify(initialData),
          );
        }
      } catch (e) {
        console.error("Failed to load contacts", e);
      }
    };
    loadContacts();
  }, []);

  const saveToStorage = async (updated: Contact[]) => {
    try {
      await AsyncStorage.setItem("emergency_contacts", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save", e);
    }
  };

  const handleToggle = (id: string) => {
    const updated = contacts.map((c) =>
      c.id === id ? { ...c, isOn: !c.isOn } : c,
    );
    setContacts(updated);
    saveToStorage(updated);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Contact", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Delete",
        onPress: () => {
          const updated = contacts.filter((c) => c.id !== id);
          setContacts(updated);
          saveToStorage(updated);
        },
      },
    ]);
  };

  const openEdit = (contact: Contact) => {
    setEditingId(contact.id);
    setName(contact.name);
    setRelation(contact.relation);
    setPhone(contact.number);
    setEmail(contact.email || "");
    setModalVisible(true);
  };

  const handleSave = () => {
    // Validation: Email, Name and Phone are required
    if (!name || !phone || !email) {
      Alert.alert("Error", "Please fill Name, Phone and Email");
      return;
    }

    let updated;
    if (editingId) {
      updated = contacts.map((c) =>
        c.id === editingId
          ? {
              ...c,
              name,
              relation,
              number: phone,
              email: email.toLowerCase().trim(),
              initials: name.substring(0, 2).toUpperCase(),
            }
          : c,
      );
    } else {
      const newEntry = {
        id: Date.now().toString(),
        initials: name.substring(0, 2).toUpperCase(),
        name,
        relation,
        number: phone,
        email: email.toLowerCase().trim(),
        isOn: true,
      };
      updated = [...contacts, newEntry];
    }

    setContacts(updated);
    saveToStorage(updated);
    closeModal();
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingId(null);
    setName("");
    setRelation("");
    setPhone("");
    setEmail("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            These contacts will receive your live location via WhatsApp when SOS
            is triggered.
          </Text>
        </View>

        {contacts.map((item) => (
          <ContactCard
            key={item.id}
            {...item}
            onToggle={() => handleToggle(item.id)}
            onDelete={() => handleDelete(item.id)}
            onEdit={() => openEdit(item)}
          />
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
      >
        <Plus size={32} color="#000" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? "Edit Contact" : "Add Contact"}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <X color="#888" />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Full Name"
              placeholderTextColor="#666"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              placeholder="Relation (e.g. Dad)"
              placeholderTextColor="#666"
              style={styles.input}
              value={relation}
              onChangeText={setRelation}
            />
            <TextInput
              placeholder="Phone Number (with +91)"
              placeholderTextColor="#666"
              style={styles.input}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <TextInput
              placeholder="Email Address"
              placeholderTextColor="#666"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020d1a" },
  scrollBody: { padding: 20, paddingBottom: 150 },
  infoBox: {
    borderWidth: 1,
    borderColor: "#00C4B4",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    backgroundColor: "rgba(0, 196, 180, 0.05)",
  },
  infoText: {
    color: "#00C4B4",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  contactCard: {
    backgroundColor: "#0f1a2a",
    borderRadius: 20,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: "#1e2d3d",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3a4a5a",
  },
  avatarText: { color: "#556ee6", fontSize: 18, fontWeight: "bold" },
  contactInfo: { flex: 1, marginLeft: 15 },
  nameText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  relationText: { color: "#888", fontSize: 13, marginVertical: 2 },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  numberText: { color: "#888", fontSize: 12 },
  actionColumn: { alignItems: "flex-end", gap: 10 },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 255, 171, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#00FFAB",
  },
  toggleBtnOff: {
    backgroundColor: "rgba(136,136,136,0.1)",
    borderColor: "#444",
  },
  toggleText: {
    color: "#00FFAB",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 5,
  },
  toggleTextOff: { color: "#888" },
  iconRow: { flexDirection: "row", gap: 10 },
  editBtn: { backgroundColor: "#1e2d3d", padding: 8, borderRadius: 20 },
  deleteBtn: { backgroundColor: "#1e2d3d", padding: 8, borderRadius: 20 },
  fab: {
    position: "absolute",
    right: 25,
    bottom: 150,
    width: 65,
    height: 65,
    borderRadius: 35,
    backgroundColor: "#00C4B4",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#00C4B4",
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#0f1a2a",
    borderRadius: 25,
    padding: 25,
    borderWidth: 1,
    borderColor: "#1e2d3d",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  input: {
    backgroundColor: "#1e2d3d",
    color: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: "#00C4B4",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 10,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
