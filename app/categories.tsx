import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EXPENSE_TYPE_COLORS } from '@/constants/defaultCategories';
import { databaseService } from '@/services/databaseService';
import { ExpenseType } from '@/types/expense';
import { EXPENSE_TYPES } from '@/constants/appConstants';
import { useTheme } from '@/store/themeStore';
// import AddIcon from '@/images/add_icon.svg'; // Temporarily commented out

export default function CategoriesScreen() {
  const { theme } = useTheme();
  const [selectedType, setSelectedType] = useState<ExpenseType>('Need');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: number; name: string } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const categoriesData = await databaseService.getCategoriesByType(selectedType);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [selectedType]);
  
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);
  
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }
    
    try {
      setSaving(true);
      await databaseService.addCategory(newCategoryName.trim(), selectedType);
      setNewCategoryName('');
      setShowAddModal(false);
      await loadCategories(); // Refresh the list
    } catch (error) {
      console.error('Error adding category:', error);
      Alert.alert('Error', 'Failed to add category');
    } finally {
      setSaving(false);
    }
  };
  
  const handleEditCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }
    
    try {
      setSaving(true);
      await databaseService.updateCategory(editingCategory.id, newCategoryName.trim(), selectedType);
      setNewCategoryName('');
      setEditingCategory(null);
      setShowEditModal(false);
      await loadCategories(); // Refresh the list
    } catch (error) {
      console.error('Error updating category:', error);
      Alert.alert('Error', 'Failed to update category');
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteCategory = (id: number, name: string) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteCategory(id);
              await loadCategories(); // Refresh the list
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Error', 'Failed to delete category');
            }
          },
        },
      ]
    );
  };
  
  const openEditModal = (category: { id: number; name: string }) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setShowEditModal(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Manage Categories',
          headerBackTitle: 'Settings',
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            color: theme.colors.text,
          },
        }}
      />
      
      <View style={styles.typeSelector}>
        {([EXPENSE_TYPES.NEED, EXPENSE_TYPES.WANT, EXPENSE_TYPES.INVEST] as ExpenseType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeButton,
              { 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              },
              selectedType === type && [
                styles.typeButtonActive,
                { backgroundColor: EXPENSE_TYPE_COLORS[type].color }
              ],
            ]}
            onPress={() => setSelectedType(type)}
          >
            <Text
              style={[
                styles.typeButtonText,
                { color: theme.colors.textSecondary },
                selectedType === type && styles.typeButtonTextActive,
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{selectedType} Categories</Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: EXPENSE_TYPE_COLORS[selectedType].color }]}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add-circle-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={EXPENSE_TYPE_COLORS[selectedType].color} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading categories...</Text>
            </View>
          ) : (
            <>
              {categories.map((category) => (
                <View key={category.id} style={[styles.categoryItem, { backgroundColor: theme.colors.surface }]}>
                  <Text style={[styles.categoryName, { color: theme.colors.text }]}>{category.name}</Text>
                  <View style={styles.categoryActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => openEditModal(category)}
                    >
                      <Ionicons name="create-outline" size={16} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteCategory(category.id, category.name)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              
              {categories.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No categories found</Text>
                  <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>Add your first category to get started</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
      
      {/* Add Category Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { 
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.surface
          }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add Category</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={[styles.cancelButton, { color: theme.colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Category Name</Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text
              }]}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Enter category name"
              placeholderTextColor={theme.colors.textSecondary}
              autoFocus
            />
            
            <TouchableOpacity
              style={[
                styles.submitButton, 
                { backgroundColor: EXPENSE_TYPE_COLORS[selectedType].color },
                saving && styles.submitButtonDisabled
              ]}
              onPress={handleAddCategory}
              disabled={saving}
            >
              <Text style={styles.submitButtonText}>
                {saving ? 'Adding...' : 'Add Category'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
      
      {/* Edit Category Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { 
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.surface
          }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Edit Category</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={[styles.cancelButton, { color: theme.colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Category Name</Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text
              }]}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Enter category name"
              placeholderTextColor={theme.colors.textSecondary}
              autoFocus
            />
            
            <TouchableOpacity
              style={[
                styles.submitButton, 
                { backgroundColor: EXPENSE_TYPE_COLORS[selectedType].color },
                saving && styles.submitButtonDisabled
              ]}
              onPress={handleEditCategory}
              disabled={saving}
            >
              <Text style={styles.submitButtonText}>
                {saving ? 'Updating...' : 'Update Category'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  typeSelector: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: 'transparent',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  categoryName: {
    fontSize: 16,
    flex: 1,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    fontSize: 16,
  },
  modalContent: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});