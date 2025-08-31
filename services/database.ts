import * as SQLite from 'expo-sqlite';
import { DEFAULT_CATEGORIES } from '@/constants/defaultCategories';

export interface Category {
  id: number;
  name: string;
  expense_type: string;
  is_active: number;
}

export interface PaymentType {
  id: number;
  name: string;
  is_active: number;
}

export interface Allocation {
  id: number; // YYYYMM format
  need_amount: number;
  want_amount: number;
  invest_amount: number;
  created_at: string;
}

export interface Expense {
  expense_id: number;
  amount: number;
  date: string; // YYYYMMDD format
  expense_type: string;
  category_id: number;
  payment_type_id: number;
  split: number;
  note?: string;
}

export interface ExpenseWithDetails extends Expense {
  category_name: string;
  payment_type_name: string;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initializeDatabase() {
    try {
      this.db = await SQLite.openDatabaseAsync('ArthTrack.db');
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

    const sql = `
      -- Table: category
      CREATE TABLE IF NOT EXISTS category (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          expense_type TEXT NOT NULL,
          is_active INTEGER DEFAULT 1
      );

      -- Table: payment_type
      CREATE TABLE IF NOT EXISTS payment_type (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          is_active INTEGER DEFAULT 1
      );

      -- Table: allocation
      CREATE TABLE IF NOT EXISTS allocation (
          id INTEGER PRIMARY KEY,
          need_amount REAL NOT NULL DEFAULT 0,
          want_amount REAL NOT NULL DEFAULT 0,
          invest_amount REAL NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Table: expense
      CREATE TABLE IF NOT EXISTS expense (
          expense_id INTEGER PRIMARY KEY AUTOINCREMENT,
          amount REAL NOT NULL,
          date TEXT NOT NULL,
          expense_type TEXT NOT NULL,
          category_id INTEGER,
          payment_type_id INTEGER,
          split INTEGER DEFAULT 1,
          note TEXT,
          FOREIGN KEY (category_id) REFERENCES category(id),
          FOREIGN KEY (payment_type_id) REFERENCES payment_type(id)
      );

      -- Indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_expense_date ON expense(date);
      CREATE INDEX IF NOT EXISTS idx_expense_type ON expense(expense_type);
      CREATE INDEX IF NOT EXISTS idx_expense_category ON expense(category_id);
      CREATE INDEX IF NOT EXISTS idx_category_type ON category(expense_type);
    `;

    await this.db.execAsync(sql);
  }

  private async insertDefaultData() {
    if (!this.db) throw new Error('Database not initialized');

    // Check if data already exists
    const categoryCount = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM category');
    if ((categoryCount as any)?.count > 0) return;

    // Insert default categories
    for (const [expenseType, categories] of Object.entries(DEFAULT_CATEGORIES)) {
      for (const categoryName of categories) {
        await this.db.runAsync(
          'INSERT INTO category (name, expense_type) VALUES (?, ?)',
          [categoryName, expenseType]
        );
      }
    }

    // Insert default payment types
    const defaultPaymentTypes = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Digital Wallet'];
    for (const paymentType of defaultPaymentTypes) {
      await this.db.runAsync(
        'INSERT INTO payment_type (name) VALUES (?)',
        [paymentType]
      );
    }

    console.log('Default data inserted successfully');
  }

  // ===============================
  // CATEGORY CRUD OPERATIONS
  // ===============================

  async getCategories(): Promise<Category[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllAsync(
      'SELECT * FROM category WHERE is_active = 1 ORDER BY expense_type, name'
    ) as Category[];
  }

  async getCategoriesByType(expenseType: string): Promise<Category[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllAsync(
      'SELECT * FROM category WHERE expense_type = ? AND is_active = 1 ORDER BY name',
      [expenseType]
    ) as Category[];
  }

  async getCategoryById(id: number): Promise<Category | null> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getFirstAsync(
      'SELECT * FROM category WHERE id = ?',
      [id]
    ) as Category | null;
  }

  async addCategory(name: string, expenseType: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.runAsync(
      'INSERT INTO category (name, expense_type) VALUES (?, ?)',
      [name, expenseType]
    );
    return result.lastInsertRowId;
  }

  async updateCategory(id: number, name: string, expenseType: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'UPDATE category SET name = ?, expense_type = ? WHERE id = ?',
      [name, expenseType, id]
    );
  }

  async deleteCategory(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    // Soft delete - just mark as inactive
    await this.db.runAsync(
      'UPDATE category SET is_active = 0 WHERE id = ?',
      [id]
    );
  }

  async restoreCategory(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'UPDATE category SET is_active = 1 WHERE id = ?',
      [id]
    );
  }

  // ===============================
  // PAYMENT TYPE CRUD OPERATIONS
  // ===============================

  async getPaymentTypes(): Promise<PaymentType[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllAsync(
      'SELECT * FROM payment_type WHERE is_active = 1 ORDER BY name'
    ) as PaymentType[];
  }

  async getPaymentTypeById(id: number): Promise<PaymentType | null> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getFirstAsync(
      'SELECT * FROM payment_type WHERE id = ?',
      [id]
    ) as PaymentType | null;
  }

  async addPaymentType(name: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.runAsync(
      'INSERT INTO payment_type (name) VALUES (?)',
      [name]
    );
    return result.lastInsertRowId;
  }

  async updatePaymentType(id: number, name: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'UPDATE payment_type SET name = ? WHERE id = ?',
      [name, id]
    );
  }

  async deletePaymentType(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    // Soft delete - just mark as inactive
    await this.db.runAsync(
      'UPDATE payment_type SET is_active = 0 WHERE id = ?',
      [id]
    );
  }

  async restorePaymentType(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'UPDATE payment_type SET is_active = 1 WHERE id = ?',
      [id]
    );
  }

  // ===============================
  // ALLOCATION CRUD OPERATIONS
  // ===============================

  async getAllocation(monthId: number): Promise<Allocation | null> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getFirstAsync(
      'SELECT * FROM allocation WHERE id = ?',
      [monthId]
    ) as Allocation | null;
  }

  async getCurrentMonthAllocation(): Promise<Allocation> {
    const monthId = this.getCurrentMonthId();
    const allocation = await this.getAllocation(monthId);
    
    if (!allocation) {
      // Return default allocation if none exists
      return {
        id: monthId,
        need_amount: 0,
        want_amount: 0,
        invest_amount: 0,
        created_at: new Date().toISOString()
      };
    }
    
    return allocation;
  }

  async setAllocation(monthId: number, needAmount: number, wantAmount: number, investAmount: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      `INSERT OR REPLACE INTO allocation (id, need_amount, want_amount, invest_amount) 
       VALUES (?, ?, ?, ?)`,
      [monthId, needAmount, wantAmount, investAmount]
    );
  }

  async updateAllocation(monthId: number, needAmount: number, wantAmount: number, investAmount: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'UPDATE allocation SET need_amount = ?, want_amount = ?, invest_amount = ? WHERE id = ?',
      [needAmount, wantAmount, investAmount, monthId]
    );
  }

  async updateCurrentMonthAllocation(allocation: { need_amount: number, want_amount: number, invest_amount: number }): Promise<void> {
    const currentMonthId = this.getCurrentMonthId();
    // Use setAllocation which handles INSERT OR REPLACE to ensure the record exists
    await this.setAllocation(currentMonthId, allocation.need_amount, allocation.want_amount, allocation.invest_amount);
  }

  async deleteAllocation(monthId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'DELETE FROM allocation WHERE id = ?',
      [monthId]
    );
  }

  async getAllAllocations(): Promise<Allocation[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllAsync(
      'SELECT * FROM allocation ORDER BY id DESC'
    ) as Allocation[];
  }

  // ===============================
  // EXPENSE CRUD OPERATIONS
  // ===============================

  async addExpense(expense: Omit<Expense, 'expense_id'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.runAsync(
      `INSERT INTO expense (amount, date, expense_type, category_id, payment_type_id, split, note) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [expense.amount, expense.date, expense.expense_type, expense.category_id, expense.payment_type_id, expense.split, expense.note]
    );
    return result.lastInsertRowId;
  }

  async getExpenseById(expenseId: number): Promise<ExpenseWithDetails | null> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getFirstAsync(
      `SELECT e.*, c.name as category_name, p.name as payment_type_name
       FROM expense e
       LEFT JOIN category c ON e.category_id = c.id
       LEFT JOIN payment_type p ON e.payment_type_id = p.id
       WHERE e.expense_id = ?`,
      [expenseId]
    ) as ExpenseWithDetails | null;
  }

  async updateExpense(expenseId: number, expense: Omit<Expense, 'expense_id'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      `UPDATE expense SET amount = ?, date = ?, expense_type = ?, category_id = ?, 
       payment_type_id = ?, split = ?, note = ? WHERE expense_id = ?`,
      [expense.amount, expense.date, expense.expense_type, expense.category_id, 
       expense.payment_type_id, expense.split, expense.note, expenseId]
    );
  }

  async deleteExpense(expenseId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'DELETE FROM expense WHERE expense_id = ?',
      [expenseId]
    );
  }

  async getExpensesByMonth(monthId: number): Promise<ExpenseWithDetails[]> {
    if (!this.db) throw new Error('Database not initialized');
    const monthStr = monthId.toString();
    return await this.db.getAllAsync(
      `SELECT e.*, c.name as category_name, p.name as payment_type_name
       FROM expense e
       LEFT JOIN category c ON e.category_id = c.id
       LEFT JOIN payment_type p ON e.payment_type_id = p.id
       WHERE e.date LIKE ? 
       ORDER BY e.date DESC, e.expense_id DESC`,
      [`${monthStr}%`]
    ) as ExpenseWithDetails[];
  }

  async getExpensesByTypeAndMonth(expenseType: string, monthId: number): Promise<ExpenseWithDetails[]> {
    if (!this.db) throw new Error('Database not initialized');
    const monthStr = monthId.toString();
    return await this.db.getAllAsync(
      `SELECT e.*, c.name as category_name, p.name as payment_type_name
       FROM expense e
       LEFT JOIN category c ON e.category_id = c.id
       LEFT JOIN payment_type p ON e.payment_type_id = p.id
       WHERE e.expense_type = ? AND e.date LIKE ? 
       ORDER BY e.date DESC, e.expense_id DESC`,
      [expenseType, `${monthStr}%`]
    ) as ExpenseWithDetails[];
  }

  async getExpensesByDateRange(startDate: string, endDate: string): Promise<ExpenseWithDetails[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllAsync(
      `SELECT e.*, c.name as category_name, p.name as payment_type_name
       FROM expense e
       LEFT JOIN category c ON e.category_id = c.id
       LEFT JOIN payment_type p ON e.payment_type_id = p.id
       WHERE e.date BETWEEN ? AND ? 
       ORDER BY e.date DESC, e.expense_id DESC`,
      [startDate, endDate]
    ) as ExpenseWithDetails[];
  }

  async getAllExpenses(): Promise<ExpenseWithDetails[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllAsync(
      `SELECT e.*, c.name as category_name, p.name as payment_type_name
       FROM expense e
       LEFT JOIN category c ON e.category_id = c.id
       LEFT JOIN payment_type p ON e.payment_type_id = p.id
       ORDER BY e.date DESC, e.expense_id DESC`
    ) as ExpenseWithDetails[];
  }

  async getAllCategories(): Promise<Category[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllAsync(
      'SELECT * FROM category WHERE is_active = 1 ORDER BY expense_type, name'
    ) as Category[];
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM expense');
    await this.db.runAsync('DELETE FROM allocation');
    await this.db.runAsync('DELETE FROM category WHERE id > 3'); // Keep default categories
    await this.db.runAsync('DELETE FROM payment_type WHERE id > 2'); // Keep default payment types
  }

  async getExpensesByCategory(categoryId: number, monthId?: number): Promise<ExpenseWithDetails[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    let query = `SELECT e.*, c.name as category_name, p.name as payment_type_name
                 FROM expense e
                 LEFT JOIN category c ON e.category_id = c.id
                 LEFT JOIN payment_type p ON e.payment_type_id = p.id
                 WHERE e.category_id = ?`;
    
    const params: any[] = [categoryId];
    
    if (monthId) {
      query += ' AND e.date LIKE ?';
      params.push(`${monthId}%`);
    }
    
    query += ' ORDER BY e.date DESC, e.expense_id DESC';
    
    return await this.db.getAllAsync(query, params) as ExpenseWithDetails[];
  }

  // ===============================
  // ANALYTICS AND TOTALS
  // ===============================

  async getTotalSpentByType(expenseType: string, monthId: number): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const monthStr = monthId.toString();
    const result = await this.db.getFirstAsync(
      'SELECT COALESCE(SUM(amount / split), 0) as total FROM expense WHERE expense_type = ? AND date LIKE ?',
      [expenseType, `${monthStr}%`]
    );
    return (result as any)?.total || 0;
  }

  async getTotalSpentByMonth(monthId: number): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const monthStr = monthId.toString();
    const result = await this.db.getFirstAsync(
      'SELECT COALESCE(SUM(amount / split), 0) as total FROM expense WHERE date LIKE ?',
      [`${monthStr}%`]
    );
    return (result as any)?.total || 0;
  }

  async getSpendingByCategory(expenseType: string, monthId: number): Promise<Array<{category_name: string, total: number}>> {
    if (!this.db) throw new Error('Database not initialized');
    const monthStr = monthId.toString();
    return await this.db.getAllAsync(
      `SELECT c.name as category_name, COALESCE(SUM(e.amount / e.split), 0) as total
       FROM expense e
       JOIN category c ON e.category_id = c.id
       WHERE e.expense_type = ? AND e.date LIKE ?
       GROUP BY c.id, c.name
       ORDER BY total DESC`,
      [expenseType, `${monthStr}%`]
    ) as Array<{category_name: string, total: number}>;
  }

  async getMonthlySpendingTrend(expenseType?: string): Promise<Array<{month: string, total: number}>> {
    if (!this.db) throw new Error('Database not initialized');
    
    let query = `SELECT 
                   SUBSTR(date, 1, 6) as month,
                   COALESCE(SUM(amount / split), 0) as total
                 FROM expense`;
    
    const params: any[] = [];
    
    if (expenseType) {
      query += ' WHERE expense_type = ?';
      params.push(expenseType);
    }
    
    query += ' GROUP BY SUBSTR(date, 1, 6) ORDER BY month DESC LIMIT 12';
    
    return await this.db.getAllAsync(query, params) as Array<{month: string, total: number}>;
  }

  // ===============================
  // UTILITY FUNCTIONS
  // ===============================

  getCurrentMonthId(): number {
    const now = new Date();
    return parseInt(`${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`);
  }

  formatDateToId(date: Date): string {
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  }

  parseIdToDate(dateId: string): Date {
    const year = parseInt(dateId.substring(0, 4));
    const month = parseInt(dateId.substring(4, 6)) - 1;
    const day = parseInt(dateId.substring(6, 8));
    return new Date(year, month, day);
  }

  formatMonthId(monthId: number): string {
    const monthStr = monthId.toString();
    const year = monthStr.substring(0, 4);
    const month = monthStr.substring(4, 6);
    return `${year}-${month}`;
  }

  parseMonthId(monthStr: string): number {
    return parseInt(monthStr.replace('-', ''));
  }

  // ===============================
  // DATABASE MAINTENANCE
  // ===============================

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.execAsync(`
      DELETE FROM expense;
      DELETE FROM allocation;
      DELETE FROM category;
      DELETE FROM payment_type;
    `);
    
    // Re-insert default data
    await this.insertDefaultData();
  }

  async exportData(): Promise<{
    categories: Category[],
    paymentTypes: PaymentType[],
    allocations: Allocation[],
    expenses: ExpenseWithDetails[]
  }> {
    if (!this.db) throw new Error('Database not initialized');
    
    const categories = await this.getCategories();
    const paymentTypes = await this.getPaymentTypes();
    const allocations = await this.getAllAllocations();
    const expenses = await this.db.getAllAsync(`
      SELECT e.*, c.name as category_name, p.name as payment_type_name
      FROM expense e
      LEFT JOIN category c ON e.category_id = c.id
      LEFT JOIN payment_type p ON e.payment_type_id = p.id
      ORDER BY e.date DESC
    `) as ExpenseWithDetails[];
    
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
