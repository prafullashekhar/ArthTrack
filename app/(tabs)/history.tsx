import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EXPENSE_TYPE_COLORS, EXPENSE_TYPE_ICONS } from '@/constants/defaultCategories';
import { ExpenseType } from '@/types/expense';
import { databaseService, ExpenseWithDetails } from '@/services/databaseService';
import { dataUpdateEmitter } from '@/services/databaseService';
import { useTheme } from '@/store/themeStore';

export default function HistoryScreen() {
  const { theme } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState<'all' | ExpenseType>('all');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyTotals, setMonthlyTotals] = useState({
    need: 0,
    want: 0,
    total: 0
  });
  
  const loadExpenses = async () => {
    try {
      setLoading(true);
      const allExpenses = await databaseService.getAllExpenses();
      setExpenses(allExpenses);
      
      // Calculate monthly totals
      const monthId = parseInt(selectedMonth);
      const needTotal = await databaseService.getTotalSpentByType('Need', monthId);
      const wantTotal = await databaseService.getTotalSpentByType('Want', monthId);
      
      setMonthlyTotals({
        need: needTotal,
        want: wantTotal,
        total: needTotal + wantTotal
      });
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadExpenses();
    
    // Subscribe to data updates
    const unsubscribe = dataUpdateEmitter.subscribe(() => {
      loadExpenses();
    });
    
    // Cleanup subscription on unmount
    return unsubscribe;
  }, [selectedMonth]);
  
  const filteredExpenses = expenses
    .filter((expense) => {
      const matchesType = selectedFilter === 'all' || expense.expense_type === selectedFilter;
      const matchesMonth = expense.date.startsWith(selectedMonth);
      return matchesType && matchesMonth;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  
  const formatDate = (dateString: string) => {
    try {
      // Use database service to parse YYYYMMDD format
      const date = databaseService.parseIdToDate(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };
  
  const formatMonthYear = (monthString: string) => {
    const year = monthString.substring(0, 4);
    const month = monthString.substring(4, 6);
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric',
    });
  };
  
  const formatAmount = (amount: number) => {
    return `₹${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    const year = parseInt(selectedMonth.substring(0, 4));
    const month = parseInt(selectedMonth.substring(4, 6));
    const currentDate = new Date(year, month - 1);
    
    if (direction === 'prev') {
      currentDate.setMonth(currentDate.getMonth() - 1);
    } else {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    const newMonth = `${currentDate.getFullYear()}${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };
  
  const handleDeleteExpense = async (expense: ExpenseWithDetails) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete this ${expense.category_name} expense of ₹${Number(expense.amount).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteExpense(expense.expense_id);
              await loadExpenses(); // Reload the list
            } catch (error) {
              console.error('Error deleting expense:', error);
              Alert.alert('Error', 'Failed to delete expense');
            }
          },
        },
      ]
    );
  };
  
  const renderExpenseItem = ({ item }: { item: ExpenseWithDetails }) => (
    <View style={[styles.expenseItem, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.expenseHeader}>
        <View style={styles.expenseInfo}>
          <View style={styles.categoryRow}>
            <View style={styles.expenseIcon}>
              {React.createElement(EXPENSE_TYPE_ICONS[item.expense_type as ExpenseType], {
                width: 16,
                height: 16,
                fill: EXPENSE_TYPE_COLORS[item.expense_type as ExpenseType].color
              })}
            </View>
            <Text style={[styles.expenseCategory, { color: theme.colors.text }]}>{item.category_name}</Text>
          </View>
          <View style={styles.expenseMetadata}>
            <View style={[
              styles.typeBadge,
              { backgroundColor: EXPENSE_TYPE_COLORS[item.expense_type as ExpenseType].color }
            ]}>
              <Text style={styles.typeBadgeText}>{item.expense_type}</Text>
            </View>
            <Text style={[styles.expenseDate, { color: theme.colors.textSecondary }]}>{formatDate(item.date)}</Text>
            {item.payment_type_name && (
              <Text style={[styles.paymentType, { 
                color: theme.colors.textSecondary,
                backgroundColor: theme.colors.border
              }]}>{item.payment_type_name}</Text>
            )}
          </View>
          {item.note && (
            <Text style={[styles.expenseNote, { color: theme.colors.textSecondary }]}>{item.note}</Text>
          )}
        </View>
        <View style={styles.expenseRight}>
          <Text style={[styles.expenseAmount, { color: theme.colors.text }]}>₹{Number(item.amount).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}</Text>
          {item.split > 1 && (
            <Text style={[styles.splitText, { color: theme.colors.textSecondary }]}>Split: {item.split}</Text>
          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteExpense(item)}
          >
            <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
  
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No expenses found</Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        {selectedFilter === 'all' 
          ? 'Start adding expenses to see them here'
          : `No ${selectedFilter} expenses found`
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Expense History</Text>
      </View>
      
      <View style={styles.monthSelector}>
        <TouchableOpacity
          style={[styles.monthNavButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigateMonth('prev')}
        >
          <Ionicons name="chevron-back-outline" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.monthText, { color: theme.colors.text }]}>{formatMonthYear(selectedMonth)}</Text>
        <TouchableOpacity
          style={[styles.monthNavButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigateMonth('next')}
        >
          <Ionicons name="chevron-forward-outline" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={filteredExpenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item.expense_id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <>
            {/* Monthly Expense Summary Card */}
            <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.summaryContent}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <View style={[styles.summaryIcon, { backgroundColor: EXPENSE_TYPE_COLORS.Need.color + '20' }]}>
                      <Ionicons name="medical-outline" size={20} color={EXPENSE_TYPE_COLORS.Need.color} />
                    </View>
                    <View style={styles.summaryTextContainer}>
                      <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Need</Text>
                      <Text style={[styles.summaryAmount, { color: theme.colors.text }]}>{formatAmount(monthlyTotals.need)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.summaryItem}>
                    <View style={[styles.summaryIcon, { backgroundColor: EXPENSE_TYPE_COLORS.Want.color + '20' }]}>
                      <Ionicons name="gift-outline" size={20} color={EXPENSE_TYPE_COLORS.Want.color} />
                    </View>
                    <View style={styles.summaryTextContainer}>
                      <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Want</Text>
                      <Text style={[styles.summaryAmount, { color: theme.colors.text }]}>{formatAmount(monthlyTotals.want)}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={[styles.totalDivider, { backgroundColor: theme.colors.border }]} />
                
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: theme.colors.textSecondary }]}>Total Spent</Text>
                  <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>{formatAmount(monthlyTotals.total)}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.filterContainer}>
              {(['all', 'Need', 'Want', 'Invest'] as const).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterChip,
                    { 
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border
                    },
                    selectedFilter === filter && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedFilter(filter)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: theme.colors.textSecondary },
                      selectedFilter === filter && styles.filterChipTextActive,
                    ]}
                  >
                    {filter === 'all' ? 'All' : filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      />
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  monthNavButton: {
    padding: 8,
    borderRadius: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
  },
  summaryCard: {
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryContent: {
    gap: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  totalDivider: {
    height: 1,
    marginVertical: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: 'white',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  expenseItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  expenseInfo: {
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  expenseIcon: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: '600',
  },
  expenseMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
  },
  expenseDate: {
    fontSize: 12,
  },
  paymentType: {
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  expenseNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  expenseRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  splitText: {
    fontSize: 10,
  },
  deleteButton: {
    padding: 4,
    marginTop: 4,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});