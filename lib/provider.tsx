import React, { createContext, useContext, useState, useEffect } from 'react';

interface ModelContextType {
  data: any[];
  setData: (newData: any[]) => void;
}

const ModelContext = createContext<ModelContextType>({
  data: [],
  setData: () => {},
});

export const useModel = () => useContext(ModelContext);

const ModelProvider = ({ children }: any) => {
  const [data, setData] = useState<any[]>([]);

  // Load data from localStorage when the component mounts
  useEffect(() => {
    const storedData = localStorage.getItem('modelData');
    console.log(storedData)
    if (storedData) {
      setData(JSON.parse(storedData));  // Restore data from localStorage
    }
  }, []);

  // Save data to localStorage and update state
  const saveData = (newData: any[]) => {
    console.log(newData)
    setData(newData);
    localStorage.setItem('modelData', JSON.stringify(newData));  // Persist to localStorage
  };

  return (
    <ModelContext.Provider value={{ data, setData: saveData }}>
      {children}
    </ModelContext.Provider>
  );
};

export default ModelProvider;
