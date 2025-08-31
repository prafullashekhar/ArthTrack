import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { databaseService } from '@/services/databaseService';
import { useTheme } from '@/store/themeStore';
import { Ionicons } from '@expo/vector-icons';

export default function DebugScreen() {
  const { theme } = useTheme();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [expensesData, categoriesData, paymentTypesData, allocationsData] = await Promise.all([
        databaseService.getAllExpenses(),
        databaseService.getAllCategories(),
        databaseService.getPaymentTypes(),
        databaseService.getAllAllocations()
      ]);
      
      setExpenses(expensesData);
      setCategories(categoriesData);
      setPaymentTypes(paymentTypesData);
      setAllocations(allocationsData);
    } catch (error) {
      console.error('Error loading debug data:', error);
      Alert.alert('Error', 'Failed to load debug data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will delete ALL data from the database. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.clearAllData();
              Alert.alert('Success', 'All data cleared');
              loadAllData();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      // Use database service to parse YYYYMMDD format
      const date = databaseService.parseIdToDate(dateString);
      return date.toLocaleDateString('en-IN');
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Database Debug</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={loadAllData} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={clearAllData} style={styles.clearButton}>
            <Ionicons name="trash" size={20} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Summary</Text>
          <Text style={[styles.summaryText, { color: theme.colors.textSecondary }]}>
            Expenses: {expenses.length} | Categories: {categories.length} | Payment Types: {paymentTypes.length} | Allocations: {allocations.length}
          </Text>
        </View>

        {/* Expenses */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Expenses ({expenses.length})
          </Text>
          {expenses.map((expense, index) => (
            <View key={expense.expense_id} style={[styles.item, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.itemHeader}>
                <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
                  {expense.note || 'No note'} - {expense.expense_type}
                </Text>
                <Text style={[styles.itemAmount, { color: theme.colors.primary }]}>
                  {formatAmount(expense.amount)}
                </Text>
              </View>
              <Text style={[styles.itemDetails, { color: theme.colors.textSecondary }]}>
                Date: {formatDate(expense.date)} | Split: {expense.split} | ID: {expense.expense_id}
              </Text>
            </View>
          ))}
          {expenses.length === 0 && (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No expenses found
            </Text>
          )}
        </View>

        {/* Categories */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Categories ({categories.length})
          </Text>
          {categories.map((category) => (
            <View key={category.id} style={[styles.item, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
                {category.name} ({category.expense_type})
              </Text>
              <Text style={[styles.itemDetails, { color: theme.colors.textSecondary }]}>
                ID: {category.id}
              </Text>
            </View>
          ))}
        </View>

        {/* Payment Types */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Payment Types ({paymentTypes.length})
          </Text>
          {paymentTypes.map((paymentType) => (
            <View key={paymentType.id} style={[styles.item, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
                {paymentType.name}
              </Text>
              <Text style={[styles.itemDetails, { color: theme.colors.textSecondary }]}>
                ID: {paymentType.id}
              </Text>
            </View>
          ))}
        </View>

        {/* Allocations */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Allocations ({allocations.length})
          </Text>
          {allocations.map((allocation) => (
            <View key={allocation.id} style={[styles.item, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
                Month: {allocation.id}
              </Text>
              <Text style={[styles.itemDetails, { color: theme.colors.textSecondary }]}>
                Need: {formatAmount(allocation.need_amount)} | Want: {formatAmount(allocation.want_amount)} | Invest: {formatAmount(allocation.invest_amount)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
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
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  clearButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    textAlign: 'center',
  },
  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemDetails: {
    fontSize: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});
