import { 
  type User, 
  type InsertUser, 
  type ArbitrageOpportunity,
  type InsertArbitrageOpportunity,
  type Transaction,
  type InsertTransaction,
  type BotSettings,
  type InsertBotSettings,
  type TelegramSettings,
  type InsertTelegramSettings,
  type BotStatus,
  type UpdateBotStatus
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Arbitrage Opportunities
  createArbitrageOpportunity(opportunity: InsertArbitrageOpportunity): Promise<ArbitrageOpportunity>;
  getLatestArbitrageOpportunity(): Promise<ArbitrageOpportunity | undefined>;
  getArbitrageOpportunities(limit?: number): Promise<ArbitrageOpportunity[]>;

  // Transactions
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactions(limit?: number, offset?: number): Promise<Transaction[]>;
  getTransactionsCount(): Promise<number>;
  getDailyStats(): Promise<{
    totalProfit: string;
    successfulTrades: number;
    avgProfit: string;
    gasSpent: string;
    winRate: string;
  }>;

  // Bot Settings
  getBotSettings(): Promise<BotSettings | undefined>;
  updateBotSettings(settings: InsertBotSettings): Promise<BotSettings>;

  // Telegram Settings
  getTelegramSettings(): Promise<TelegramSettings | undefined>;
  updateTelegramSettings(settings: InsertTelegramSettings): Promise<TelegramSettings>;

  // Bot Status
  getBotStatus(): Promise<BotStatus | undefined>;
  updateBotStatus(status: UpdateBotStatus): Promise<BotStatus>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private arbitrageOpportunities: Map<string, ArbitrageOpportunity>;
  private transactions: Map<string, Transaction>;
  private botSettings: BotSettings | undefined;
  private telegramSettings: TelegramSettings | undefined;
  private botStatus: BotStatus | undefined;

  constructor() {
    this.users = new Map();
    this.arbitrageOpportunities = new Map();
    this.transactions = new Map();
    
    // Initialize default settings
    this.initializeDefaults();
  }

  private initializeDefaults() {
    // Default bot settings
    this.botSettings = {
      id: randomUUID(),
      minProfitThreshold: "1.0",
      maxSlippage: "0.5",
      gasLimit: 500000,
      gasPriceStrategy: "standard",
      autoTradingEnabled: false,
      maxTradeAmount: "1000",
      refreshInterval: 5,
      updatedAt: new Date(),
    };

    // Default telegram settings
    this.telegramSettings = {
      id: randomUUID(),
      botToken: null,
      chatId: null,
      enabled: false,
      notifyTradeSuccess: true,
      notifyTradeFailed: true,
      notifyHighProfit: true,
      notifyErrors: true,
      minProfitAlert: "1.5",
      updatedAt: new Date(),
    };

    // Default bot status
    this.botStatus = {
      id: "singleton",
      isActive: true,
      uptime: 0,
      totalCycles: 0,
      lastUpdate: new Date(),
    };
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createArbitrageOpportunity(opportunity: InsertArbitrageOpportunity): Promise<ArbitrageOpportunity> {
    const id = randomUUID();
    const opportunityWithId: ArbitrageOpportunity = {
      ...opportunity,
      id,
      timestamp: new Date(),
    };
    this.arbitrageOpportunities.set(id, opportunityWithId);
    return opportunityWithId;
  }

  async getLatestArbitrageOpportunity(): Promise<ArbitrageOpportunity | undefined> {
    const opportunities = Array.from(this.arbitrageOpportunities.values());
    return opportunities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  }

  async getArbitrageOpportunities(limit = 50): Promise<ArbitrageOpportunity[]> {
    const opportunities = Array.from(this.arbitrageOpportunities.values());
    return opportunities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transactionWithId: Transaction = {
      ...transaction,
      id,
      timestamp: new Date(),
    };
    this.transactions.set(id, transactionWithId);
    return transactionWithId;
  }

  async getTransactions(limit = 50, offset = 0): Promise<Transaction[]> {
    const transactions = Array.from(this.transactions.values());
    return transactions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
  }

  async getTransactionsCount(): Promise<number> {
    return this.transactions.size;
  }

  async getDailyStats(): Promise<{
    totalProfit: string;
    successfulTrades: number;
    avgProfit: string;
    gasSpent: string;
    winRate: string;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTransactions = Array.from(this.transactions.values())
      .filter(tx => tx.timestamp >= today);

    const successfulTrades = todayTransactions.filter(tx => tx.status === 'success');
    const totalTransactions = todayTransactions.length;
    
    const totalProfit = successfulTrades.reduce((sum, tx) => 
      sum + parseFloat(tx.netProfit || "0"), 0);
    
    const totalGas = successfulTrades.reduce((sum, tx) => 
      sum + parseFloat(tx.gasFee || "0"), 0);

    const avgProfit = successfulTrades.length > 0 ? 
      (totalProfit / successfulTrades.length) : 0;

    const winRate = totalTransactions > 0 ? 
      (successfulTrades.length / totalTransactions) * 100 : 0;

    return {
      totalProfit: totalProfit.toFixed(2),
      successfulTrades: successfulTrades.length,
      avgProfit: avgProfit.toFixed(2),
      gasSpent: totalGas.toFixed(2),
      winRate: winRate.toFixed(1),
    };
  }

  async getBotSettings(): Promise<BotSettings | undefined> {
    return this.botSettings;
  }

  async updateBotSettings(settings: InsertBotSettings): Promise<BotSettings> {
    this.botSettings = {
      id: this.botSettings?.id || randomUUID(),
      ...settings,
      updatedAt: new Date(),
    };
    return this.botSettings;
  }

  async getTelegramSettings(): Promise<TelegramSettings | undefined> {
    return this.telegramSettings;
  }

  async updateTelegramSettings(settings: InsertTelegramSettings): Promise<TelegramSettings> {
    this.telegramSettings = {
      id: this.telegramSettings?.id || randomUUID(),
      ...settings,
      updatedAt: new Date(),
    };
    return this.telegramSettings;
  }

  async getBotStatus(): Promise<BotStatus | undefined> {
    return this.botStatus;
  }

  async updateBotStatus(status: UpdateBotStatus): Promise<BotStatus> {
    this.botStatus = {
      id: "singleton",
      ...status,
      lastUpdate: new Date(),
    };
    return this.botStatus;
  }
}

export const storage = new MemStorage();
