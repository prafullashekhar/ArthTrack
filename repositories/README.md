# Repository Pattern Implementation

This folder contains the repository layer for the ArthTrack application, implementing the Repository Pattern for clean separation of concerns and better maintainability.

## 🏗️ Architecture Overview

```
repositories/
├── index.ts                 # Central export file
├── categoryRepository.ts    # Category CRUD operations
├── paymentTypeRepository.ts # Payment type CRUD operations
├── allocationRepository.ts  # Budget allocation operations
├── expenseRepository.ts     # Expense CRUD and analytics
└── README.md               # This file
```

## 🎯 Repository Pattern Benefits

### **1. Single Responsibility Principle**
- Each repository handles operations for one specific entity
- Clear separation of concerns
- Easier to maintain and debug

### **2. Data Access Abstraction**
- Business logic is separated from data access logic
- Easy to switch database implementations
- Consistent interface across all repositories

### **3. Testability**
- Each repository can be tested independently
- Mock repositories for unit testing
- Better isolation of concerns

### **4. Maintainability**
- Smaller, focused files
- Easy to find and fix issues
- Clear method signatures

## 🔧 Repository Interface

Each repository follows this consistent pattern:

```typescript
class EntityRepository {
  private db: SQLite.SQLiteDatabase | null = null;
  
  setDatabase(db: SQLite.SQLiteDatabase): void
  createTables(): Promise<void>
  insertDefaultData(): Promise<void>
  
  // CRUD operations
  getById(id: number): Promise<Entity | null>
  getAll(): Promise<Entity[]>
  add(entity: Omit<Entity, 'id'>): Promise<number>
  update(id: number, entity: Partial<Entity>): Promise<void>
  delete(id: number): Promise<void>
}
```

## 📊 Available Repositories

### **CategoryRepository**
- **Purpose**: Manage expense categories
- **Operations**: CRUD for categories, type-based filtering
- **Features**: Soft delete, default data insertion

### **PaymentTypeRepository**
- **Purpose**: Manage payment methods
- **Operations**: CRUD for payment types
- **Features**: Soft delete, default payment methods

### **AllocationRepository**
- **Purpose**: Manage monthly budget allocations
- **Operations**: CRUD for allocations, current month utilities
- **Features**: Month-based operations, default allocations

### **ExpenseRepository**
- **Purpose**: Manage expenses and analytics
- **Operations**: CRUD for expenses, reporting, date utilities
- **Features**: Complex queries, joins, analytics functions

## 🚀 Usage Example

```typescript
import { databaseService } from '@/services/databaseService';

// All operations work the same way
const categories = await databaseService.getCategories();
const expenses = await databaseService.getAllExpenses();
const allocation = await databaseService.getCurrentMonthAllocation();
```

## 🔄 Database Initialization

The main `DatabaseService` orchestrates all repositories:

1. **Opens database connection**
2. **Sets database reference** in all repositories
3. **Creates tables** using individual repositories
4. **Inserts default data** using individual repositories

## 📝 Adding New Repositories

To add a new repository:

1. **Create** `newEntityRepository.ts`
2. **Implement** the standard interface
3. **Export** from `index.ts`
4. **Update** `DatabaseService` to use it
5. **Bind methods** in the main service

## 🧪 Testing

Each repository can be tested independently:

```typescript
// Mock the database
const mockDb = { /* mock implementation */ };
repository.setDatabase(mockDb);

// Test individual methods
const result = await repository.getById(1);
expect(result).toBeDefined();
```

## 📚 Best Practices

- **Keep repositories focused** on one entity
- **Use consistent naming** conventions
- **Handle errors gracefully** with proper error messages
- **Document complex queries** with comments
- **Use TypeScript interfaces** for type safety
- **Implement soft deletes** where appropriate
- **Add indexes** for performance-critical queries
