import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EXPENSE_TYPE_COLORS } from '@/constants/defaultCategories';
import { databaseService } from '@/services/database';
import { ExpenseType } from '@/types/expense';

export default function AllocationScreen() {
  const [allocations, setAllocations] = useState({
    Need: '0',
    Want: '0',
    Invest: '0',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const loadCurrentAllocation = useCallback(async () => {
    try {
      setLoading(true);
      const currentAllocation = await databaseService.getCurrentMonthAllocation();
      setAllocations({
        Need: currentAllocation.need_amount.toString(),
        Want: currentAllocation.want_amount.toString(),
        Invest: currentAllocation.invest_amount.toString(),
      });
    } catch (error) {
      console.error('Error loading allocation:', error);
      // Keep default values if there's an error
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadCurrentAllocation();
  }, [loadCurrentAllocation]);
  
  const handleSave = async () => {
    const needAmount = parseFloat(allocations.Need) || 0;
    const wantAmount = parseFloat(allocations.Want) || 0;
    const investAmount = parseFloat(allocations.Invest) || 0;
    
    if (needAmount < 0 || wantAmount < 0 || investAmount < 0) {
      Alert.alert('Error', 'Please enter valid amounts');
      return;
    }
    
    try {
      setSaving(true);
      await databaseService.updateCurrentMonthAllocation({
        need_amount: needAmount,
        want_amount: wantAmount,
        invest_amount: investAmount,
      });
      
      Alert.alert('Success', 'Monthly allocation updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving allocation:', error);
      Alert.alert('Error', 'Failed to save allocation. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  const totalAllocation = Object.values(allocations).reduce((sum, value) => {
    return sum + (parseFloat(value) || 0);
  }, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Monthly Allocation</Text>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.description}>
            Set your monthly budget allocation for each expense type. This will help you track your spending limits.
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading allocation...</Text>
            </View>
          ) : (
            <>
              {(['Need', 'Want', 'Invest'] as ExpenseType[]).map((type) => (
            <View key={type} style={styles.allocationItem}>
              <View style={styles.allocationHeader}>
                <View style={[
                  styles.typeIndicator,
                  { backgroundColor: EXPENSE_TYPE_COLORS[type].color }
                ]} />
                <Text style={styles.typeTitle}>{type}</Text>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  value={allocations[type]}
                  onChangeText={(value) => setAllocations(prev => ({ ...prev, [type]: value }))}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          ))}
          
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total Monthly Budget</Text>
                <Text style={styles.totalAmount}>₹{Number(totalAllocation).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}</Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={saving || loading}
        >
          <Ionicons name={saving ? "time" : "save"} size={20} color="white" />
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Allocation'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 32,
    textAlign: 'center',
  },
  allocationItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  allocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  typeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    paddingVertical: 16,
  },
  totalContainer: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: 'white',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
  header: {
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});