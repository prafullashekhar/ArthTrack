export interface Category {
    id: string;
    name: string;
    expenseType: ExpenseType;
  }
  
  export type ExpenseType = 'Need' | 'Want' | 'Invest';
  
  export interface Expense {
    id: string;
    amount: number;
    category: string;
    expenseType: ExpenseType;
    date: string;
    paymentType: string;
    split: number;
    note?: string;
    createdAt: string;
  }
  
  export interface PaymentType {
    id: string;
    name: string;
  }
  
  export interface MonthlyAllocation {
    Need: number;
    Want: number;
    Invest: number;
    month: string; // YYYY-MM format
  }
  
  export interface ExpenseTypeData {
    type: ExpenseType;
    allocated: number;
    spent: number;
    remaining: number;
    color: string;
    gradient: readonly [string, string, ...string[]];
  }