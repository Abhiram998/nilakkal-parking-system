import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, type VehicleType, type ParkingZone } from './api';

type ParkingContextType = {
  zones: ParkingZone[];
  enterVehicle: (vehicleNumber: string, type?: VehicleType, zoneId?: string, slot?: string) => Promise<{ success: boolean; ticket?: any; message?: string }>;
  totalCapacity: number;
  totalOccupied: number;
  isAdmin: boolean;
  loginAdmin: (username?: string, password?: string) => Promise<boolean>;
  registerAdmin: (username: string, password: string, name: string, policeId: string) => Promise<boolean>;
  logoutAdmin: () => void;
  addZone: (zone: any) => Promise<void>;
  updateZone: (id: string, data: any) => Promise<void>;
  deleteZone: (id: string) => Promise<void>;
  refreshZones: () => Promise<void>;
  loading: boolean;
};

const ParkingContext = createContext<ParkingContextType | undefined>(undefined);

export function ParkingProvider({ children }: { children: React.ReactNode }) {
  const [zones, setZones] = useState<ParkingZone[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshZones = async () => {
    try {
      const data = await api.getZones();
      setZones(data);
    } catch (error) {
      console.error('Failed to fetch zones:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshZones();
    const interval = setInterval(refreshZones, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loginAdmin = async (username?: string, password?: string) => {
    if (!username || !password) return false;
    
    try {
      const result = await api.adminLogin(username, password);
      if (result.success) {
        setIsAdmin(true);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const registerAdmin = async (username: string, password: string, name: string, policeId: string) => {
    try {
      const result = await api.adminRegister(username, password, name, policeId);
      return result.success;
    } catch (error) {
      return false;
    }
  };

  const logoutAdmin = () => setIsAdmin(false);

  const addZone = async (zoneData: any) => {
    try {
      await api.createZone(zoneData);
      await refreshZones();
    } catch (error) {
      console.error('Failed to add zone:', error);
    }
  };

  const updateZone = async (id: string, data: any) => {
    try {
      await api.updateZone(id, data);
      await refreshZones();
    } catch (error) {
      console.error('Failed to update zone:', error);
    }
  };

  const deleteZone = async (id: string) => {
    try {
      await api.deleteZone(id);
      await refreshZones();
    } catch (error) {
      console.error('Failed to delete zone:', error);
    }
  };

  const enterVehicle = async (vehicleNumber: string, type: VehicleType = 'light', zoneId?: string, slot?: string) => {
    try {
      const result = await api.enterVehicle(vehicleNumber, type, zoneId, slot);
      if (result.success) {
        await refreshZones();
      }
      return result;
    } catch (error) {
      return { success: false, message: 'Failed to enter vehicle' };
    }
  };

  const totalCapacity = zones.reduce((acc, z) => acc + z.capacity, 0);
  const totalOccupied = zones.reduce((acc, z) => acc + z.occupied, 0);

  return (
    <ParkingContext.Provider value={{
      zones,
      enterVehicle,
      totalCapacity,
      totalOccupied,
      isAdmin,
      loginAdmin,
      registerAdmin,
      logoutAdmin,
      addZone,
      updateZone,
      deleteZone,
      refreshZones,
      loading,
    }}>
      {children}
    </ParkingContext.Provider>
  );
}

export function useParking() {
  const context = useContext(ParkingContext);
  if (!context) throw new Error("useParking must be used within ParkingProvider");
  return context;
}

export type { VehicleType, ParkingZone };
