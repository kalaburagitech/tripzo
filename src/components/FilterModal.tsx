import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BusFilters } from '../types';
import { Colors, Radii } from '../constants/theme';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: BusFilters;
  onApply: (filters: BusFilters) => void;
  onReset: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApply,
  onReset,
}) => {
  const [localFilters, setLocalFilters] = useState<BusFilters>(filters);

  const toggleBusType = (type: string) => {
    const types = [...localFilters.busTypes];
    const index = types.indexOf(type);
    if (index > -1) {
      types.splice(index, 1);
    } else {
      types.push(type);
    }
    setLocalFilters({ ...localFilters, busTypes: types });
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: BusFilters = {
      busTypes: [],
      acType: 'all',
      priceRange: [400, 2000],
      departureSlot: 'all',
      minRating: 0,
      operators: [],
    };
    setLocalFilters(resetFilters);
    onReset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filter Buses</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.navy} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Bus Format */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bus Type</Text>
              <View style={styles.optionsRow}>
                {[
                  { id: 'sleeper', label: 'Sleeper' },
                  { id: 'seater', label: 'Seater' },
                  { id: 'semi-sleeper', label: 'Semi-Sleeper' },
                ].map((item) => {
                  const selected = localFilters.busTypes.includes(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.pill, selected && styles.pillActive]}
                      onPress={() => toggleBusType(item.id)}
                    >
                      <Text style={[styles.pillText, selected && styles.pillTextActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* AC / Non-AC */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Air Conditioning</Text>
              <View style={styles.optionsRow}>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'ac', label: 'AC Buses' },
                  { id: 'non-ac', label: 'Non-AC' },
                ].map((item) => {
                  const selected = localFilters.acType === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.pill, selected && styles.pillActive]}
                      onPress={() => setLocalFilters({ ...localFilters, acType: item.id as any })}
                    >
                      <Text style={[styles.pillText, selected && styles.pillTextActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Departure Slots */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Departure Time</Text>
              <View style={styles.optionsGrid}>
                {[
                  { id: 'all', label: 'Anytime', time: '24 Hours' },
                  { id: 'morning', label: 'Morning', time: '6 AM - 12 PM' },
                  { id: 'afternoon', label: 'Afternoon', time: '12 PM - 5 PM' },
                  { id: 'evening', label: 'Evening', time: '5 PM - 9 PM' },
                  { id: 'night', label: 'Night', time: 'After 9 PM' },
                ].map((slot) => {
                  const selected = localFilters.departureSlot === slot.id;
                  return (
                    <TouchableOpacity
                      key={slot.id}
                      style={[styles.slotCard, selected && styles.slotCardActive]}
                      onPress={() =>
                        setLocalFilters({ ...localFilters, departureSlot: slot.id as any })
                      }
                    >
                      <Text style={[styles.slotLabel, selected && styles.slotLabelActive]}>
                        {slot.label}
                      </Text>
                      <Text style={[styles.slotTime, selected && styles.slotTimeActive]}>
                        {slot.time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Minimum Rating */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bus Rating</Text>
              <View style={styles.optionsRow}>
                {[0, 4.0, 4.5, 4.8].map((rating) => {
                  const selected = localFilters.minRating === rating;
                  return (
                    <TouchableOpacity
                      key={rating}
                      style={[styles.pill, selected && styles.pillActive]}
                      onPress={() => setLocalFilters({ ...localFilters, minRating: rating })}
                    >
                      <Ionicons
                        name="star"
                        size={14}
                        color={selected ? Colors.white : Colors.gold}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.pillText, selected && styles.pillTextActive]}>
                        {rating === 0 ? 'All' : `${rating}+`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetText}>Reset All</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 27, 53, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.navy,
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    paddingHorizontal: 20,
  },
  section: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  pillTextActive: {
    color: Colors.white,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotCard: {
    width: '48%',
    padding: 10,
    borderRadius: Radii.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  slotCardActive: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  slotLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  slotLabelActive: {
    color: Colors.white,
  },
  slotTime: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  slotTimeActive: {
    color: '#CBD5E1',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: Radii.md,
    backgroundColor: Colors.orange,
    alignItems: 'center',
  },
  applyText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
});
