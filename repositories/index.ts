// Export all repositories
export { categoryRepository } from './categoryRepository';
export { paymentTypeRepository } from './paymentTypeRepository';
export { allocationRepository } from './allocationRepository';
export { expenseRepository } from './expenseRepository';

// Export all interfaces
export type { Category } from './categoryRepository';
export type { PaymentType } from './paymentTypeRepository';
export type { Allocation } from './allocationRepository';
export type { Expense, ExpenseWithDetails } from './expenseRepository';
