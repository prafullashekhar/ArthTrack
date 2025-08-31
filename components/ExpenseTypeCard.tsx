import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { EXPENSE_TYPE_COLORS, EXPENSE_TYPE_ICONS } from '@/constants/defaultCategories';
import { CURRENCY, LABELS } from '@/constants/appConstants';
import { ExpenseTypeData } from '@/types/expense';

interface ExpenseTypeCardProps {
  data: ExpenseTypeData;
}

export default function ExpenseTypeCard({ data }: ExpenseTypeCardProps) {
  const progressPercentage = data.allocated > 0 ? (data.spent / data.allocated) * 100 : 0;
  
  const getTypeColors = (type: string): readonly [string, string] => {
    const typeData = EXPENSE_TYPE_COLORS[type as keyof typeof EXPENSE_TYPE_COLORS];
    if (typeData) {
      return typeData.gradient;
    }
    return ['#6B7280', '#4B5563'] as const;
  };
  
  // Convert hex color to rgba with 50% opacity for background
  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };
  
  // Get colors based on expense type background color
  const typeColor = getTypeColors(data.type)[0];
  const iconBackgroundColor = hexToRgba(typeColor, 0.5);
  const iconColor = typeColor;
  
  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'Need':
        return 'Essential expenses';
      case 'Want':
        return 'Lifestyle expenses';
      case 'Invest':
        return 'Future planning';
      default:
        return '';
    }
  };
  
  const handlePress = () => {
    router.push({
      pathname: '/expense-details',
      params: { type: data.type }
    });
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <View style={[styles.card, { borderLeftColor: getTypeColors(data.type)[0] }]}>
        <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: iconBackgroundColor }]}>
              {React.createElement(EXPENSE_TYPE_ICONS[data.type], {
                width: 20,
                height: 20,
                fill: iconColor,
                color: iconColor
              })}
            </View>
          <View style={styles.titleSection}>
            <Text style={styles.title}>{data.type}</Text>
            <Text style={styles.description}>{getTypeDescription(data.type)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        </View>
        
        <View style={styles.bottomSection}>
          <View style={styles.amountSection}>
            <Text style={styles.spentAmount}>
              {CURRENCY.SYMBOL}{Number(data.remaining).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}
            </Text>
            <Text style={styles.totalAmount}>
              of {CURRENCY.SYMBOL}{Number(data.allocated).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}
            </Text>
          </View>
          
          <View style={styles.progressSection}>
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${Math.min(progressPercentage, 100)}%`,
                      backgroundColor: getTypeColors(data.type)[0]
                    }
                  ]} 
                />
              </View>
            </View>
            <Text style={styles.progressText}>{Math.round(progressPercentage)}% used</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
    color: 'white',
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  bottomSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountSection: {
    flex: 1,
  },
  spentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  progressSection: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 0,
    marginRight: 8,
  },
  progressContainer: {
    width: 100,
    marginBottom: 4,
  },
  progressBackground: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});