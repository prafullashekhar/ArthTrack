# Services Layer

This folder contains the service layer for the ArthTrack application, which orchestrates the repository layer and provides a unified interface for business logic.

## 🏗️ Architecture Overview

```
services/
├── databaseService.ts    # Main database orchestrator
├── databaseInit.ts       # Database initialization hook
└── README.md            # This file
```

## 🎯 Service Layer Responsibilities

### **1. DatabaseService**
- **Purpose**: Main orchestrator for all database operations
- **Responsibilities**:
  - Database connection management
  - Repository coordination
  - Unified API for all operations
  - Database maintenance and utilities

### **2. DatabaseInit**
- **Purpose**: React hook for database initialization
- **Responsibilities**:
  - Database setup on app startup
  - Loading and error state management
  - Integration with React lifecycle

## 🔧 How It Works

### **Repository Pattern Integration**
The `DatabaseService` acts as a facade, providing a unified interface while delegating actual operations to specialized repositories:

```typescript
// Main service delegates to repositories
class DatabaseService {
  // Category operations delegate to categoryRepository
  getCategories = categoryRepository.getCategories.bind(categoryRepository);
  
  // Expense operations delegate to expenseRepository
  addExpense = expenseRepository.addExpense.bind(expenseRepository);
}
```

### **Database Initialization Flow**
1. **App starts** → `useDatabaseInitialization` hook runs
2. **Hook calls** → `databaseService.initializeDatabase()`
3. **Service opens** → SQLite database connection
4. **Service sets** → Database reference in all repositories
5. **Service creates** → Tables using individual repositories
6. **Service inserts** → Default data using repositories
7. **App ready** → Database fully initialized

## 🚀 Usage Examples

### **In React Components**
```typescript
import { databaseService } from '@/services/databaseService';

// All operations work the same way
const categories = await databaseService.getCategories();
const expenses = await databaseService.getAllExpenses();
const allocation = await databaseService.getCurrentMonthAllocation();
```

### **Database Initialization**
```typescript
import { useDatabaseInitialization } from '@/services/databaseInit';

export default function App() {
  const { isLoading, error } = useDatabaseInitialization();
  
  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;
  
  return <MainApp />;
}
```

## 🔄 Repository Integration

The service layer integrates with the repository layer:

```
services/databaseService.ts
    ↓
repositories/
    ├── categoryRepository.ts
    ├── paymentTypeRepository.ts
    ├── allocationRepository.ts
    └── expenseRepository.ts
```

## 📊 Available Operations

### **Category Operations**
- `getCategories()`, `getCategoriesByType()`, `addCategory()`, etc.

### **Payment Type Operations**
- `getPaymentTypes()`, `addPaymentType()`, `updatePaymentType()`, etc.

### **Allocation Operations**
- `getCurrentMonthAllocation()`, `setAllocation()`, `updateAllocation()`, etc.

### **Expense Operations**
- `addExpense()`, `getExpensesByMonth()`, `getTotalSpentByType()`, etc.

### **Utility Operations**
- `clearAllData()`, `exportData()`, `getDatabaseStats()`

## 🧪 Testing Strategy

### **Service Layer Testing**
- Mock repositories for isolated testing
- Test orchestration logic
- Verify proper delegation to repositories

### **Integration Testing**
- Test full database initialization flow
- Verify repository coordination
- Test error handling scenarios

## 📚 Best Practices

- **Keep services thin** - delegate to repositories
- **Use consistent error handling** across all operations
- **Implement proper logging** for debugging
- **Handle edge cases** gracefully
- **Maintain backward compatibility** when possible
- **Document complex business logic** clearly

## 🔮 Future Enhancements

- **Caching layer** for frequently accessed data
- **Transaction management** for complex operations
- **Data validation** and sanitization
- **Audit logging** for data changes
- **Performance monitoring** and optimization
