import { ArbitrageService } from "./arbitrage";
import type { PriceUpdate, WebSocketMessage } from "@shared/schema";

export class PriceMonitorService {
  private static instance: PriceMonitorService;
  private subscribers: Set<(message: WebSocketMessage) => void> = new Set();
  private currentPrices: PriceUpdate = {
    uniswapPrice: "0.7412",
    sushiswapPrice: "0.7398",
    timestamp: new Date(),
  };
  private monitoringInterval: NodeJS.Timeout | null = null;

  static getInstance(): PriceMonitorService {
    if (!PriceMonitorService.instance) {
      PriceMonitorService.instance = new PriceMonitorService();
    }
    return PriceMonitorService.instance;
  }

  subscribe(callback: (message: WebSocketMessage) => void): void {
    this.subscribers.add(callback);
  }

  unsubscribe(callback: (message: WebSocketMessage) => void): void {
    this.subscribers.delete(callback);
  }

  private broadcast(message: WebSocketMessage): void {
    this.subscribers.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error("Error broadcasting message:", error);
      }
    });
  }

  startMonitoring(intervalSeconds: number = 5): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      await this.fetchAndUpdatePrices();
    }, intervalSeconds * 1000);

    // Initial fetch
    this.fetchAndUpdatePrices();
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private async fetchAndUpdatePrices(): Promise<void> {
    try {
      // Simulate price fetching with realistic variations
      const baseUniPrice = 0.7412;
      const baseSushiPrice = 0.7398;

      // Add small random variations (±0.5%)
      const uniVariation = (Math.random() - 0.5) * 0.01;
      const sushiVariation = (Math.random() - 0.5) * 0.01;

      const newUniPrice = baseUniPrice + (baseUniPrice * uniVariation);
      const newSushiPrice = baseSushiPrice + (baseSushiPrice * sushiVariation);

      this.currentPrices = {
        uniswapPrice: newUniPrice.toFixed(4),
        sushiswapPrice: newSushiPrice.toFixed(4),
        timestamp: new Date(),
      };

      // Broadcast price update
      this.broadcast({
        type: "price_update",
        data: this.currentPrices,
      });

      // Calculate arbitrage opportunity
      const arbitrageData = await ArbitrageService.calculateArbitrageOpportunity(
        newUniPrice,
        newSushiPrice
      );

      // Broadcast arbitrage opportunity
      this.broadcast({
        type: "arbitrage_opportunity",
        data: arbitrageData,
      });

    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  }

  getCurrentPrices(): PriceUpdate {
    return this.currentPrices;
  }

  // Simulate specific price scenarios for testing
  simulatePriceScenario(scenario: "high_profit" | "low_profit" | "no_profit"): void {
    let uniPrice: number;
    let sushiPrice: number;

    switch (scenario) {
      case "high_profit":
        uniPrice = 0.7450;
        sushiPrice = 0.7380;
        break;
      case "low_profit":
        uniPrice = 0.7420;
        sushiPrice = 0.7410;
        break;
      case "no_profit":
        uniPrice = 0.7412;
        sushiPrice = 0.7412;
        break;
    }

    this.currentPrices = {
      uniswapPrice: uniPrice.toFixed(4),
      sushiswapPrice: sushiPrice.toFixed(4),
      timestamp: new Date(),
    };

    this.broadcast({
      type: "price_update",
      data: this.currentPrices,
    });

    ArbitrageService.calculateArbitrageOpportunity(uniPrice, sushiPrice)
      .then(arbitrageData => {
        this.broadcast({
          type: "arbitrage_opportunity",
          data: arbitrageData,
        });
      });
  }
}
