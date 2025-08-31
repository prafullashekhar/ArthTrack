import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_CATEGORIES } from '@/constants/defaultCategories';
import { Category, Expense, ExpenseType, MonthlyAllocation, PaymentType } from '@/types/expense';

interface ExpenseStore {
  expenses: Expense[];
  categories: Category[];
  monthlyAllocations: MonthlyAllocation[];
  paymentTypes: PaymentType[];
  
  // Actions
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;
  
  addCategory: (name: string, expenseType: ExpenseType) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  
  addPaymentType: (name: string) => void;
  updatePaymentType: (id: string, name: string) => void;
  deletePaymentType: (id: string) => void;
  
  setMonthlyAllocation: (allocation: Omit<MonthlyAllocation, 'month'>) => void;
  getCurrentMonthAllocation: () => MonthlyAllocation;
  
  // Getters
  getExpensesByType: (type: ExpenseType) => Expense[];
  getExpensesByMonth: (month: string) => Expense[];
  getCategoriesByType: (type: ExpenseType) => Category[];
  getTotalSpentByType: (type: ExpenseType, month?: string) => number;
  getPaymentTypes: () => PaymentType[];
  
  // Initialize
  initializeCategories: () => void;
  initializePaymentTypes: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const useExpenseStore = create<ExpenseStore>()(
  persist(
    (set, get) => ({
      expenses: [],
      categories: [],
      monthlyAllocations: [],
      paymentTypes: [],

      addExpense: (expense) => {
        const finalAmount = expense.amount / expense.split;
        const newExpense: Expense = {
          ...expense,
          amount: finalAmount,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          expenses: [...state.expenses, newExpense],
        }));
      },

      deleteExpense: (id) => {
        set((state) => ({
          expenses: state.expenses.filter((expense) => expense.id !== id),
        }));
      },

      addCategory: (name, expenseType) => {
        const newCategory: Category = {
          id: generateId(),
          name,
          expenseType,
        };
        set((state) => ({
          categories: [...state.categories, newCategory],
        }));
      },

      updateCategory: (id, name) => {
        set((state) => ({
          categories: state.categories.map((category) =>
            category.id === id ? { ...category, name } : category
          ),
        }));
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((category) => category.id !== id),
        }));
      },

      addPaymentType: (name) => {
        const newPaymentType: PaymentType = {
          id: generateId(),
          name,
        };
        set((state) => ({
          paymentTypes: [...state.paymentTypes, newPaymentType],
        }));
      },

      updatePaymentType: (id, name) => {
        set((state) => ({
          paymentTypes: state.paymentTypes.map((paymentType) =>
            paymentType.id === id ? { ...paymentType, name } : paymentType
          ),
        }));
      },

      deletePaymentType: (id) => {
        set((state) => ({
          paymentTypes: state.paymentTypes.filter((paymentType) => paymentType.id !== id),
        }));
      },

      setMonthlyAllocation: (allocation) => {
        const month = getCurrentMonth();
        set((state) => {
          const existingIndex = state.monthlyAllocations.findIndex(
            (a) => a.month === month
          );
          
          if (existingIndex >= 0) {
            const updated = [...state.monthlyAllocations];
            updated[existingIndex] = { ...allocation, month };
            return { monthlyAllocations: updated };
          } else {
            return {
              monthlyAllocations: [...state.monthlyAllocations, { ...allocation, month }],
            };
          }
        });
      },

      getCurrentMonthAllocation: () => {
        const month = getCurrentMonth();
        const allocation = get().monthlyAllocations.find((a) => a.month === month);
        return allocation || { Need: 0, Want: 0, Invest: 0, month };
      },

      getExpensesByType: (type) => {
        return get().expenses.filter((expense) => expense.expenseType === type);
      },

      getExpensesByMonth: (month) => {
        return get().expenses.filter((expense) => expense.date.startsWith(month));
      },

      getCategoriesByType: (type) => {
        return get().categories.filter((category) => category.expenseType === type);
      },

      getPaymentTypes: () => {
        return get().paymentTypes;
      },

      getTotalSpentByType: (type, month) => {
        const expenses = get().expenses.filter((expense) => {
          const matchesType = expense.expenseType === type;
          const matchesMonth = month ? expense.date.startsWith(month) : true;
          return matchesType && matchesMonth;
        });
        return expenses.reduce((total, expense) => total + expense.amount, 0);
      },

      initializeCategories: () => {
        const existingCategories = get().categories;
        if (existingCategories.length === 0) {
          const categories: Category[] = [];
          
          Object.entries(DEFAULT_CATEGORIES).forEach(([type, categoryNames]) => {
            categoryNames.forEach((name) => {
              categories.push({
                id: generateId(),
                name,
                expenseType: type as ExpenseType,
              });
            });
          });
          
          set({ categories });
        }
      },

      initializePaymentTypes: () => {
        const existingPaymentTypes = get().paymentTypes;
        if (existingPaymentTypes.length === 0) {
          const defaultPaymentType: PaymentType = {
            id: generateId(),
            name: 'Cash',
          };
          set({ paymentTypes: [defaultPaymentType] });
        }
      },
    }),
    {
      name: 'expense-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);