import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '@/store/themeStore';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
  initialDate?: Date;
}

// Helper function to generate calendar days
const getCalendarDays = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // Get first day of the month
  const firstDay = new Date(year, month, 1);
  // Get last day of the month
  const lastDay = new Date(year, month + 1, 0);
  
  // Get the day of week for first day (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = firstDay.getDay();
  
  // Get the number of days in the month
  const daysInMonth = lastDay.getDate();
  
  // Get the current date
  const today = new Date();
  const isToday = (day: number) => {
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };
  
  const days = [];
  
  // Add days from previous month to fill the first week
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    days.push({
      date: prevMonthLastDay - i,
      isCurrentMonth: false,
      isSelected: false,
      isToday: false
    });
  }
  
  // Add days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push({
      date: day,
      isCurrentMonth: true,
      isSelected: day === date.getDate(),
      isToday: isToday(day)
    });
  }
  
  // Add days from next month to fill the last week (6 rows total)
  const remainingDays = 42 - days.length; // 6 rows × 7 days = 42
  for (let day = 1; day <= remainingDays; day++) {
    days.push({
      date: day,
      isCurrentMonth: false,
      isSelected: false,
      isToday: false
    });
  }
  
  return days;
};

export default function DatePickerModal({ 
  visible, 
  onClose, 
  onDateSelect, 
  initialDate = new Date() 
}: DatePickerModalProps) {
  const { theme } = useTheme();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  
  const handleDateSelect = (day: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(day);
    setSelectedDate(newDate);
    onDateSelect(newDate);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Select Date</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.calendarContainer}>
          {/* Month Navigation */}
          <View style={styles.monthNavigation}>
            <TouchableOpacity
              style={styles.monthNavButton}
              onPress={() => {
                const newDate = new Date(selectedDate);
                newDate.setMonth(newDate.getMonth() - 1);
                setSelectedDate(newDate);
              }}
            >
              <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
            </TouchableOpacity>
            
            <Text style={[styles.monthYearText, { color: theme.colors.text }]}>
              {selectedDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </Text>
            
            <TouchableOpacity
              style={styles.monthNavButton}
              onPress={() => {
                const newDate = new Date(selectedDate);
                newDate.setMonth(newDate.getMonth() + 1);
                setSelectedDate(newDate);
              }}
            >
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          {/* Weekday Headers */}
          <View style={styles.weekdayHeaders}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Text key={day} style={[styles.weekdayHeader, { color: theme.colors.textSecondary }]}>
                {day}
              </Text>
            ))}
          </View>
          
          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {getCalendarDays(selectedDate).map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDay,
                  day.isCurrentMonth && { backgroundColor: theme.colors.surface },
                  day.isSelected && { backgroundColor: theme.colors.primary },
                  day.isToday && { backgroundColor: theme.colors.primary + '40' }
                ]}
                onPress={() => {
                  if (day.isCurrentMonth) {
                    handleDateSelect(day.date);
                  }
                }}
                disabled={!day.isCurrentMonth}
              >
                <Text style={[
                  styles.calendarDayText,
                  { color: day.isCurrentMonth ? theme.colors.text : theme.colors.textSecondary },
                  day.isSelected && { color: 'white' },
                  day.isToday && !day.isSelected && { color: theme.colors.primary, fontWeight: 'bold' }
                ]}>
                  {day.date}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  calendarContainer: {
    flex: 1,
    padding: 20,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  monthNavButton: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  weekdayHeaders: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  weekdayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  calendarDay: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    margin: 1,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
