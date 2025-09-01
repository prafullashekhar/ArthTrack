import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, ThemeMode } from '@/store/themeStore';
import { databaseService } from '@/services/databaseService';

export default function SettingsScreen() {
  const { theme, themeMode, setThemeMode } = useTheme();
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFilter, setExportFilter] = useState<'all' | 'current-month' | 'custom-month'>('all');
  const [selectedMonth, setSelectedMonth] = useState('');
  
  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    setShowThemeModal(false);
  };

  const handleExport = async () => {
    try {
      let expenses: any[] = [];
      
      if (exportFilter === 'all') {
        expenses = await databaseService.getAllExpenses();
      } else if (exportFilter === 'current-month') {
        const currentMonthId = databaseService.getCurrentMonthId();
        expenses = await databaseService.getExpensesByMonth(currentMonthId);
      } else if (exportFilter === 'custom-month' && selectedMonth) {
        expenses = await databaseService.getExpensesByMonth(selectedMonth);
      }

      if (expenses.length === 0) {
        Alert.alert('No Data', 'No expenses found for the selected filter.');
        return;
      }

      // Format expenses for export
      const exportData = expenses.map(expense => ({
        date: databaseService.parseIdToDate(expense.date).toLocaleDateString('en-IN'),
        expenseType: expense.expense_type,
        amount: expense.amount,
        categoryName: expense.category_name || 'Unknown',
        paymentType: expense.payment_type_name || 'Unknown',
        note: expense.note || ''
      }));

      // Create CSV content
      const csvHeaders = 'Date,Expense Type,Amount,Category Name,Payment Type,Note\n';
      const csvRows = exportData.map(row => 
        `"${row.date}","${row.expenseType}","${row.amount}","${row.categoryName}","${row.paymentType}","${row.note}"`
      ).join('\n');
      const csvContent = csvHeaders + csvRows;

      // For now, we'll show the data in an alert (in a real app, you'd use a file sharing library)
      Alert.alert(
        'Export Ready',
        `Found ${expenses.length} expenses.\n\nCSV data:\n${csvContent.substring(0, 500)}${csvContent.length > 500 ? '...' : ''}`,
        [
          { text: 'Copy to Clipboard', onPress: () => {
            // In a real app, you'd copy to clipboard or share the file
            Alert.alert('Success', 'Data copied to clipboard (placeholder)');
          }},
          { text: 'Cancel', style: 'cancel' }
        ]
      );

      setShowExportModal(false);
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Error', 'Failed to export expenses. Please try again.');
    }
  };
  
  const getThemeModeLabel = (mode: ThemeMode) => {
    switch (mode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
    }
  };
  
  const settingsOptions = [
    {
      id: 'allocation',
      title: 'Add Allocated Expense',
      subtitle: 'Set monthly budget for each expense type',
      icon: 'dollar-sign',
      onPress: () => router.push('/allocation'),
    },
    {
      id: 'categories',
      title: 'Update Categories',
      subtitle: 'Manage expense categories',
      icon: 'pencil',
      onPress: () => router.push('/categories'),
    },
    {
      id: 'payment-types',
      title: 'Manage Payment Types',
      subtitle: 'Add, edit, or remove payment methods',
      icon: 'credit-card',
      onPress: () => router.push('/payment-types'),
    },
    {
      id: 'theme',
      title: 'Theme',
      subtitle: `Current: ${getThemeModeLabel(themeMode)}`,
      icon: 'palette',
      onPress: () => setShowThemeModal(true),
    },
    {
      id: 'export',
      title: 'Export Expenses',
      subtitle: 'Export to Excel/Google Sheets',
      icon: 'download',
      onPress: () => setShowExportModal(true),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[styles.header, { borderBottomColor: theme.colors.border }]}
      >
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Settings</Text>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {settingsOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.settingItem, { backgroundColor: theme.colors.card }]}
              onPress={option.onPress}
            >
              <View style={[styles.settingIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                <Ionicons name={option.icon as any} size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{option.title}</Text>
                <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>{option.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      
      <Modal
        visible={showThemeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Theme</Text>
            <TouchableOpacity onPress={() => setShowThemeModal(false)}>
              <Text style={[styles.modalClose, { color: theme.colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.themeOptions}>
            {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.themeOption,
                  { backgroundColor: theme.colors.card },
                  themeMode === mode && { borderColor: theme.colors.primary, borderWidth: 2 }
                ]}
                onPress={() => handleThemeChange(mode)}
              >
                <View style={styles.themeOptionContent}>
                  <Text style={[styles.themeOptionTitle, { color: theme.colors.text }]}>
                    {getThemeModeLabel(mode)}
                  </Text>
                  {mode === 'system' && (
                    <Text style={[styles.themeOptionSubtitle, { color: theme.colors.textSecondary }]}>
                      Follow system setting
                    </Text>
                  )}
                </View>
                {themeMode === mode && (
                  <View style={[styles.checkmark, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Export Expenses</Text>
            <TouchableOpacity onPress={() => setShowExportModal(false)}>
              <Text style={[styles.modalClose, { color: theme.colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.exportContent}>
            <Text style={[styles.exportLabel, { color: theme.colors.text }]}>Select Export Range:</Text>
            
            {/* Export Filter Options */}
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  exportFilter === 'all' && { borderColor: theme.colors.primary, borderWidth: 2 }
                ]}
                onPress={() => setExportFilter('all')}
              >
                <Text style={[
                  styles.filterOptionText,
                  { color: exportFilter === 'all' ? theme.colors.primary : theme.colors.text }
                ]}>All Expenses</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  exportFilter === 'current-month' && { borderColor: theme.colors.primary, borderWidth: 2 }
                ]}
                onPress={() => setExportFilter('current-month')}
              >
                <Text style={[
                  styles.filterOptionText,
                  { color: exportFilter === 'current-month' ? theme.colors.primary : theme.colors.text }
                ]}>Current Month</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  exportFilter === 'custom-month' && { borderColor: theme.colors.primary, borderWidth: 2 }
                ]}
                onPress={() => setExportFilter('custom-month')}
              >
                <Text style={[
                  styles.filterOptionText,
                  { color: exportFilter === 'custom-month' ? theme.colors.primary : theme.colors.text }
                ]}>Custom Month</Text>
              </TouchableOpacity>
            </View>

            {/* Custom Month Input */}
            {exportFilter === 'custom-month' && (
              <View style={styles.customMonthContainer}>
                <Text style={[styles.exportLabel, { color: theme.colors.text }]}>Enter Month (YYYYMM):</Text>
                <TextInput
                  style={[styles.monthInput, { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }]}
                  value={selectedMonth}
                  onChangeText={setSelectedMonth}
                  placeholder="202501"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            )}

            {/* Export Button */}
            <TouchableOpacity
              style={[
                styles.exportButton,
                { backgroundColor: theme.colors.primary },
                (exportFilter === 'custom-month' && !selectedMonth) && { opacity: 0.5 }
              ]}
              onPress={handleExport}
              disabled={exportFilter === 'custom-month' && !selectedMonth}
            >
              <Text style={styles.exportButtonText}>Export to CSV</Text>
            </TouchableOpacity>

            <Text style={[styles.exportNote, { color: theme.colors.textSecondary }]}>
              Export will include: Date, Expense Type, Amount, Category Name, Payment Type, Note
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalClose: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeOptions: {
    padding: 20,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeOptionContent: {
    flex: 1,
  },
  themeOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  themeOptionSubtitle: {
    fontSize: 14,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  exportContent: {
    flex: 1,
    padding: 20,
  },
  exportLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  filterOptions: {
    marginBottom: 20,
  },
  filterOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  customMonthContainer: {
    marginBottom: 20,
  },
  monthInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginTop: 8,
  },
  exportButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  exportNote: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});