import { storage } from "../storage";
import type { InsertArbitrageOpportunity, ArbitrageData } from "@shared/schema";

export class ArbitrageService {
  private static readonly UNISWAP_FEE = 0.003; // 0.3%
  private static readonly SUSHISWAP_FEE = 0.003; // 0.3%
  private static readonly ESTIMATED_GAS_PRICE = 30; // gwei
  private static readonly ESTIMATED_GAS_LIMIT = 500000;

  static async calculateArbitrageOpportunity(
    uniswapPrice: number,
    sushiswapPrice: number
  ): Promise<ArbitrageData> {
    const priceDiff = Math.abs(uniswapPrice - sushiswapPrice);
    const avgPrice = (uniswapPrice + sushiswapPrice) / 2;
    const profitPercentage = (priceDiff / avgPrice) * 100;

    // Calculate estimated costs
    const feePercentage = this.UNISWAP_FEE + this.SUSHISWAP_FEE; // Total DEX fees
    const estimatedGasUSD = 0.37; // Approximate gas cost in USD for Polygon
    
    // Assume $400 trade amount for calculations
    const tradeAmount = 400;
    const grossProfit = (profitPercentage / 100) * tradeAmount;
    const feesCost = (feePercentage * tradeAmount) + estimatedGasUSD;
    const netProfit = grossProfit - feesCost;
    const netProfitPercentage = (netProfit / tradeAmount) * 100;

    const profitable = netProfitPercentage >= 1.0; // Minimum 1% profit threshold

    // Store opportunity in database
    await storage.createArbitrageOpportunity({
      uniswapPrice: uniswapPrice.toString(),
      sushiswapPrice: sushiswapPrice.toString(),
      profitPercentage: netProfitPercentage.toString(),
      profitable,
    });

    return {
      profitPercentage: netProfitPercentage.toFixed(2),
      profitable,
      estimatedProfit: grossProfit.toFixed(2),
      estimatedGas: estimatedGasUSD.toFixed(2),
      netProfit: netProfit.toFixed(2),
    };
  }

  static async executeArbitrageTrade(amount: number, slippage: number): Promise<{
    success: boolean;
    txHash?: string;
    profit?: string;
    gasFee?: string;
    error?: string;
  }> {
    try {
      // Simulate trade execution (in MVP, this is mocked)
      const settings = await storage.getBotSettings();
      if (!settings) {
        throw new Error("Bot settings not found");
      }

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get latest arbitrage opportunity
      const opportunity = await storage.getLatestArbitrageOpportunity();
      if (!opportunity) {
        throw new Error("No arbitrage opportunity found");
      }

      const profitable = parseFloat(opportunity.profitPercentage) >= parseFloat(settings.minProfitThreshold);
      
      if (!profitable) {
        // Create skipped transaction record
        await storage.createTransaction({
          type: "skip",
          amount: amount.toString(),
          profit: null,
          gasFee: null,
          netProfit: null,
          status: "skipped",
          reason: `Profit ${opportunity.profitPercentage}% below threshold ${settings.minProfitThreshold}%`,
          txHash: null,
        });

        return {
          success: false,
          error: "Profit below threshold",
        };
      }

      // Simulate successful trade
      const grossProfit = (parseFloat(opportunity.profitPercentage) / 100) * amount;
      const gasFee = 0.37; // Simulated gas fee
      const netProfit = grossProfit - gasFee;
      const txHash = `0x${Math.random().toString(16).substring(2, 66)}`;

      // Create successful transaction record
      await storage.createTransaction({
        type: "arbitrage",
        amount: amount.toString(),
        profit: grossProfit.toString(),
        gasFee: gasFee.toString(),
        netProfit: netProfit.toString(),
        status: "success",
        reason: null,
        txHash,
      });

      // Update bot status
      const botStatus = await storage.getBotStatus();
      if (botStatus) {
        await storage.updateBotStatus({
          ...botStatus,
          totalCycles: botStatus.totalCycles + 1,
        });
      }

      return {
        success: true,
        txHash,
        profit: netProfit.toFixed(2),
        gasFee: gasFee.toFixed(2),
      };

    } catch (error) {
      // Create failed transaction record
      await storage.createTransaction({
        type: "arbitrage",
        amount: amount.toString(),
        profit: null,
        gasFee: null,
        netProfit: null,
        status: "failed",
        reason: error instanceof Error ? error.message : "Unknown error",
        txHash: null,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async getEstimatedReturns(amount: number): Promise<{
    profit: string;
    gas: string;
    net: string;
  }> {
    const opportunity = await storage.getLatestArbitrageOpportunity();
    
    if (!opportunity) {
      return {
        profit: "0.00",
        gas: "0.37",
        net: "0.00",
      };
    }

    const profitPercentage = parseFloat(opportunity.profitPercentage);
    const grossProfit = (profitPercentage / 100) * amount;
    const gasFee = 0.37;
    const netProfit = grossProfit - gasFee;

    return {
      profit: grossProfit.toFixed(2),
      gas: gasFee.toFixed(2),
      net: netProfit.toFixed(2),
    };
  }
}
