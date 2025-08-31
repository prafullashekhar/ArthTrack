import * as SQLite from 'expo-sqlite';
import { DEFAULT_CATEGORIES } from '@/constants/defaultCategories';

export interface Category {
  id: number;
  name: string;
  expense_type: string;
  is_active: number;
}

class CategoryRepository {
  private db: SQLite.SQLiteDatabase | null = null;

  setDatabase(db: SQLite.SQLiteDatabase) {
    this.db = db;
  }

  async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `
      CREATE TABLE IF NOT EXISTS category (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          expense_type TEXT NOT NULL,
          is_active INTEGER DEFAULT 1
      );
      
      CREATE INDEX IF NOT EXISTS idx_category_type ON category(expense_type);
    `;

    await this.db.execAsync(sql);
  }

  async insertDefaultData() {
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

    console.log('Default categories inserted successfully');
  }

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

  async getAllCategories(): Promise<Category[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllAsync(
      'SELECT * FROM category WHERE is_active = 1 ORDER BY expense_type, name'
    ) as Category[];
  }
}

export const categoryRepository = new CategoryRepository();
