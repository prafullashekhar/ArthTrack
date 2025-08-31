import * as SQLite from 'expo-sqlite';

export interface Allocation {
  id: number; // YYYYMM format
  need_amount: number;
  want_amount: number;
  invest_amount: number;
  created_at: string;
}

class AllocationRepository {
  private db: SQLite.SQLiteDatabase | null = null;

  setDatabase(db: SQLite.SQLiteDatabase) {
    this.db = db;
  }

  async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `
      CREATE TABLE IF NOT EXISTS allocation (
          id INTEGER PRIMARY KEY,
          need_amount REAL NOT NULL DEFAULT 0,
          want_amount REAL NOT NULL DEFAULT 0,
          invest_amount REAL NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await this.db.execAsync(sql);
  }

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

  getCurrentMonthId(): number {
    const now = new Date();
    return parseInt(`${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`);
  }
}

export const allocationRepository = new AllocationRepository();
