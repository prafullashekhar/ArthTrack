import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/themeStore';
import { statsService, AvailableBalance } from '@/services/statsService';
import { EXPENSE_TYPE_COLORS } from '@/constants/defaultCategories';
import { dataUpdateEmitter } from '@/services/databaseService';

export default function StatsScreen() {
  const { theme } = useTheme();
  const [availableBalance, setAvailableBalance] = useState<AvailableBalance>({ need: 0, want: 0, total: 0 });
  const [totalInvested, setTotalInvested] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadStats();
    
    // Subscribe to data updates
    const unsubscribe = dataUpdateEmitter.subscribe(() => {
      loadStats(true); // Pass true to indicate this is an update
    });
    
    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const loadStats = async (isUpdate = false) => {
    try {
      if (isUpdate) {
        setUpdating(true);
      } else {
        setLoading(true);
      }
      
      const balance = await statsService.calculateTotalAvailableBalance();
      setAvailableBalance(balance);
      
      // Get total invested amount from all expenses
      const totalInvestedAmount = await statsService.calculateTotalInvestment();
      setTotalInvested(totalInvestedAmount);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      if (isUpdate) {
        setUpdating(false);
      } else {
        setLoading(false);
      }
    }
  };

  const formatAmount = (amount: number): string => {
    return `₹${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading statistics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Statistics</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Track your financial overview
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Available Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Ionicons name="wallet-outline" size={24} color={theme.colors.primary} />
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Available Balance</Text>
            </View>
            <TouchableOpacity onPress={() => loadStats(false)} style={styles.refreshButton}>
              {updating ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Ionicons name="refresh" size={20} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.balanceContent}>
            {/* Need Balance */}
            <View style={styles.balanceItem}>
              <View style={styles.balanceHeader}>
                <View style={[styles.categoryDot, { backgroundColor: EXPENSE_TYPE_COLORS.Need.color }]} />
                <Text style={[styles.categoryLabel, { color: theme.colors.textSecondary }]}>Need</Text>
              </View>
              <Text style={[styles.balanceAmount, { color: theme.colors.text }]}>
                {formatAmount(availableBalance.need)}
              </Text>
              <View style={[styles.balanceBar, { backgroundColor: theme.colors.border }]}>
                <View 
                  style={[
                    styles.balanceBarFill, 
                    { 
                      backgroundColor: EXPENSE_TYPE_COLORS.Need.color,
                      width: `${Math.min(100, (availableBalance.need / Math.max(availableBalance.total, 1)) * 100)}%`
                    }
                  ]} 
                />
              </View>
            </View>

            {/* Want Balance */}
            <View style={styles.balanceItem}>
              <View style={styles.balanceHeader}>
                <View style={[styles.categoryDot, { backgroundColor: EXPENSE_TYPE_COLORS.Want.color }]} />
                <Text style={[styles.categoryLabel, { color: theme.colors.textSecondary }]}>Want</Text>
              </View>
              <Text style={[styles.balanceAmount, { color: theme.colors.text }]}>
                {formatAmount(availableBalance.want)}
              </Text>
              <View style={[styles.balanceBar, { backgroundColor: theme.colors.border }]}>
                <View 
                  style={[
                    styles.balanceBarFill, 
                    { 
                      backgroundColor: EXPENSE_TYPE_COLORS.Want.color,
                      width: `${Math.min(100, (availableBalance.want / Math.max(availableBalance.total, 1)) * 100)}%`
                    }
                  ]} 
                />
              </View>
            </View>

            {/* Total Balance */}
            <View style={styles.totalBalanceContainer}>
              <View style={styles.totalBalanceHeader}>
                <Text style={[styles.totalBalanceLabel, { color: theme.colors.textSecondary }]}>Total Available</Text>
                <Ionicons name="trending-up-outline" size={20} color={theme.colors.primary} />
              </View>
              <Text style={[styles.totalBalanceAmount, { color: theme.colors.primary }]}>
                {formatAmount(availableBalance.total)}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={[styles.cardFooterText, { color: theme.colors.textSecondary }]}>
              💡 Available balance = Total allocated - Total spent (previous months only)
            </Text>
          </View>
        </View>

        {/* Investment Card */}
        <View style={[styles.investmentCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Ionicons name="trending-up" size={24} color={EXPENSE_TYPE_COLORS.Invest.color} />
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Total Investment</Text>
            </View>
            <TouchableOpacity onPress={() => loadStats(false)} style={styles.refreshButton}>
              {updating ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Ionicons name="refresh" size={20} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.investmentContent}>
            <View style={styles.investmentAmountContainer}>
              <Text style={[styles.investmentAmount, { color: EXPENSE_TYPE_COLORS.Invest.color }]}>
                {formatAmount(totalInvested)}
              </Text>
              <Text style={[styles.investmentLabel, { color: theme.colors.textSecondary }]}>
                Total Amount Invested
              </Text>
            </View>
            
            <View style={styles.investmentIconContainer}>
              <View style={[styles.investmentIconBackground, { backgroundColor: `${EXPENSE_TYPE_COLORS.Invest.color}20` }]}>
                <Ionicons name="rocket-outline" size={32} color={EXPENSE_TYPE_COLORS.Invest.color} />
              </View>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={[styles.cardFooterText, { color: theme.colors.textSecondary }]}>
              💡 Total of all investment expenses across all months
            </Text>
          </View>
        </View>

        {/* Placeholder for future stats */}
        <View style={[styles.placeholderCard, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="analytics-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.placeholderTitle, { color: theme.colors.text }]}>More Statistics Coming Soon</Text>
          <Text style={[styles.placeholderSubtitle, { color: theme.colors.textSecondary }]}>
            We're working on adding more detailed analytics and insights
          </Text>
        </View>
      </ScrollView>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  balanceContent: {
    gap: 20,
  },
  balanceItem: {
    gap: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  balanceBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  balanceBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  totalBalanceContainer: {
    marginTop: 16,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  totalBalanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalBalanceLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalBalanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  cardFooter: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  cardFooterText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  placeholderCard: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  investmentCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  investmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  investmentAmountContainer: {
    flex: 1,
  },
  investmentAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  investmentLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  investmentIconContainer: {
    marginLeft: 20,
  },
  investmentIconBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
