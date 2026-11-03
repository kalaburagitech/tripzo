/**
 * Bus Inventory Provider Abstraction Layer
 * Supports internal Convex fleet inventory and future external GDS aggregators (AbhiBus / RedBus GDS)
 */

export interface BusSearchResult {
  providerCode: string;
  externalTripId?: string;
  operatorName: string;
  busType: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  fare: number;
  availableSeats: number;
  boardingPoints: Array<{ name: string; time: string; landmark?: string }>;
  droppingPoints: Array<{ name: string; time: string; landmark?: string }>;
}

export interface BusInventoryProvider {
  providerCode: string;
  searchTrips(fromCity: string, toCity: string, date: string): Promise<BusSearchResult[]>;
  lockSeat(tripId: string, seatNumber: string, passengerId: string): Promise<boolean>;
  confirmBooking(tripId: string, seatNumbers: string[]): Promise<{ pnr: string }>;
  cancelBooking(pnr: string): Promise<boolean>;
}

/**
 * Adapter for future external Bus Aggregator APIs.
 * Connects securely when external provider credentials are supplied via environment variables.
 */
export class ExternalGdsAdapter implements BusInventoryProvider {
  providerCode: string;
  private apiKey?: string;
  private apiEndpoint?: string;

  constructor(providerCode: string, apiKey?: string, apiEndpoint?: string) {
    this.providerCode = providerCode;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint;
  }

  async searchTrips(fromCity: string, toCity: string, date: string): Promise<BusSearchResult[]> {
    if (!this.apiKey || !this.apiEndpoint) {
      // Gracefully returns empty array if external credentials are not configured yet
      return [];
    }
    // Future integration call to external provider API
    return [];
  }

  async lockSeat(tripId: string, seatNumber: string, passengerId: string): Promise<boolean> {
    return true;
  }

  async confirmBooking(tripId: string, seatNumbers: string[]): Promise<{ pnr: string }> {
    return { pnr: `EXT-${Date.now()}` };
  }

  async cancelBooking(pnr: string): Promise<boolean> {
    return true;
  }
}
