import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SortOption } from '../types';
import { Colors, Radii } from '../constants/theme';

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  selectedSort: SortOption;
  onSelect: (sort: SortOption) => void;
}

export const SortModal: React.FC<SortModalProps> = ({
  visible,
  onClose,
  selectedSort,
  onSelect,
}) => {
  const options: { id: SortOption; label: string; icon: any; description: string }[] = [
    {
      id: 'cheapest',
      label: 'Cheapest Price',
      icon: 'pricetag-outline',
      description: 'Lowest ticket price first',
    },
    {
      id: 'earliest',
      label: 'Earliest Departure',
      icon: 'time-outline',
      description: 'Buses leaving first today',
    },
    {
      id: 'shortest',
      label: 'Shortest Duration',
      icon: 'flash-outline',
      description: 'Fastest travel time to destination',
    },
    {
      id: 'highest_rated',
      label: 'Highest Rated',
      icon: 'star-outline',
      description: 'Top passenger ratings and reviews',
    },
  ];

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Sort Buses By</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={Colors.navy} />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsList}>
            {options.map((opt) => {
              const isSelected = selectedSort === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                  onPress={() => {
                    onSelect(opt.id);
                    onClose();
                  }}
                >
                  <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                    <Ionicons
                      name={opt.icon}
                      size={18}
                      color={isSelected ? Colors.white : Colors.navy}
                    />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={[styles.label, isSelected && styles.labelSelected]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.description}>{opt.description}</Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.orange} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 27, 53, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.navy,
  },
  optionsList: {
    marginTop: 10,
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radii.md,
    backgroundColor: Colors.background,
  },
  optionItemSelected: {
    backgroundColor: Colors.orangeLight,
    borderWidth: 1,
    borderColor: Colors.orange,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconBoxSelected: {
    backgroundColor: Colors.orange,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  labelSelected: {
    color: Colors.orangeHover,
  },
  description: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
