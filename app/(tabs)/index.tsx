import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState, useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AddExpenseModal from '@/components/AddExpenseModal';
import ExpenseTypeCard from '@/components/ExpenseTypeCard';
import { EXPENSE_TYPE_COLORS } from '@/constants/defaultCategories';
import { APP_NAME, APP_SUBTITLE, LABELS, EXPENSE_TYPES, CURRENCY } from '@/constants/appConstants';
import { databaseService } from '@/services/databaseService';
import { ExpenseType, ExpenseTypeData } from '@/types/expense';

export default function HomeScreen() {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [allocation, setAllocation] = useState({ Need: 0, Want: 0, Invest: 0 });
  const [spentAmounts, setSpentAmounts] = useState({ Need: 0, Want: 0, Invest: 0 });
  const [loading, setLoading] = useState(true);
  
  const currentMonthId = databaseService.getCurrentMonthId();
  
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get current month allocation
      const currentAllocation = await databaseService.getCurrentMonthAllocation();
      setAllocation({
        Need: currentAllocation.need_amount,
        Want: currentAllocation.want_amount,
        Invest: currentAllocation.invest_amount,
      });
      
      // Get spent amounts for each type
      const needSpent = await databaseService.getTotalSpentByType('Need', currentMonthId);
      const wantSpent = await databaseService.getTotalSpentByType('Want', currentMonthId);
      const investSpent = await databaseService.getTotalSpentByType('Invest', currentMonthId);
      
      setSpentAmounts({
        Need: needSpent,
        Want: wantSpent,
        Invest: investSpent,
      });
    } catch (error) {
      console.error('Error loading home screen data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentMonthId]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const expenseTypesData: ExpenseTypeData[] = ([EXPENSE_TYPES.NEED, EXPENSE_TYPES.WANT, EXPENSE_TYPES.INVEST] as ExpenseType[]).map((type) => {
    const allocated = allocation[type];
    const spent = spentAmounts[type];
    const remaining = Math.max(0, allocated - spent);
    
    return {
      type,
      allocated,
      spent,
      remaining,
      color: EXPENSE_TYPE_COLORS[type].color,
      gradient: EXPENSE_TYPE_COLORS[type].gradient,
    };
  });
  
  const totalAllocated = expenseTypesData.reduce((sum, data) => sum + data.allocated, 0);
  const totalSpent = expenseTypesData.reduce((sum, data) => sum + data.spent, 0);
  const totalRemaining = expenseTypesData.reduce((sum, data) => sum + data.remaining, 0);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.title}>{APP_NAME}</Text>
              <Text style={styles.subtitle}>{APP_SUBTITLE}</Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.debugButton}
                onPress={() => router.push('/debug')}
              >
                <Ionicons name="bug" size={20} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.settingsButton}
                onPress={() => router.push('/settings')}
              >
                <Ionicons name="settings-outline" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{LABELS.TOTAL_BUDGET}</Text>
              <Text style={styles.summaryValue}>{CURRENCY.SYMBOL}{Number(totalAllocated).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{LABELS.SPENT}</Text>
              <Text style={[styles.summaryValue, styles.spentValue]}>{CURRENCY.SYMBOL}{Number(totalSpent).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{LABELS.REMAINING}</Text>
              <Text style={[styles.summaryValue, styles.remainingValue]}>{CURRENCY.SYMBOL}{Number(totalRemaining).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.addExpenseButton}
          onPress={() => setShowAddExpense(true)}
        >
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addExpenseGradient}
          >
            <Ionicons name="add" size={24} color="white" style={styles.addIcon} />
            <Text style={styles.addExpenseText}>Add Expense</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={styles.expenseTypes}>
          {expenseTypesData.map((data) => (
            <ExpenseTypeCard key={data.type} data={data} />
          ))}
        </View>
      </ScrollView>
      
      <AddExpenseModal
        visible={showAddExpense}
        onClose={() => {
          setShowAddExpense(false);
          loadData(); // Refresh data when modal closes
        }}
      />
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
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  debugButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  summaryCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  spentValue: {
    color: '#FF6B6B',
  },
  remainingValue: {
    color: '#4ECDC4',
  },
  addExpenseButton: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  addExpenseGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  addIcon: {
    marginRight: 8,
  },
  addExpenseText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  expenseTypes: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
});