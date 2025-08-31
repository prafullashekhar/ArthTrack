import React, { createContext, useContext, useState, useCallback } from 'react';

interface DataUpdateContextType {
  triggerUpdate: () => void;
  subscribe: (callback: () => void) => () => void;
}

const DataUpdateContext = createContext<DataUpdateContextType | undefined>(undefined);

export const useDataUpdate = () => {
  const context = useContext(DataUpdateContext);
  if (!context) {
    throw new Error('useDataUpdate must be used within a DataUpdateProvider');
  }
  return context;
};

interface DataUpdateProviderProps {
  children: React.ReactNode;
}

export const DataUpdateProvider: React.FC<DataUpdateProviderProps> = ({ children }) => {
  const [subscribers, setSubscribers] = useState<(() => void)[]>([]);

  const triggerUpdate = useCallback(() => {
    subscribers.forEach(callback => callback());
  }, [subscribers]);

  const subscribe = useCallback((callback: () => void) => {
    setSubscribers(prev => [...prev, callback]);
    
    // Return unsubscribe function
    return () => {
      setSubscribers(prev => prev.filter(sub => sub !== callback));
    };
  }, []);

  return (
    <DataUpdateContext.Provider value={{ triggerUpdate, subscribe }}>
      {children}
    </DataUpdateContext.Provider>
  );
};
