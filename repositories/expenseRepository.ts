import * as SQLite from 'expo-sqlite';
import { dataUpdateEmitter } from '../services/databaseService';

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

class ExpenseRepository {
  private db: SQLite.SQLiteDatabase | null = null;

  setDatabase(db: SQLite.SQLiteDatabase) {
    this.db = db;
  }

  async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `
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
    `;

    await this.db.execAsync(sql);
  }

  async addExpense(expense: Omit<Expense, 'expense_id'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.runAsync(
      `INSERT INTO expense (amount, date, expense_type, category_id, payment_type_id, split, note) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [expense.amount, expense.date, expense.expense_type, expense.category_id, 
       expense.payment_type_id, expense.split, expense.note || null]
    );
    
    // Emit data update event
    dataUpdateEmitter.emit();
    
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
       expense.payment_type_id, expense.split, expense.note || null, expenseId]
    );
    
    // Emit data update event
    dataUpdateEmitter.emit();
  }

  async deleteExpense(expenseId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'DELETE FROM expense WHERE expense_id = ?',
      [expenseId]
    );
    
    // Emit data update event
    dataUpdateEmitter.emit();
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

  // Analytics and totals
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

  // Utility functions
  formatDateToId(date: Date): string {
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  }

  parseIdToDate(dateId: string): Date {
    const year = parseInt(dateId.substring(0, 4));
    const month = parseInt(dateId.substring(4, 6)) - 1;
    const day = parseInt(dateId.substring(6, 8));
    return new Date(year, month, day);
  }
}

export const expenseRepository = new ExpenseRepository();
