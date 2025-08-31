import { useEffect, useState } from 'react';
import { databaseService } from './database';

export const useDatabaseInitialization = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        await databaseService.initializeDatabase();
        
        console.log('✅ Database initialization completed');
        setIsLoading(false);
      } catch (err) {
        console.error('❌ Database initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Database initialization failed');
        setIsLoading(false);
      }
    };

    initializeDatabase();
  }, []);

  return { isLoading, error };
};

// Database utility hooks for React components
export const useDatabaseService = () => {
  return databaseService;
};
