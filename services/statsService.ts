import { databaseService } from './databaseService';

export interface AvailableBalance {
  need: number;
  want: number;
  total: number;
}

class StatsService {
  /**
   * Calculate total available balance for Need and Want categories across all months
   * Available balance = Sum of (allocated - spent) for previous months (excluding current month)
   */
  async calculateTotalAvailableBalance(): Promise<AvailableBalance> {
    try {
      const allAllocations = await databaseService.getAllAllocations();
      const allExpenses = await databaseService.getAllExpenses();
      const currentMonthId = this.getCurrentMonthId();
  
      if (allAllocations.length === 0) {
        return { need: 0, want: 0, total: 0 };
      }
  
      // ✅ Sort allocations by id (ascending)
      const sortedAllocations = [...allAllocations].sort((a, b) => a.id - b.id);
  
      const startMonthId = sortedAllocations[0].id;
  
      let totalNeedAllocated = 0;
      let totalWantAllocated = 0;
  
      let i = 0; // pointer into allocations
  
      // Traverse from startMonth to currentMonth (exclusive)
      let month = startMonthId;
      while (month < currentMonthId) {
        // Move i if next allocation exists and is <= this month
        while (i + 1 < sortedAllocations.length && sortedAllocations[i + 1].id <= month) {
          i++;
        }
  
        totalNeedAllocated += sortedAllocations[i].need_amount;
        totalWantAllocated += sortedAllocations[i].want_amount;
  
        // Go to next month
        month = this.getNextMonthId(month);
      }
  
      // ✅ Extract month_id from expense.date (YYYYMMDD → YYYYMM)
      const expensesWithMonthId = allExpenses.map(e => ({
        ...e,
        month_id: parseInt(e.date.substring(0, 6))
      }));
  
      // ✅ Sum all expenses from startMonthId to currentMonth (exclusive)
      const totalNeedSpent = expensesWithMonthId
        .filter(e => e.expense_type === 'Need' && e.month_id >= startMonthId && e.month_id < currentMonthId)
        .reduce((sum, e) => sum + (e.amount / (e.split || 1)), 0);
  
      const totalWantSpent = expensesWithMonthId
        .filter(e => e.expense_type === 'Want' && e.month_id >= startMonthId && e.month_id < currentMonthId)
        .reduce((sum, e) => sum + (e.amount / (e.split || 1)), 0);
  
      // ✅ Available balances
      const totalNeedAvailable = totalNeedAllocated - totalNeedSpent;
      const totalWantAvailable = totalWantAllocated - totalWantSpent;
  
      return {
        need: totalNeedAvailable,
        want: totalWantAvailable,
        total: totalNeedAvailable + totalWantAvailable
      };
  
    } catch (error) {
      console.error("Error calculating total available balance:", error);
      return { need: 0, want: 0, total: 0 };
    }
  }

  /**
   * Get allocation object for a specific month
   * Returns the allocation record with the largest ID that is less than or equal to the given month ID
   */
  async getAllocationForMonth(monthId: number): Promise<{
    id: number;
    need_amount: number;
    want_amount: number;
    invest_amount: number;
    created_at: string;
  } | null> {
    try {
      const allAllocations = await databaseService.getAllAllocations();
      
      if (allAllocations.length === 0) {
        return null;
      }
      
      // Sort allocations by month ID (descending)
      const sortedAllocations = allAllocations.sort((a, b) => b.id - a.id);
      
      // Find allocation for the specific month
      let allocation = sortedAllocations.find(a => a.id === monthId);
      
      // If no allocation for the month, find the most recent one before that month
      if (!allocation) {
        allocation = sortedAllocations.find(a => a.id < monthId);
      }
      
      return allocation || null;
    } catch (error) {
      console.error('Error getting allocation for month:', error);
      return null;
    }
  }

  /**
   * Group expenses by month for easier processing
   */
  private groupExpensesByMonth(expenses: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    
    for (const expense of expenses) {
      const monthId = expense.date.substring(0, 6); // Extract YYYYMM from YYYYMMDD
      if (!grouped[monthId]) {
        grouped[monthId] = [];
      }
      grouped[monthId].push(expense);
    }
    
    return grouped;
  }

  /**
   * Get current month ID in YYYYMM format
   */
  private getCurrentMonthId(): number {
    const now = new Date();
    return parseInt(`${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`);
  }

  /**
   * Get next month ID from current month ID
   */
  private getNextMonthId(currentMonthId: number): number {
    const year = Math.floor(currentMonthId / 100);
    const month = currentMonthId % 100;
    
    if (month === 12) {
      // December -> January of next year
      return (year + 1) * 100 + 1;
    } else {
      // Next month of same year
      return currentMonthId + 1;
    }
  }
}

export const statsService = new StatsService();
