export type VehicleType = 'heavy' | 'medium' | 'light';

export interface ParkingZone {
  id: string;
  name: string;
  capacity: number;
  occupied: number;
  limits: {
    heavy: number;
    medium: number;
    light: number;
  };
  stats: {
    heavy: number;
    medium: number;
    light: number;
  };
  vehicles: Array<{
    number: string;
    type: VehicleType;
    entryTime: string;
    ticketId: string;
    slot?: string;
  }>;
}

export const api = {
  // Admin
  async adminLogin(username: string, password: string) {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return res.json();
  },

  async adminRegister(username: string, password: string, name: string, policeId: string) {
    const res = await fetch('/api/admin/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, name, policeId }),
    });
    return res.json();
  },

  // Zones
  async getZones(): Promise<ParkingZone[]> {
    const res = await fetch('/api/zones');
    if (!res.ok) {
      throw new Error('Failed to fetch zones');
    }
    const data = await res.json();
    // Ensure we always return an array
    return Array.isArray(data) ? data : [];
  },

  async createZone(zone: { id: string; name: string; capacity: number; heavyLimit: number; mediumLimit: number; lightLimit: number }) {
    const res = await fetch('/api/zones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(zone),
    });
    return res.json();
  },

  async updateZone(id: string, updates: Partial<{ name: string; capacity: number; heavyLimit: number; mediumLimit: number; lightLimit: number }>) {
    const res = await fetch(`/api/zones/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async deleteZone(id: string) {
    const res = await fetch(`/api/zones/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Vehicles
  async enterVehicle(vehicleNumber: string, type: VehicleType, zoneId?: string, slot?: string) {
    const res = await fetch('/api/vehicles/enter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleNumber, type, zoneId, slot }),
    });
    return res.json();
  },

  async searchVehicle(number: string) {
    const res = await fetch(`/api/vehicles/search?number=${encodeURIComponent(number)}`);
    return res.json();
  },

  async exitVehicle(id: string) {
    const res = await fetch(`/api/vehicles/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Analytics
  async getAnalyticsSummary() {
    const res = await fetch('/api/analytics/summary');
    if (!res.ok) {
      throw new Error('Failed to fetch analytics');
    }
    return res.json();
  },

  async seedAnalyticsData() {
    const res = await fetch('/api/analytics/seed', {
      method: 'POST',
    });
    return res.json();
  },
};
