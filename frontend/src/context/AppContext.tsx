import React, { createContext, useContext, useState, useEffect } from 'react';
import { StorageService, DEFAULT_API_URL } from '../services/storageService';

interface AppContextType {
  isMockMode: boolean;
  setIsMockMode: (val: boolean) => Promise<void>;
  apiUrl: string;
  updateApiUrl: (url: string) => Promise<void>;
  selectedPlantId: number | null;
  setSelectedPlantId: (id: number | null) => void;
  selectedDeviceId: number | null;
  setSelectedDeviceId: (id: number | null) => void;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMockMode, setIsMockModeState] = useState<boolean>(true);
  const [apiUrl, setApiUrlState] = useState<string>(DEFAULT_API_URL || 'http://10.0.2.2:5700');
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(1); // Default to Cabe depan rumah
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(3); // Default to paired device or 1

  useEffect(() => {
    (async () => {
      const mock = await StorageService.getUseMock();
      const url = await StorageService.getApiUrl();
      setIsMockModeState(mock);
      setApiUrlState(url);
    })();
  }, []);

  const setIsMockMode = async (val: boolean) => {
    await StorageService.setUseMock(val);
    setIsMockModeState(val);
  };

  const updateApiUrl = async (url: string) => {
    await StorageService.setApiUrl(url);
    setApiUrlState(url);
  };

  return (
    <AppContext.Provider
      value={{
        isMockMode,
        setIsMockMode,
        apiUrl,
        updateApiUrl,
        selectedPlantId,
        setSelectedPlantId,
        selectedDeviceId,
        setSelectedDeviceId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

