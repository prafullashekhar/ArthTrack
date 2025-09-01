import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { databaseService } from '@/services/databaseService';
import { dataUpdateEmitter } from '@/services/databaseService';
import { PaymentType } from '@/repositories/paymentTypeRepository';
import { useTheme } from '@/store/themeStore';
// import AddIcon from '@/images/add_icon.svg'; // Temporarily commented out

export default function PaymentTypesScreen() {
  const { theme } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPaymentType, setEditingPaymentType] = useState<PaymentType | null>(null);
  const [paymentTypeName, setPaymentTypeName] = useState('');
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(true);
  
  const loadPaymentTypes = async () => {
    try {
      setLoading(true);
      console.log('Loading payment types...');
      const types = await databaseService.getPaymentTypes();
      console.log('Payment types loaded:', types);
      setPaymentTypes(types);
    } catch (error) {
      console.error('Error loading payment types:', error);
      Alert.alert('Error', `Failed to load payment types: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadPaymentTypes();
  }, []);
  
  // Subscribe to data updates
  useEffect(() => {
    const unsubscribe = dataUpdateEmitter.subscribe(() => {
      loadPaymentTypes();
    });
    return unsubscribe;
  }, []);
  
  const handleAddPaymentType = async () => {
    if (!paymentTypeName.trim()) {
      Alert.alert('Error', 'Please enter a payment type name');
      return;
    }
    
    if (paymentTypes.some(pt => pt.name.toLowerCase() === paymentTypeName.trim().toLowerCase())) {
      Alert.alert('Error', 'Payment type already exists');
      return;
    }
    
    try {
      console.log('Adding payment type:', paymentTypeName.trim());
      await databaseService.addPaymentType(paymentTypeName.trim());
      console.log('Payment type added successfully');
      dataUpdateEmitter.emit();
      setPaymentTypeName('');
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding payment type:', error);
      Alert.alert('Error', `Failed to add payment type: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const handleEditPaymentType = async () => {
    if (!editingPaymentType || !paymentTypeName.trim()) {
      Alert.alert('Error', 'Please enter a payment type name');
      return;
    }
    
    if (paymentTypes.some(pt => pt.id !== editingPaymentType.id && pt.name.toLowerCase() === paymentTypeName.trim().toLowerCase())) {
      Alert.alert('Error', 'Payment type already exists');
      return;
    }
    
    try {
      console.log('Updating payment type:', editingPaymentType.id, paymentTypeName.trim());
      await databaseService.updatePaymentType(editingPaymentType.id, paymentTypeName.trim());
      console.log('Payment type updated successfully');
      dataUpdateEmitter.emit();
      setPaymentTypeName('');
      setEditingPaymentType(null);
    } catch (error) {
      console.error('Error updating payment type:', error);
      Alert.alert('Error', `Failed to update payment type: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const handleDeletePaymentType = (paymentType: PaymentType) => {
    if (paymentTypes.length <= 1) {
      Alert.alert('Error', 'You must have at least one payment type');
      return;
    }
    
    Alert.alert(
      'Delete Payment Type',
      `Are you sure you want to delete "${paymentType.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting payment type:', paymentType.id);
              await databaseService.deletePaymentType(paymentType.id);
              console.log('Payment type deleted successfully');
              dataUpdateEmitter.emit();
            } catch (error) {
              console.error('Error deleting payment type:', error);
              Alert.alert('Error', `Failed to delete payment type: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          },
        },
      ]
    );
  };
  
  const openEditModal = (paymentType: PaymentType) => {
    setEditingPaymentType(paymentType);
    setPaymentTypeName(paymentType.name);
  };
  
  const closeModal = () => {
    setShowAddModal(false);
    setEditingPaymentType(null);
    setPaymentTypeName('');
  };
  
  const renderPaymentTypeItem = ({ item }: { item: PaymentType }) => (
    <View style={[styles.paymentTypeItem, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.paymentTypeName, { color: theme.colors.text }]}>{item.name}</Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="create-outline" size={16} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeletePaymentType(item)}
        >
          <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderModal = () => (
    <Modal
      visible={showAddModal || editingPaymentType !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeModal}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.modalHeader, { 
          borderBottomColor: theme.colors.border,
          backgroundColor: theme.colors.surface
        }]}>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            {editingPaymentType ? 'Edit Payment Type' : 'Add Payment Type'}
          </Text>
          <TouchableOpacity onPress={closeModal}>
            <Text style={[styles.cancelButton, { color: theme.colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.modalContent}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Payment Type Name</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }]}
            value={paymentTypeName}
            onChangeText={setPaymentTypeName}
            placeholder="Enter payment type name"
            placeholderTextColor={theme.colors.textSecondary}
            autoFocus
          />
        </View>
        
        <View style={[styles.modalFooter, { 
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.surface
        }]}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              !paymentTypeName.trim() && styles.saveButtonDisabled,
            ]}
            onPress={editingPaymentType ? handleEditPaymentType : handleAddPaymentType}
            disabled={!paymentTypeName.trim()}
          >
            <Text style={styles.saveButtonText}>
              {editingPaymentType ? 'Update' : 'Add'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Manage your payment methods</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color="white" />
          <Text style={styles.addButtonText}>Add Payment Type</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading payment types...</Text>
        </View>
      ) : (
        <FlatList
          data={paymentTypes}
          renderItem={renderPaymentTypeItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {renderModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  paymentTypeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  paymentTypeName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
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
  cancelButton: {
    fontSize: 16,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});