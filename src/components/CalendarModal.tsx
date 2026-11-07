import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Shadows } from '../constants/theme';

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  minDate?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const CalendarModal: React.FC<CalendarModalProps> = ({
  visible,
  onClose,
  selectedDate,
  onSelectDate,
  minDate,
}) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const effectiveMinDate = minDate || todayStr;

  // Initialize viewing month & year from selectedDate or today
  const initDate = selectedDate ? new Date(selectedDate) : today;
  const [viewYear, setViewYear] = useState<number>(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initDate.getMonth()); // 0-indexed
  const [tempDate, setTempDate] = useState<string>(selectedDate || todayStr);

  // Quick helper dates
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Next Saturday
  const saturday = new Date();
  const dayOfWeek = saturday.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  saturday.setDate(saturday.getDate() + daysUntilSaturday);
  const saturdayStr = saturday.toISOString().split('T')[0];

  const handlePrevMonth = () => {
    const isCurrentMonth =
      viewYear === today.getFullYear() && viewMonth === today.getMonth();
    if (isCurrentMonth) return;

    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    // allow booking up to 6 months in advance
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Get days in current viewing month
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday

  // Generate calendar grid cells
  const calendarDays: Array<{ day: number | null; dateStr: string; isPast: boolean; isToday: boolean; isSelected: boolean }> = [];

  // Empty leading slots
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push({ day: null, dateStr: '', isPast: true, isToday: false, isSelected: false });
  }

  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    const monthFormatted = String(viewMonth + 1).padStart(2, '0');
    const dayFormatted = String(d).padStart(2, '0');
    const dateStr = `${viewYear}-${monthFormatted}-${dayFormatted}`;
    const isPast = dateStr < effectiveMinDate;
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === tempDate;

    calendarDays.push({
      day: d,
      dateStr,
      isPast,
      isToday,
      isSelected,
    });
  }

  const handleDateClick = (dateStr: string, isPast: boolean) => {
    if (isPast) return;
    setTempDate(dateStr);
  };

  const handleConfirm = () => {
    onSelectDate(tempDate);
    onClose();
  };

  const formatDisplayDate = (str: string) => {
    if (!str) return '';
    const d = new Date(str + 'T00:00:00');
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const isPrevDisabled =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Select Journey Date</Text>
              <Text style={styles.headerSubtitle}>
                {formatDisplayDate(tempDate)}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Quick Date Chips */}
          <View style={styles.quickChipsRow}>
            <TouchableOpacity
              style={[
                styles.quickChip,
                tempDate === todayStr && styles.quickChipActive,
              ]}
              onPress={() => {
                setTempDate(todayStr);
                setViewYear(today.getFullYear());
                setViewMonth(today.getMonth());
              }}
            >
              <Text
                style={[
                  styles.quickChipText,
                  tempDate === todayStr && styles.quickChipTextActive,
                ]}
              >
                Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickChip,
                tempDate === tomorrowStr && styles.quickChipActive,
              ]}
              onPress={() => {
                setTempDate(tomorrowStr);
                setViewYear(tomorrow.getFullYear());
                setViewMonth(tomorrow.getMonth());
              }}
            >
              <Text
                style={[
                  styles.quickChipText,
                  tempDate === tomorrowStr && styles.quickChipTextActive,
                ]}
              >
                Tomorrow
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickChip,
                tempDate === saturdayStr && styles.quickChipActive,
              ]}
              onPress={() => {
                setTempDate(saturdayStr);
                setViewYear(saturday.getFullYear());
                setViewMonth(saturday.getMonth());
              }}
            >
              <Text
                style={[
                  styles.quickChipText,
                  tempDate === saturdayStr && styles.quickChipTextActive,
                ]}
              >
                This Weekend
              </Text>
            </TouchableOpacity>
          </View>

          {/* Month & Year Navigation */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity
              style={[styles.navBtn, isPrevDisabled && styles.navBtnDisabled]}
              onPress={handlePrevMonth}
              disabled={isPrevDisabled}
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={isPrevDisabled ? '#CBD5E1' : Colors.navy}
              />
            </TouchableOpacity>

            <Text style={styles.monthYearTitle}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>

            <TouchableOpacity style={styles.navBtn} onPress={handleNextMonth}>
              <Ionicons name="chevron-forward" size={18} color={Colors.navy} />
            </TouchableOpacity>
          </View>

          {/* Weekday Header */}
          <View style={styles.weekDaysRow}>
            {WEEK_DAYS.map((wd, i) => (
              <Text
                key={i}
                style={[
                  styles.weekDayText,
                  (i === 0 || i === 6) && styles.weekendText,
                ]}
              >
                {wd}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.daysGrid}>
            {calendarDays.map((item, idx) => {
              if (item.day === null) {
                return <View key={idx} style={styles.emptyDayCell} />;
              }

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dayCell,
                    item.isSelected && styles.dayCellSelected,
                    item.isToday && !item.isSelected && styles.dayCellToday,
                  ]}
                  onPress={() => handleDateClick(item.dateStr, item.isPast)}
                  disabled={item.isPast}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      item.isPast && styles.dayTextPast,
                      item.isSelected && styles.dayTextSelected,
                      item.isToday && !item.isSelected && styles.dayTextToday,
                    ]}
                  >
                    {item.day}
                  </Text>
                  {item.isToday && !item.isSelected && (
                    <View style={styles.todayDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Action Buttons */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmBtnText}>Confirm Date</Text>
              <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(16, 27, 53, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    padding: 22,
    ...Shadows.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.navy,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.orange,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  quickChip: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipActive: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  quickChipTextActive: {
    color: '#FFFFFF',
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 6,
  },
  monthYearTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.navy,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    backgroundColor: '#F8FAFC',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  weekendText: {
    color: Colors.orange,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  emptyDayCell: {
    width: '14.28%',
    height: 40,
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  dayCellSelected: {
    backgroundColor: Colors.navy,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: Colors.orange,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  dayTextPast: {
    color: '#CBD5E1',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayTextToday: {
    color: Colors.orange,
    fontWeight: '800',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.orange,
    position: 'absolute',
    bottom: 4,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
