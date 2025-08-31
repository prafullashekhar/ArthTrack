export const APP_NAME = 'Arth Track';
export const APP_FULL_NAME = 'Arth Track App';

// App Subtitle
export const APP_SUBTITLE = 'Daily → Monthly expense tracking';

// Summary Labels
export const LABELS = {
  TOTAL_BUDGET: 'Total Budget',
  SPENT: 'Spent',
  REMAINING: 'Remaining',
} as const;

// Expense Types
export const EXPENSE_TYPES = {
  NEED: 'Need',
  WANT: 'Want',
  INVEST: 'Invest',
} as const;

// Currency
export const CURRENCY = {
  SYMBOL: '₹',
  CODE: 'INR',
} as const;

// Common Actions
export const ACTIONS = {
  ADD: 'Add',
  EDIT: 'Edit',
  DELETE: 'Delete',
  SAVE: 'Save',
  CANCEL: 'Cancel',
} as const;

// Common Messages
export const MESSAGES = {
  DELETE_CONFIRMATION: 'Are you sure you want to delete',
  FILL_REQUIRED_FIELDS: 'Please fill all required fields',
  ENTER_VALID_AMOUNT: 'Please enter a valid amount',
  SELECT_VALID_SPLIT: 'Please select a valid split value',
} as const;
