import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TripzoHeader } from '../../components/TripzoHeader';
import { authService } from '../../services/authService';
import { profileService } from '../../services/profileService';
import { UserProfile, Passenger } from '../../types';
import { Colors, Shadows, Radii } from '../../constants/theme';
import { useToast } from '../../components/Toast';

export default function ProfileScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [savedPassengers, setSavedPassengers] = useState<Passenger[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passModalVisible, setPassModalVisible] = useState(false);

  // Edit fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Add passenger fields
  const [newPassName, setNewPassName] = useState('');
  const [newPassAge, setNewPassAge] = useState('');
  const [newPassGender, setNewPassGender] = useState<'male' | 'female'>('male');

  const loadProfile = async () => {
    const u = await authService.getProfile();
    setUser(u);
    if (u) {
      setName(u.name);
      setEmail(u.email);
    }
    const passengers = await profileService.getSavedPassengers();
    setSavedPassengers(passengers);
  };

  useEffect(() => {
    // Fetch-on-mount: setState happens after async server load.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showToast('Name cannot be empty', { type: 'error' });
      return;
    }
    await authService.updateProfile({ name: name.trim(), email: email.trim() });
    setEditModalVisible(false);
    showToast('Profile updated!', { type: 'success' });
    // Fetch-on-mount: setState happens after async server load.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile();
  };

  const handleAddPassenger = async () => {
    if (!newPassName.trim() || !newPassAge.trim()) {
      showToast('Please enter passenger name and age', { type: 'warning' });
      return;
    }
    await profileService.addSavedPassenger({
      name: newPassName.trim(),
      age: parseInt(newPassAge, 10) || 25,
      gender: newPassGender,
    });
    setPassModalVisible(false);
    setNewPassName('');
    setNewPassAge('');
    showToast('Passenger saved!', { type: 'success' });
    // Fetch-on-mount: setState happens after async server load.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile();
  };

  const handleDeletePassenger = async (id: string) => {
    await profileService.deleteSavedPassenger(id);
    showToast('Saved passenger removed', { type: 'info' });
    // Fetch-on-mount: setState happens after async server load.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile();
  };

  const handleLogout = async () => {
    await authService.logout();
    showToast('Logged out successfully', { type: 'info' });
    router.replace('/auth/login');
  };

  return (
    <View style={styles.container}>
      <TripzoHeader title="My Profile" showBack={false} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Info Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'Guest Traveler'}</Text>
            <Text style={styles.profilePhone}>{user?.phone || '+91 9876543210'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'traveler@tripzo.app'}</Text>
          </View>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setEditModalVisible(true)}
          >
            <Ionicons name="pencil" size={16} color={Colors.navy} />
          </TouchableOpacity>
        </View>

        {/* Demo Account Indicator */}
        <View style={styles.demoBanner}>
          <Ionicons name="shield-checkmark" size={16} color={Colors.orange} />
          <Text style={styles.demoBannerText}>
            Tripzo Demo Account • Local Storage Persistence Active
          </Text>
        </View>

        {/* Saved Passengers Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Saved Travelers ({savedPassengers.length})</Text>
            <TouchableOpacity onPress={() => setPassModalVisible(true)}>
              <Text style={styles.addPassengerText}>+ Add New</Text>
            </TouchableOpacity>
          </View>

          {savedPassengers.map((p) => (
            <View key={p.id} style={styles.passengerItem}>
              <View style={styles.passLeft}>
                <Ionicons
                  name={p.gender === 'female' ? 'woman' : 'person'}
                  size={16}
                  color={p.gender === 'female' ? '#EC4899' : Colors.navy}
                />
                <Text style={styles.passName}>{p.name}</Text>
                <Text style={styles.passMeta}>({p.age} yrs, {p.gender})</Text>
              </View>

              <TouchableOpacity
                onPress={() => handleDeletePassenger(p.id)}
                style={styles.deletePassBtn}
              >
                <Ionicons name="trash-outline" size={14} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Quick Menu Options */}
        <View style={styles.menuCard}>
          {[
            {
              title: 'My Bookings & Passes',
              icon: 'ticket-outline',
              route: '/(tabs)/bookings',
            },
            {
              title: 'Notifications & Alerts',
              icon: 'notifications-outline',
              route: '/notifications',
            },
            {
              title: 'Help & Customer Support',
              icon: 'help-circle-outline',
              route: '/support',
            },
            {
              title: 'Offers & Promo Codes',
              icon: 'pricetag-outline',
              route: '/(tabs)/offers',
            },
          ].map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon as any} size={20} color={Colors.navy} />
                <Text style={styles.menuTitle}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Log Out from Tripzo</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Tripzo v1.0.0 (Build 2026) • Android Preview</Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <View style={styles.modalInputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.modalInput}
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.modalInput}
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Passenger Modal */}
      <Modal visible={passModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Saved Passenger</Text>

            <View style={styles.modalInputGroup}>
              <Text style={styles.inputLabel}>Passenger Name</Text>
              <TextInput
                style={styles.modalInput}
                value={newPassName}
                onChangeText={setNewPassName}
                placeholder="Full name as on government ID"
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.modalInput}
                value={newPassAge}
                onChangeText={setNewPassAge}
                placeholder="e.g. 28"
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.genderRow}>
                {(['male', 'female'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderPill,
                      newPassGender === g && styles.genderPillActive,
                    ]}
                    onPress={() => setNewPassGender(g)}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        newPassGender === g && styles.genderTextActive,
                      ]}
                    >
                      {g.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setPassModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleAddPassenger}>
                <Text style={styles.saveBtnText}>Add Traveler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.sm,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.navy,
  },
  profilePhone: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  profileEmail: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.orangeLight,
    padding: 12,
    borderRadius: Radii.lg,
    gap: 8,
  },
  demoBannerText: {
    fontSize: 11,
    color: Colors.orangeHover,
    fontWeight: '700',
    flex: 1,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: 16,
    ...Shadows.sm,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.navy,
  },
  addPassengerText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.orange,
  },
  passengerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  passLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  passMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  deletePassBtn: {
    padding: 4,
  },
  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.navy,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: Radii.lg,
    marginTop: 8,
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 27, 53, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: 20,
    width: '100%',
    ...Shadows.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.navy,
    marginBottom: 16,
  },
  modalInputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    height: 46,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.text,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  genderPillActive: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  genderText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.navy,
  },
  genderTextActive: {
    color: Colors.white,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: Colors.orange,
    paddingVertical: 12,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
});
