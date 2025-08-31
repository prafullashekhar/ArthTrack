import * as SQLite from 'expo-sqlite';
import { 
  categoryRepository, 
  paymentTypeRepository, 
  allocationRepository, 
  expenseRepository 
} from '../repositories';

// Event emitter for data updates
class DataUpdateEmitter {
  private listeners: (() => void)[] = [];

  subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  emit() {
    this.listeners.forEach(listener => listener());
  }
}

export const dataUpdateEmitter = new DataUpdateEmitter();

// Re-export interfaces for convenience
export type { Category } from '../repositories/categoryRepository';
export type { PaymentType } from '../repositories/paymentTypeRepository';
export type { Allocation } from '../repositories/allocationRepository';
export type { Expense, ExpenseWithDetails } from '../repositories/expenseRepository';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initializeDatabase() {
    try {
      this.db = await SQLite.openDatabaseAsync('ArthTrack.db');
      
      // Set database reference in all repositories
      categoryRepository.setDatabase(this.db);
      paymentTypeRepository.setDatabase(this.db);
      allocationRepository.setDatabase(this.db);
      expenseRepository.setDatabase(this.db);
      
      // Create tables
      await this.createTables();
      await this.insertDefaultData();
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    // Create tables using individual repositories
    await categoryRepository.createTables();
    await paymentTypeRepository.createTables();
    await allocationRepository.createTables();
    await expenseRepository.createTables();
  }

  private async insertDefaultData() {
    if (!this.db) throw new Error('Database not initialized');

    // Insert default data using individual repositories
    await categoryRepository.insertDefaultData();
    await paymentTypeRepository.insertDefaultData();
  }

  // ===============================
  // CATEGORY OPERATIONS
  // ===============================
  getCategories = categoryRepository.getCategories.bind(categoryRepository);
  getCategoriesByType = categoryRepository.getCategoriesByType.bind(categoryRepository);
  getCategoryById = categoryRepository.getCategoryById.bind(categoryRepository);
  addCategory = categoryRepository.addCategory.bind(categoryRepository);
  updateCategory = categoryRepository.updateCategory.bind(categoryRepository);
  deleteCategory = categoryRepository.deleteCategory.bind(categoryRepository);
  restoreCategory = categoryRepository.restoreCategory.bind(categoryRepository);
  getAllCategories = categoryRepository.getAllCategories.bind(categoryRepository);

  // ===============================
  // PAYMENT TYPE OPERATIONS
  // ===============================
  getPaymentTypes = paymentTypeRepository.getPaymentTypes.bind(paymentTypeRepository);
  getPaymentTypeById = paymentTypeRepository.getPaymentTypeById.bind(paymentTypeRepository);
  addPaymentType = paymentTypeRepository.addPaymentType.bind(paymentTypeRepository);
  updatePaymentType = paymentTypeRepository.updatePaymentType.bind(paymentTypeRepository);
  deletePaymentType = paymentTypeRepository.deletePaymentType.bind(paymentTypeRepository);
  restorePaymentType = paymentTypeRepository.restorePaymentType.bind(paymentTypeRepository);

  // ===============================
  // ALLOCATION OPERATIONS
  // ===============================
  getAllocation = allocationRepository.getAllocation.bind(allocationRepository);
  getCurrentMonthAllocation = allocationRepository.getCurrentMonthAllocation.bind(allocationRepository);
  getMostRecentAllocationForMonth = allocationRepository.getMostRecentAllocationForMonth.bind(allocationRepository);
  setAllocation = allocationRepository.setAllocation.bind(allocationRepository);
  updateCurrentMonthAllocation = allocationRepository.updateCurrentMonthAllocation.bind(allocationRepository);
  getAllAllocations = allocationRepository.getAllAllocations.bind(allocationRepository);
  getCurrentMonthId = allocationRepository.getCurrentMonthId.bind(allocationRepository);

  // ===============================
  // EXPENSE OPERATIONS
  // ===============================
  addExpense = expenseRepository.addExpense.bind(expenseRepository);
  getExpenseById = expenseRepository.getExpenseById.bind(expenseRepository);
  updateExpense = expenseRepository.updateExpense.bind(expenseRepository);
  deleteExpense = expenseRepository.deleteExpense.bind(expenseRepository);
  getExpensesByMonth = expenseRepository.getExpensesByMonth.bind(expenseRepository);
  getExpensesByTypeAndMonth = expenseRepository.getExpensesByTypeAndMonth.bind(expenseRepository);
  getExpensesByDateRange = expenseRepository.getExpensesByDateRange.bind(expenseRepository);
  getAllExpenses = expenseRepository.getAllExpenses.bind(expenseRepository);
  getExpensesByCategory = expenseRepository.getExpensesByCategory.bind(expenseRepository);
  getTotalSpentByType = expenseRepository.getTotalSpentByType.bind(expenseRepository);
  getTotalSpentByMonth = expenseRepository.getTotalSpentByMonth.bind(expenseRepository);
  getSpendingByCategory = expenseRepository.getSpendingByCategory.bind(expenseRepository);
  getMonthlySpendingTrend = expenseRepository.getMonthlySpendingTrend.bind(expenseRepository);
  formatDateToId = expenseRepository.formatDateToId.bind(expenseRepository);
  parseIdToDate = expenseRepository.parseIdToDate.bind(expenseRepository);

  // ===============================
  // DATABASE MAINTENANCE
  // ===============================

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.execAsync(`
      DELETE FROM expense;
      DELETE FROM allocation;
      DELETE FROM category WHERE id > 3; -- Keep default categories
      DELETE FROM payment_type WHERE id > 2; -- Keep default payment types
    `);
    
    // Re-insert default data
    await this.insertDefaultData();
  }

  async exportData(): Promise<{
    categories: any[],
    paymentTypes: any[],
    allocations: any[],
    expenses: any[]
  }> {
    if (!this.db) throw new Error('Database not initialized');
    
    const categories = await this.getAllCategories();
    const paymentTypes = await this.getPaymentTypes();
    const allocations = await this.getAllAllocations();
    const expenses = await this.getAllExpenses();
    
    return {
      categories,
      paymentTypes,
      allocations,
      expenses
    };
  }

  async getDatabaseStats(): Promise<{
    totalExpenses: number,
    totalCategories: number,
    totalPaymentTypes: number,
    currentMonthExpenses: number,
    databaseSize: string
  }> {
    if (!this.db) throw new Error('Database not initialized');
    
    const totalExpenses = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM expense');
    const totalCategories = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM category WHERE is_active = 1');
    const totalPaymentTypes = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM payment_type WHERE is_active = 1');
    
    const currentMonth = this.getCurrentMonthId();
    const currentMonthExpenses = await this.db.getFirstAsync(
      'SELECT COUNT(*) as count FROM expense WHERE date LIKE ?',
      [`${currentMonth}%`]
    );
    
    return {
      totalExpenses: (totalExpenses as any)?.count || 0,
      totalCategories: (totalCategories as any)?.count || 0,
      totalPaymentTypes: (totalPaymentTypes as any)?.count || 0,
      currentMonthExpenses: (currentMonthExpenses as any)?.count || 0,
      databaseSize: 'Calculating...' // Would need platform-specific code to get actual size
    };
  }
}

export const databaseService = new DatabaseService();
