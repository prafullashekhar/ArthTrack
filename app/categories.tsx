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
// import AddIcon from '@/images/add_icon.svg'; // Temporarily commented out

export default function CategoriesScreen() {
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
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Manage Categories',
          headerBackTitle: 'Settings',
        }}
      />
      
      <View style={styles.typeSelector}>
        {([EXPENSE_TYPES.NEED, EXPENSE_TYPES.WANT, EXPENSE_TYPES.INVEST] as ExpenseType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeButton,
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
            <Text style={styles.sectionTitle}>{selectedType} Categories</Text>
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
              <Text style={styles.loadingText}>Loading categories...</Text>
            </View>
          ) : (
            <>
              {categories.map((category) => (
                <View key={category.id} style={styles.categoryItem}>
                  <Text style={styles.categoryName}>{category.name}</Text>
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
                  <Text style={styles.emptyText}>No categories found</Text>
                  <Text style={styles.emptySubtext}>Add your first category to get started</Text>
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
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Category</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Category Name</Text>
            <TextInput
              style={styles.textInput}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Enter category name"
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
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Category</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Category Name</Text>
            <TextInput
              style={styles.textInput}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Enter category name"
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
    backgroundColor: '#f8f9fa',
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
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: 'transparent',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
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
    color: '#333',
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
    backgroundColor: 'white',
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
    color: '#333',
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
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalContent: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e9ecef',
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