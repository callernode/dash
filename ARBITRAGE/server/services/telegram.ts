import { storage } from "../storage";

export class TelegramService {
  private static instance: TelegramService;
  private botToken: string | null = null;
  private chatId: string | null = null;

  static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  async initialize(): Promise<void> {
    const settings = await storage.getTelegramSettings();
    if (settings && settings.botToken && settings.chatId) {
      this.botToken = settings.botToken;
      this.chatId = settings.chatId;
    }
  }

  async sendMessage(message: string): Promise<boolean> {
    try {
      if (!this.botToken || !this.chatId) {
        console.log("Telegram not configured, would send:", message);
        return false;
      }

      // In a real implementation, this would use the Telegram Bot API
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });

      return response.ok;
    } catch (error) {
      console.error("Error sending Telegram message:", error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    return this.sendMessage("🤖 *ArbiBot Test Message*\n\nTelegram bot connection is working!");
  }

  async notifyTradeSuccess(profit: string, percentage: string): Promise<void> {
    const settings = await storage.getTelegramSettings();
    if (!settings?.enabled || !settings.notifyTradeSuccess) return;

    const message = `✅ *Arbitrage Trade Successful*\n\n💰 Net Profit: $${profit}\n📈 Return: ${percentage}%\n⏰ ${new Date().toLocaleString()}`;
    await this.sendMessage(message);
  }

  async notifyTradeFailed(reason: string): Promise<void> {
    const settings = await storage.getTelegramSettings();
    if (!settings?.enabled || !settings.notifyTradeFailed) return;

    const message = `❌ *Trade Failed*\n\n🚫 Reason: ${reason}\n⏰ ${new Date().toLocaleString()}`;
    await this.sendMessage(message);
  }

  async notifyHighProfitOpportunity(percentage: string): Promise<void> {
    const settings = await storage.getTelegramSettings();
    if (!settings?.enabled || !settings.notifyHighProfit) return;

    const minAlert = parseFloat(settings.minProfitAlert);
    const currentProfit = parseFloat(percentage);

    if (currentProfit >= minAlert) {
      const message = `🚀 *High Profit Opportunity*\n\n📊 Potential Profit: ${percentage}%\n💎 Above your ${minAlert}% alert threshold\n⏰ ${new Date().toLocaleString()}`;
      await this.sendMessage(message);
    }
  }

  async notifyError(error: string): Promise<void> {
    const settings = await storage.getTelegramSettings();
    if (!settings?.enabled || !settings.notifyErrors) return;

    const message = `⚠️ *System Error*\n\n🔧 Error: ${error}\n⏰ ${new Date().toLocaleString()}`;
    await this.sendMessage(message);
  }

  async handleCommand(command: string): Promise<string> {
    try {
      switch (command) {
        case '/status':
          return await this.getStatusMessage();
        case '/profit':
          return await this.getProfitMessage();
        case '/pause':
          return await this.pauseBot();
        case '/resume':
          return await this.resumeBot();
        case '/prices':
          return await this.getPricesMessage();
        case '/help':
          return this.getHelpMessage();
        default:
          return "Unknown command. Type /help for available commands.";
      }
    } catch (error) {
      return `Error processing command: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async getStatusMessage(): Promise<string> {
    const botStatus = await storage.getBotStatus();
    const settings = await storage.getBotSettings();
    
    if (!botStatus || !settings) {
      return "❌ Bot status unavailable";
    }

    const uptime = this.formatUptime(botStatus.uptime);
    const status = botStatus.isActive ? "🟢 Active" : "🔴 Inactive";
    
    return `🤖 *Bot Status*\n\n${status}\n⏱ Uptime: ${uptime}\n🔄 Cycles: ${botStatus.totalCycles}\n📊 Min Profit: ${settings.minProfitThreshold}%\n🎯 Auto Trading: ${settings.autoTradingEnabled ? "ON" : "OFF"}`;
  }

  private async getProfitMessage(): Promise<string> {
    const stats = await storage.getDailyStats();
    
    return `💰 *Today's Performance*\n\n💵 Total Profit: $${stats.totalProfit}\n✅ Successful Trades: ${stats.successfulTrades}\n📈 Win Rate: ${stats.winRate}%\n⛽ Gas Spent: $${stats.gasSpent}\n📊 Avg Profit: $${stats.avgProfit}`;
  }

  private async pauseBot(): Promise<string> {
    const botStatus = await storage.getBotStatus();
    if (!botStatus) {
      return "❌ Cannot access bot status";
    }

    await storage.updateBotStatus({
      ...botStatus,
      isActive: false,
    });

    return "⏸️ *Bot Paused*\n\nAutomatic trading has been paused. Use /resume to continue.";
  }

  private async resumeBot(): Promise<string> {
    const botStatus = await storage.getBotStatus();
    if (!botStatus) {
      return "❌ Cannot access bot status";
    }

    await storage.updateBotStatus({
      ...botStatus,
      isActive: true,
    });

    return "▶️ *Bot Resumed*\n\nAutomatic trading has been resumed.";
  }

  private async getPricesMessage(): Promise<string> {
    const { PriceMonitorService } = await import("./priceMonitor");
    const priceMonitor = PriceMonitorService.getInstance();
    const prices = priceMonitor.getCurrentPrices();
    
    const priceDiff = Math.abs(parseFloat(prices.uniswapPrice) - parseFloat(prices.sushiswapPrice));
    const avgPrice = (parseFloat(prices.uniswapPrice) + parseFloat(prices.sushiswapPrice)) / 2;
    const diffPercentage = ((priceDiff / avgPrice) * 100).toFixed(2);
    
    return `💱 *Current Prices*\n\n🦄 Uniswap: ${prices.uniswapPrice} USDT/XSGD\n🍣 SushiSwap: ${prices.sushiswapPrice} USDT/XSGD\n📊 Difference: ${diffPercentage}%\n⏰ ${prices.timestamp.toLocaleString()}`;
  }

  private getHelpMessage(): Promise<string> {
    const commands = [
      "/status - Get bot status and statistics",
      "/profit - View today's profit summary",
      "/pause - Pause automated trading",
      "/resume - Resume automated trading",
      "/prices - Get current USDT/XSGD prices",
      "/help - Show this help message"
    ];

    return Promise.resolve(`🤖 *Available Commands*\n\n${commands.join('\n')}`);
  }

  private formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}
