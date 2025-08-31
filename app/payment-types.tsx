import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenseStore } from '@/store/expenseStore';
import { PaymentType } from '@/types/expense';
// import AddIcon from '@/images/add_icon.svg'; // Temporarily commented out

export default function PaymentTypesScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPaymentType, setEditingPaymentType] = useState<PaymentType | null>(null);
  const [paymentTypeName, setPaymentTypeName] = useState('');
  
  const {
    getPaymentTypes,
    addPaymentType,
    updatePaymentType,
    deletePaymentType,
  } = useExpenseStore();
  
  const paymentTypes = getPaymentTypes();
  
  const handleAddPaymentType = () => {
    if (!paymentTypeName.trim()) {
      Alert.alert('Error', 'Please enter a payment type name');
      return;
    }
    
    if (paymentTypes.some(pt => pt.name.toLowerCase() === paymentTypeName.trim().toLowerCase())) {
      Alert.alert('Error', 'Payment type already exists');
      return;
    }
    
    addPaymentType(paymentTypeName.trim());
    setPaymentTypeName('');
    setShowAddModal(false);
  };
  
  const handleEditPaymentType = () => {
    if (!editingPaymentType || !paymentTypeName.trim()) {
      Alert.alert('Error', 'Please enter a payment type name');
      return;
    }
    
    if (paymentTypes.some(pt => pt.id !== editingPaymentType.id && pt.name.toLowerCase() === paymentTypeName.trim().toLowerCase())) {
      Alert.alert('Error', 'Payment type already exists');
      return;
    }
    
    updatePaymentType(editingPaymentType.id, paymentTypeName.trim());
    setPaymentTypeName('');
    setEditingPaymentType(null);
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
          onPress: () => deletePaymentType(paymentType.id),
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
    <View style={styles.paymentTypeItem}>
      <Text style={styles.paymentTypeName}>{item.name}</Text>
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
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {editingPaymentType ? 'Edit Payment Type' : 'Add Payment Type'}
          </Text>
          <TouchableOpacity onPress={closeModal}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.modalContent}>
          <Text style={styles.inputLabel}>Payment Type Name</Text>
          <TextInput
            style={styles.input}
            value={paymentTypeName}
            onChangeText={setPaymentTypeName}
            placeholder="Enter payment type name"
            placeholderTextColor="#999"
            autoFocus
          />
        </View>
        
        <View style={styles.modalFooter}>
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>Manage your payment methods</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color="white" />
          <Text style={styles.addButtonText}>Add Payment Type</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={paymentTypes}
        renderItem={renderPaymentTypeItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      
      {renderModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
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
    backgroundColor: 'white',
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
    color: '#333',
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
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
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
});