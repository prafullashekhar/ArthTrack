import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, ThemeMode } from '@/store/themeStore';

export default function SettingsScreen() {
  const { theme, themeMode, setThemeMode } = useTheme();
  const [showThemeModal, setShowThemeModal] = useState(false);
  
  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    setShowThemeModal(false);
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
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={styles.header}
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
    borderBottomColor: 'transparent',
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
});