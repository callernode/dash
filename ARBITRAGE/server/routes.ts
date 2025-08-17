import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { ArbitrageService } from "./services/arbitrage";
import { PriceMonitorService } from "./services/priceMonitor";
import { TelegramService } from "./services/telegram";
import { insertBotSettingsSchema, insertTelegramSettingsSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize services
  const priceMonitor = PriceMonitorService.getInstance();
  const telegramService = TelegramService.getInstance();
  
  await telegramService.initialize();
  priceMonitor.startMonitoring(5);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');

    const messageHandler = (message: any) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    };

    // Subscribe to price updates
    priceMonitor.subscribe(messageHandler);

    // Send current prices immediately
    const currentPrices = priceMonitor.getCurrentPrices();
    messageHandler({
      type: 'price_update',
      data: currentPrices,
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      priceMonitor.unsubscribe(messageHandler);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      priceMonitor.unsubscribe(messageHandler);
    });
  });

  // API Routes

  // Dashboard stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getDailyStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Bot status
  app.get("/api/bot-status", async (req, res) => {
    try {
      const status = await storage.getBotStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bot status" });
    }
  });

  // Current prices
  app.get("/api/prices", async (req, res) => {
    try {
      const prices = priceMonitor.getCurrentPrices();
      const latest = await storage.getLatestArbitrageOpportunity();
      res.json({
        ...prices,
        arbitrage: latest ? {
          profitPercentage: latest.profitPercentage,
          profitable: latest.profitable,
        } : null,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prices" });
    }
  });

  // Recent trades
  app.get("/api/recent-trades", async (req, res) => {
    try {
      const trades = await storage.getTransactions(10);
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent trades" });
    }
  });

  // Execute manual trade
  app.post("/api/execute-trade", async (req, res) => {
    try {
      const { amount, slippage } = req.body;
      
      if (!amount || !slippage) {
        return res.status(400).json({ error: "Amount and slippage are required" });
      }

      const result = await ArbitrageService.executeArbitrageTrade(
        parseFloat(amount),
        parseFloat(slippage)
      );

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to execute trade" });
    }
  });

  // Estimate returns
  app.post("/api/estimate-returns", async (req, res) => {
    try {
      const { amount } = req.body;
      
      if (!amount) {
        return res.status(400).json({ error: "Amount is required" });
      }

      const estimation = await ArbitrageService.getEstimatedReturns(parseFloat(amount));
      res.json(estimation);
    } catch (error) {
      res.status(500).json({ error: "Failed to estimate returns" });
    }
  });

  // Transaction history with pagination
  app.get("/api/transactions", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const transactions = await storage.getTransactions(limit, offset);
      const total = await storage.getTransactionsCount();

      res.json({
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Bot settings
  app.get("/api/bot-settings", async (req, res) => {
    try {
      const settings = await storage.getBotSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bot settings" });
    }
  });

  app.put("/api/bot-settings", async (req, res) => {
    try {
      const validatedSettings = insertBotSettingsSchema.parse(req.body);
      const settings = await storage.updateBotSettings(validatedSettings);
      
      // Update monitoring interval if changed
      if (validatedSettings.refreshInterval) {
        priceMonitor.startMonitoring(validatedSettings.refreshInterval);
      }
      
      res.json(settings);
    } catch (error) {
      res.status(400).json({ error: "Invalid settings data" });
    }
  });

  // Telegram settings
  app.get("/api/telegram-settings", async (req, res) => {
    try {
      const settings = await storage.getTelegramSettings();
      // Don't expose bot token in response
      if (settings) {
        const { botToken, ...safeSettings } = settings;
        res.json({
          ...safeSettings,
          botToken: botToken ? "••••••••••" : null,
        });
      } else {
        res.json(null);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Telegram settings" });
    }
  });

  app.put("/api/telegram-settings", async (req, res) => {
    try {
      const validatedSettings = insertTelegramSettingsSchema.parse(req.body);
      const settings = await storage.updateTelegramSettings(validatedSettings);
      
      // Reinitialize Telegram service
      await telegramService.initialize();
      
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Invalid Telegram settings data" });
    }
  });

  // Test Telegram connection
  app.post("/api/test-telegram", async (req, res) => {
    try {
      const success = await telegramService.testConnection();
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: "Failed to test Telegram connection" });
    }
  });

  // Bot control
  app.post("/api/bot/pause", async (req, res) => {
    try {
      const botStatus = await storage.getBotStatus();
      if (!botStatus) {
        return res.status(404).json({ error: "Bot status not found" });
      }

      await storage.updateBotStatus({
        ...botStatus,
        isActive: false,
      });

      res.json({ success: true, message: "Bot paused" });
    } catch (error) {
      res.status(500).json({ error: "Failed to pause bot" });
    }
  });

  app.post("/api/bot/resume", async (req, res) => {
    try {
      const botStatus = await storage.getBotStatus();
      if (!botStatus) {
        return res.status(404).json({ error: "Bot status not found" });
      }

      await storage.updateBotStatus({
        ...botStatus,
        isActive: true,
      });

      res.json({ success: true, message: "Bot resumed" });
    } catch (error) {
      res.status(500).json({ error: "Failed to resume bot" });
    }
  });

  // Simulate price scenarios for testing
  app.post("/api/simulate-price", async (req, res) => {
    try {
      const { scenario } = req.body;
      
      if (!['high_profit', 'low_profit', 'no_profit'].includes(scenario)) {
        return res.status(400).json({ error: "Invalid scenario" });
      }

      priceMonitor.simulatePriceScenario(scenario);
      res.json({ success: true, message: `Simulated ${scenario} scenario` });
    } catch (error) {
      res.status(500).json({ error: "Failed to simulate price scenario" });
    }
  });

  return httpServer;
}
