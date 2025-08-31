import * as SQLite from 'expo-sqlite';

export interface PaymentType {
  id: number;
  name: string;
  is_active: number;
}

class PaymentTypeRepository {
  private db: SQLite.SQLiteDatabase | null = null;

  setDatabase(db: SQLite.SQLiteDatabase) {
    this.db = db;
  }

  async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `
      CREATE TABLE IF NOT EXISTS payment_type (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          is_active INTEGER DEFAULT 1
      );
    `;

    await this.db.execAsync(sql);
  }

  async insertDefaultData() {
    if (!this.db) throw new Error('Database not initialized');

    // Check if data already exists
    const paymentTypeCount = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM payment_type');
    if ((paymentTypeCount as any)?.count > 0) return;

    // Insert default payment types
    const defaultPaymentTypes = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Digital Wallet'];
    for (const paymentType of defaultPaymentTypes) {
      await this.db.runAsync(
        'INSERT INTO payment_type (name) VALUES (?)',
        [paymentType]
      );
    }

    console.log('Default payment types inserted successfully');
  }

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
}

export const paymentTypeRepository = new PaymentTypeRepository();
