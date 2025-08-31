import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EXPENSE_TYPE_COLORS, EXPENSE_TYPE_ICONS } from '@/constants/defaultCategories';
import { ExpenseType } from '@/types/expense';
import { databaseService } from '@/services/database';
import { ExpenseWithDetails } from '@/services/database';

export default function HistoryScreen() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | ExpenseType>('all');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  
  const loadExpenses = async () => {
    try {
      setLoading(true);
      const allExpenses = await databaseService.getAllExpenses();
      setExpenses(allExpenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };
  
  React.useEffect(() => {
    loadExpenses();
  }, []);
  
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
    <View style={styles.expenseItem}>
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
            <Text style={styles.expenseCategory}>{item.category_name}</Text>
          </View>
          <View style={styles.expenseMetadata}>
            <View style={[
              styles.typeBadge,
              { backgroundColor: EXPENSE_TYPE_COLORS[item.expense_type as ExpenseType].color }
            ]}>
              <Text style={styles.typeBadgeText}>{item.expense_type}</Text>
            </View>
            <Text style={styles.expenseDate}>{formatDate(item.date)}</Text>
            {item.payment_type_name && (
              <Text style={styles.paymentType}>{item.payment_type_name}</Text>
            )}
          </View>
          {item.note && (
            <Text style={styles.expenseNote}>{item.note}</Text>
          )}
        </View>
        <View style={styles.expenseRight}>
          <Text style={styles.expenseAmount}>₹{Number(item.amount).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}</Text>
          {item.split > 1 && (
            <Text style={styles.splitText}>Split: {item.split}</Text>
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
      <Ionicons name="calendar-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No expenses found</Text>
      <Text style={styles.emptySubtitle}>
        {selectedFilter === 'all' 
          ? 'Start adding expenses to see them here'
          : `No ${selectedFilter} expenses found`
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expense History</Text>
      </View>
      
      <View style={styles.monthSelector}>
        <TouchableOpacity
          style={styles.monthNavButton}
          onPress={() => navigateMonth('prev')}
        >
          <Ionicons name="chevron-back-outline" size={20} color="#666" />
        </TouchableOpacity>
        <Text style={styles.monthText}>{formatMonthYear(selectedMonth)}</Text>
        <TouchableOpacity
          style={styles.monthNavButton}
          onPress={() => navigateMonth('next')}
        >
          <Ionicons name="chevron-forward-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.filterContainer}>
        {(['all', 'Need', 'Want', 'Invest'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              selectedFilter === filter && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === filter && styles.filterChipTextActive,
              ]}
            >
              {filter === 'all' ? 'All' : filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <FlatList
        data={filteredExpenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item.expense_id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
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
    backgroundColor: 'white',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterChipTextActive: {
    color: 'white',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  expenseItem: {
    backgroundColor: 'white',
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
    color: '#333',
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
    color: '#666',
  },
  paymentType: {
    fontSize: 10,
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  expenseNote: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 4,
  },
  expenseRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  splitText: {
    fontSize: 10,
    color: '#666',
  },
  deleteButton: {
    padding: 4,
    marginTop: 4,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});