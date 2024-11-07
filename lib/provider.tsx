import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

interface ModelContextType {
  data: any[];
  setData: (newData: any[]) => void;
  clearData: () => void;
}

const ModelContext = createContext<ModelContextType>({
  data: [],
  setData: () => {},
  clearData: () => {},
});

export const useModel = () => useContext(ModelContext);

interface ModelProviderProps {
  children: React.ReactNode;
  modelName?: string; // Optional prop for customizing localStorage key
}

const ModelProvider: React.FC<ModelProviderProps> = ({ children, modelName = 'model' }) => {
  const [data, setData] = useState<any[]>([]);
  const storageKey = `${modelName}Data`; // Determine the localStorage key based on modelName

  // Load data from localStorage when the component mounts
  useEffect(() => {
    try {
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        setData(JSON.parse(storedData));
      }
    } catch (error) {
      console.error(`Failed to load data from localStorage key "${storageKey}":`, error);
    }
  }, [storageKey]);

  // Save data to localStorage and update state
  const saveData = (newData: any[]) => {
    try {
      setData(newData);
      localStorage.setItem(storageKey, JSON.stringify(newData));
    } catch (error) {
      console.error(`Failed to save data to localStorage key "${storageKey}":`, error);
    }
  };

  // Clear data from localStorage and reset state
  const clearData = () => {
    try {
      localStorage.removeItem(storageKey);
      setData([]);
    } catch (error) {
      console.error(`Failed to clear data from localStorage key "${storageKey}":`, error);
    }
  };

  // Memoize context value to prevent re-renders
  const contextValue = useMemo(() => ({
    data,
    setData: saveData,
    clearData,
  }), [data]);

  return (
    <ModelContext.Provider value={contextValue}>
      {children}
    </ModelContext.Provider>
  );
};

export default ModelProvider;
