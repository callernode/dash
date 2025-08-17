import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const arbitrageOpportunities = pgTable("arbitrage_opportunities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  uniswapPrice: decimal("uniswap_price", { precision: 18, scale: 8 }).notNull(),
  sushiswapPrice: decimal("sushiswap_price", { precision: 18, scale: 8 }).notNull(),
  profitPercentage: decimal("profit_percentage", { precision: 5, scale: 2 }).notNull(),
  profitable: boolean("profitable").notNull().default(false),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'arbitrage', 'skip'
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  profit: decimal("profit", { precision: 18, scale: 2 }),
  gasFee: decimal("gas_fee", { precision: 18, scale: 8 }),
  netProfit: decimal("net_profit", { precision: 18, scale: 2 }),
  status: text("status").notNull(), // 'success', 'failed', 'skipped'
  reason: text("reason"), // reason for skip or failure
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  txHash: text("tx_hash"),
});

export const botSettings = pgTable("bot_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  minProfitThreshold: decimal("min_profit_threshold", { precision: 5, scale: 2 }).notNull().default('1.0'),
  maxSlippage: decimal("max_slippage", { precision: 5, scale: 2 }).notNull().default('0.5'),
  gasLimit: integer("gas_limit").notNull().default(500000),
  gasPriceStrategy: text("gas_price_strategy").notNull().default('standard'),
  autoTradingEnabled: boolean("auto_trading_enabled").notNull().default(false),
  maxTradeAmount: decimal("max_trade_amount", { precision: 18, scale: 2 }).notNull().default('1000'),
  refreshInterval: integer("refresh_interval").notNull().default(5),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const telegramSettings = pgTable("telegram_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botToken: text("bot_token"),
  chatId: text("chat_id"),
  enabled: boolean("enabled").notNull().default(false),
  notifyTradeSuccess: boolean("notify_trade_success").notNull().default(true),
  notifyTradeFailed: boolean("notify_trade_failed").notNull().default(true),
  notifyHighProfit: boolean("notify_high_profit").notNull().default(true),
  notifyErrors: boolean("notify_errors").notNull().default(true),
  minProfitAlert: decimal("min_profit_alert", { precision: 5, scale: 2 }).notNull().default('1.5'),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const botStatus = pgTable("bot_status", {
  id: varchar("id").primaryKey().default('singleton'),
  isActive: boolean("is_active").notNull().default(true),
  uptime: integer("uptime").notNull().default(0), // seconds
  totalCycles: integer("total_cycles").notNull().default(0),
  lastUpdate: timestamp("last_update").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertArbitrageOpportunitySchema = createInsertSchema(arbitrageOpportunities).omit({
  id: true,
  timestamp: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  timestamp: true,
});

export const insertBotSettingsSchema = createInsertSchema(botSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertTelegramSettingsSchema = createInsertSchema(telegramSettings).omit({
  id: true,
  updatedAt: true,
});

export const updateBotStatusSchema = createInsertSchema(botStatus).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type ArbitrageOpportunity = typeof arbitrageOpportunities.$inferSelect;
export type InsertArbitrageOpportunity = z.infer<typeof insertArbitrageOpportunitySchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type BotSettings = typeof botSettings.$inferSelect;
export type InsertBotSettings = z.infer<typeof insertBotSettingsSchema>;

export type TelegramSettings = typeof telegramSettings.$inferSelect;
export type InsertTelegramSettings = z.infer<typeof insertTelegramSettingsSchema>;

export type BotStatus = typeof botStatus.$inferSelect;
export type UpdateBotStatus = z.infer<typeof updateBotStatusSchema>;

// WebSocket message types
export interface WebSocketMessage {
  type: 'price_update' | 'arbitrage_opportunity' | 'trade_executed' | 'bot_status_update';
  data: any;
}

export interface PriceUpdate {
  uniswapPrice: string;
  sushiswapPrice: string;
  timestamp: Date;
}

export interface ArbitrageData {
  profitPercentage: string;
  profitable: boolean;
  estimatedProfit: string;
  estimatedGas: string;
  netProfit: string;
}
