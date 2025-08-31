import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EXPENSE_TYPE_COLORS } from '@/constants/defaultCategories';
import { databaseService } from '@/services/database';
import { ExpenseType } from '@/types/expense';

// Generate color variations based on expense type
const generateCategoryColors = (baseColor: string, count: number): string[] => {
  const colors: string[] = [];
  
  // Convert hex to RGB
  const r = parseInt(baseColor.slice(1, 3), 16);
  const g = parseInt(baseColor.slice(3, 5), 16);
  const b = parseInt(baseColor.slice(5, 7), 16);
  
  for (let i = 0; i < count; i++) {
    // Create variations by adjusting brightness
    const factor = 0.7 + (i * 0.6) / count; // Range from 0.7 to 1.3
    const newR = Math.min(255, Math.floor(r * factor));
    const newG = Math.min(255, Math.floor(g * factor));
    const newB = Math.min(255, Math.floor(b * factor));
    
    colors.push(`rgb(${newR}, ${newG}, ${newB})`);
  }
  
  return colors;
};

export default function ExpenseDetailsScreen() {
  const { type } = useLocalSearchParams<{ type: ExpenseType }>();
  const [allocated, setAllocated] = useState(0);
  const [spent, setSpent] = useState(0);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  if (!type) {
    router.back();
    return null;
  }
  
  const currentMonthId = databaseService.getCurrentMonthId();
  const remaining = Math.max(0, allocated - spent);
  
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get allocation for current month
      const allocation = await databaseService.getCurrentMonthAllocation();
      const typeAllocation = type === 'Need' ? allocation.need_amount : 
                           type === 'Want' ? allocation.want_amount : 
                           allocation.invest_amount;
      setAllocated(typeAllocation);
      
      // Get total spent for this type and month
      const totalSpent = await databaseService.getTotalSpentByType(type, currentMonthId);
      setSpent(totalSpent);
      
      // Get expenses for this type and month
      const expensesList = await databaseService.getExpensesByTypeAndMonth(type, currentMonthId);
      setExpenses(expensesList);
    } catch (error) {
      console.error('Error loading expense details:', error);
    } finally {
      setLoading(false);
    }
  }, [type, currentMonthId]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Group expenses by category for breakdown
  const categoryTotals = expenses.reduce((acc, expense) => {
    const categoryName = expense.category_name || 'Unknown';
    acc[categoryName] = (acc[categoryName] || 0) + (expense.amount / expense.split);
    return acc;
  }, {} as Record<string, number>);
  
  // Get base color for the expense type
  const baseColor = EXPENSE_TYPE_COLORS[type].color;
  const categoryColors = generateCategoryColors(baseColor, Object.keys(categoryTotals).length);
  
  const categoryBreakdown = Object.entries(categoryTotals)
    .map(([category, amount], index) => ({
      category,
      amount: amount as number,
      percentage: spent > 0 ? (amount as number / spent) * 100 : 0,
      color: categoryColors[index] || baseColor,
    }))
    .sort((a, b) => b.amount - a.amount);
  
  const progressPercentage = allocated > 0 ? (spent / allocated) * 100 : 0;
  
  const formatMonth = () => {
    const now = new Date();
    return now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: `${type} Details`,
            headerBackTitle: 'Home',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={EXPENSE_TYPE_COLORS[type].color} />
          <Text style={styles.loadingText}>Loading {type} details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: `${type} Details`,
          headerBackTitle: 'Home',
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header Card */}
          <View style={[styles.headerCard, { backgroundColor: EXPENSE_TYPE_COLORS[type].color }]}>
            <Text style={styles.headerTitle}>{type} Expenses</Text>
            <Text style={styles.headerSubtitle}>{formatMonth()}</Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Allocated</Text>
                <Text style={styles.statValue}>₹{Number(allocated).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Spent</Text>
                <Text style={styles.statValue}>₹{Number(spent).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Remaining</Text>
                <Text style={styles.statValue}>₹{Number(remaining).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}</Text>
              </View>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${Math.min(progressPercentage, 100)}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{Math.round(progressPercentage)}% used</Text>
            </View>
          </View>
          
          {/* Spending Breakdown Section */}
          <View style={styles.breakdownSection}>
            <Text style={styles.sectionTitle}>Spending Breakdown</Text>
            {categoryBreakdown.length > 0 ? (
              categoryBreakdown.map((item, index) => (
                <View key={item.category} style={styles.breakdownItem}>
                  <View style={styles.breakdownLeft}>
                    <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
                    <Text style={styles.categoryName}>{item.category}</Text>
                  </View>
                  <View style={styles.breakdownRight}>
                    <Text style={styles.categoryAmount}>₹{Number(item.amount).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}</Text>
                    <Text style={styles.categoryPercentage}>{Math.round(item.percentage)}%</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyBreakdown}>
                <Text style={styles.emptyText}>No expenses recorded</Text>
                <Text style={styles.emptySubtext}>Start adding expenses to see the breakdown</Text>
              </View>
            )}
          </View>
          
          {/* Recent Expenses */}
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            {expenses.length > 0 ? (
              expenses
                .slice(0, 10)
                .map((expense) => (
                  <View key={expense.expense_id} style={styles.expenseItem}>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseCategory}>{expense.category_name || 'Unknown'}</Text>
                      <Text style={styles.expenseDate}>
                        {databaseService.parseIdToDate(expense.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </Text>
                    </View>
                    <Text style={styles.expenseAmount}>₹{Number(expense.amount / expense.split).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}</Text>
                  </View>
                ))
            ) : (
              <View style={styles.emptyExpenses}>
                <Text style={styles.emptyText}>No expenses found</Text>
                <Text style={styles.emptySubtext}>Add your first {type.toLowerCase()} expense</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    color: '#666',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  headerCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: 'white',
    opacity: 0.9,
    textAlign: 'center',
  },
  breakdownSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  breakdownRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#666',
  },
  emptyBreakdown: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  recentSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 12,
    color: '#666',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyExpenses: {
    alignItems: 'center',
    paddingVertical: 20,
  },
});