import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { databaseService } from '@/services/databaseService';
import { dataUpdateEmitter } from '@/services/databaseService';
import { ExpenseType } from '@/types/expense';
import { useTheme } from '@/store/themeStore';
import { EXPENSE_TYPES, CURRENCY, MESSAGES, ACTIONS } from '@/constants/appConstants';
import DatePickerModal from './DatePickerModal';



interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddExpenseModal({ visible, onClose }: AddExpenseModalProps) {
  const { theme } = useTheme();
  const [amount, setAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedType, setSelectedType] = useState<ExpenseType>('Need');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPaymentType, setSelectedPaymentType] = useState('');
  const [split, setSplit] = useState(1);
  const [note, setNote] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const loadData = async () => {
    try {
      const [categoriesData, paymentTypesData] = await Promise.all([
        databaseService.getCategoriesByType(selectedType),
        databaseService.getPaymentTypes()
      ]);
      
      setCategories(categoriesData);
      setPaymentTypes(paymentTypesData);
      
      // Set default payment type after loading
      if (paymentTypesData.length > 0) {
        setSelectedPaymentType(paymentTypesData[0].name);
      }
    } catch (error) {
      console.error('Error loading modal data:', error);
    }
  };
  
  useEffect(() => {
    if (visible) {
      // Reset all fields to default state when modal opens
      setAmount('');
      setSelectedCategory('');
      setSelectedPaymentType('');
      setSplit(1);
      setNote('');
      setSelectedDate(new Date());
      setSelectedType('Need');
      loadData();
    }
  }, [visible]);
  
  // Load categories when expense type changes (without resetting form)
  useEffect(() => {
    if (visible && selectedType) {
      loadData();
    }
  }, [selectedType]);
  
  useEffect(() => {
    if (paymentTypes.length > 0 && !selectedPaymentType) {
      setSelectedPaymentType(paymentTypes[0].name);
    }
  }, [paymentTypes, selectedPaymentType]);
  
  const handleSubmit = async () => {
    if (!selectedCategory || !amount || !selectedPaymentType) {
      Alert.alert('Error', MESSAGES.FILL_REQUIRED_FIELDS);
      return;
    }
    
    const numAmount = parseFloat(amount);
    const numSplit = split;
    
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', MESSAGES.ENTER_VALID_AMOUNT);
      return;
    }
    
    if (numSplit <= 0) {
      Alert.alert('Error', MESSAGES.SELECT_VALID_SPLIT);
      return;
    }
    
    try {
      setLoading(true);
      
      // Find category and payment type IDs
      const category = categories.find(c => c.name === selectedCategory);
      const paymentType = paymentTypes.find(p => p.name === selectedPaymentType);
      
      if (!category || !paymentType) {
        Alert.alert('Error', 'Invalid category or payment type selected');
        return;
      }
      
      // Save expense to database
      await databaseService.addExpense({
        amount: numAmount,
        date: databaseService.formatDateToId(selectedDate),
        expense_type: selectedType,
        category_id: category.id,
        payment_type_id: paymentType.id,
        split: numSplit,
        note: note.trim() || undefined,
      });
      
      // Trigger data update for real-time refresh
      dataUpdateEmitter.emit();
      
      // Reset form and close modal
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving expense:', error);
      Alert.alert('Error', 'Failed to save expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setAmount('');
    setSelectedCategory('');
    setSelectedPaymentType('');
    setSplit(1);
    setNote('');
    setSelectedDate(new Date());
    setSelectedType('Need');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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
          <Text style={[styles.title, { color: theme.colors.text }]}>Add Expense</Text>
          <TouchableOpacity onPress={() => {
            resetForm();
            onClose();
          }} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Amount *</Text>
            <View style={[styles.amountContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.currencySymbol, { color: theme.colors.text }]}>{CURRENCY.SYMBOL}</Text>
              <TextInput
                style={[styles.amountInput, { color: theme.colors.text }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
          </View>
          
          {/* Date Selection */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Date *</Text>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} style={styles.dateIcon} />
              <Text style={[styles.dateText, { color: theme.colors.text }]}>{formatDate(selectedDate)}</Text>
              <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <DatePickerModal
            visible={showDatePicker}
            onClose={() => setShowDatePicker(false)}
            onDateSelect={(date) => setSelectedDate(date)}
            initialDate={selectedDate}
          />
          
          {/* Expense Type Selection */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Expense Type</Text>
            <View style={styles.typeContainer}>
              {([EXPENSE_TYPES.NEED, EXPENSE_TYPES.WANT, EXPENSE_TYPES.INVEST] as ExpenseType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    selectedType === type && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                  ]}
                  onPress={() => {
                    setSelectedType(type);
                    setSelectedCategory('');
                  }}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      { color: theme.colors.text },
                      selectedType === type && { color: 'white' },
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Category *</Text>
            <View style={styles.categoryContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    selectedCategory === category.name && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                  ]}
                  onPress={() => setSelectedCategory(category.name)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      { color: theme.colors.text },
                      selectedCategory === category.name && { color: 'white' },
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Payment Type Selection */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Payment Type *</Text>
            <View style={styles.categoryContainer}>
              {paymentTypes.map((paymentType) => (
                <TouchableOpacity
                  key={paymentType.id}
                  style={[
                    styles.categoryButton,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    selectedPaymentType === paymentType.name && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                  ]}
                  onPress={() => setSelectedPaymentType(paymentType.name)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      { color: theme.colors.text },
                      selectedPaymentType === paymentType.name && { color: 'white' },
                    ]}
                  >
                    {paymentType.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Split */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Split</Text>
            <View style={styles.splitContainer}>
              {[1, 2, 3, 4, 5, 6].map((splitValue) => (
                <TouchableOpacity
                  key={splitValue}
                  style={[
                    styles.splitButton,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    split === splitValue && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                  ]}
                  onPress={() => setSplit(splitValue)}
                >
                  <Text
                    style={[
                      styles.splitButtonText,
                      { color: theme.colors.text },
                      split === splitValue && { color: 'white' },
                    ]}
                  >
                    {splitValue}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Note */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Note (Optional)</Text>
            <TextInput
              style={[styles.input, styles.noteInput, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
              value={note}
              onChangeText={setNote}
              placeholder="Add a note..."
              multiline
              numberOfLines={3}
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
        </ScrollView>
        
        <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: theme.colors.primary },
              (!selectedCategory || !amount || !selectedPaymentType || loading) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!selectedCategory || !amount || !selectedPaymentType || loading}
          >
            <Ionicons name={loading ? "time" : "add-circle"} size={20} color="white" />
            <Text style={styles.submitButtonText}>
              {loading ? 'Saving...' : `${ACTIONS.ADD} Expense`}
            </Text>
          </TouchableOpacity>
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

  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateIcon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
  },


  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryButtonText: {
    fontSize: 14,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    paddingVertical: 16,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
  },
  noteInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  splitContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  splitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  splitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});