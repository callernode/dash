import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function TelegramSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [telegramConfig, setTelegramConfig] = useState({
    botToken: "",
    chatId: "",
    enabled: false,
    notifyTradeSuccess: true,
    notifyTradeFailed: true,
    notifyHighProfit: true,
    notifyErrors: true,
    minProfitAlert: "1.5",
  });

  const { data: telegramSettings } = useQuery({
    queryKey: ["/api/telegram-settings"],
  });

  useEffect(() => {
    if (telegramSettings) {
      setTelegramConfig(prev => ({
        ...prev,
        ...telegramSettings,
        botToken: telegramSettings.botToken === "••••••••••" ? "" : telegramSettings.botToken || "",
      }));
    }
  }, [telegramSettings]);

  const testConnectionMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/test-telegram"),
    onSuccess: async (response) => {
      const result = await response.json();
      if (result.success) {
        toast({ title: "Test message sent successfully!" });
      } else {
        toast({ title: "Failed to send test message", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Failed to test connection", variant: "destructive" });
    },
  });

  const saveTelegramConfigMutation = useMutation({
    mutationFn: (config: any) => apiRequest("PUT", "/api/telegram-settings", config),
    onSuccess: () => {
      toast({ title: "Telegram configuration saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/telegram-settings"] });
    },
    onError: () => {
      toast({ title: "Failed to save Telegram configuration", variant: "destructive" });
    },
  });

  const handleTestConnection = () => {
    if (!telegramConfig.botToken || !telegramConfig.chatId) {
      toast({ title: "Please fill in Bot Token and Chat ID first", variant: "destructive" });
      return;
    }
    testConnectionMutation.mutate();
  };

  const handleSaveConfig = () => {
    if (!telegramConfig.botToken || !telegramConfig.chatId) {
      toast({ title: "Bot Token and Chat ID are required", variant: "destructive" });
      return;
    }
    saveTelegramConfigMutation.mutate(telegramConfig);
  };

  const commands = [
    { command: "/status", description: "Get current bot status and statistics" },
    { command: "/profit", description: "View today's profit summary" },
    { command: "/pause", description: "Pause automated trading" },
    { command: "/resume", description: "Resume automated trading" },
    { command: "/prices", description: "Get current USDT/XSGD prices" },
    { command: "/help", description: "Show all available commands" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bot Configuration Card */}
        <Card className="bg-secondary border-border-color">
          <CardHeader className="border-b border-border-color">
            <CardTitle className="text-lg font-semibold flex items-center text-primary">
              <i className="fab fa-telegram mr-2 text-blue-500"></i>
              Bot Configuration
            </CardTitle>
            <p className="text-text-secondary text-sm">Setup Telegram notifications and commands</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <Label className="text-primary">Bot Token</Label>
                <Input
                  type="password"
                  value={telegramConfig.botToken}
                  onChange={(e) => setTelegramConfig(prev => ({ ...prev, botToken: e.target.value }))}
                  placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                  className="bg-border-color border-border-color text-primary font-mono"
                />
                <p className="text-xs text-text-secondary mt-1">Get from @BotFather on Telegram</p>
              </div>
              <div>
                <Label className="text-primary">Chat ID</Label>
                <Input
                  type="text"
                  value={telegramConfig.chatId}
                  onChange={(e) => setTelegramConfig(prev => ({ ...prev, chatId: e.target.value }))}
                  placeholder="-1001234567890"
                  className="bg-border-color border-border-color text-primary font-mono"
                />
                <p className="text-xs text-text-secondary mt-1">Use @userinfobot to get your chat ID</p>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-primary">Enable Notifications</Label>
                <Switch
                  checked={telegramConfig.enabled}
                  onCheckedChange={(checked) => setTelegramConfig(prev => ({ ...prev, enabled: checked }))}
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleTestConnection}
                  disabled={testConnectionMutation.isPending}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <i className="fas fa-paper-plane mr-2"></i>
                  {testConnectionMutation.isPending ? "Testing..." : "Test Connection"}
                </Button>
                <Button
                  onClick={handleSaveConfig}
                  disabled={saveTelegramConfigMutation.isPending}
                  className="flex-1 bg-accent hover:bg-accent/90 text-primary"
                >
                  <i className="fas fa-save mr-2"></i>
                  {saveTelegramConfigMutation.isPending ? "Saving..." : "Save Config"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings Card */}
        <Card className="bg-secondary border-border-color">
          <CardHeader className="border-b border-border-color">
            <CardTitle className="text-lg font-semibold flex items-center text-primary">
              <i className="fas fa-bell mr-2 text-warning"></i>
              Notification Settings
            </CardTitle>
            <p className="text-text-secondary text-sm">Configure when to receive alerts</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-primary">Successful Trades</div>
                    <div className="text-xs text-text-secondary">Notify on completed arbitrage</div>
                  </div>
                  <Switch
                    checked={telegramConfig.notifyTradeSuccess}
                    onCheckedChange={(checked) => setTelegramConfig(prev => ({ ...prev, notifyTradeSuccess: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-primary">Failed Trades</div>
                    <div className="text-xs text-text-secondary">Notify on transaction failures</div>
                  </div>
                  <Switch
                    checked={telegramConfig.notifyTradeFailed}
                    onCheckedChange={(checked) => setTelegramConfig(prev => ({ ...prev, notifyTradeFailed: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-primary">High Profit Opportunities</div>
                    <div className="text-xs text-text-secondary">Notify on profits above 2%</div>
                  </div>
                  <Switch
                    checked={telegramConfig.notifyHighProfit}
                    onCheckedChange={(checked) => setTelegramConfig(prev => ({ ...prev, notifyHighProfit: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-primary">System Errors</div>
                    <div className="text-xs text-text-secondary">Notify on bot errors and issues</div>
                  </div>
                  <Switch
                    checked={telegramConfig.notifyErrors}
                    onCheckedChange={(checked) => setTelegramConfig(prev => ({ ...prev, notifyErrors: checked }))}
                  />
                </div>
              </div>
              <div>
                <Label className="text-primary">Minimum Profit for Alerts (%)</Label>
                <Input
                  type="number"
                  value={telegramConfig.minProfitAlert}
                  onChange={(e) => setTelegramConfig(prev => ({ ...prev, minProfitAlert: e.target.value }))}
                  step="0.1"
                  className="bg-border-color border-border-color text-primary font-mono"
                />
              </div>
              <Button
                onClick={handleSaveConfig}
                disabled={saveTelegramConfigMutation.isPending}
                className="w-full bg-warning hover:bg-warning/90 text-primary"
              >
                <i className="fas fa-save mr-2"></i>
                Save Notification Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Telegram Commands Card */}
      <Card className="bg-secondary border-border-color">
        <CardHeader className="border-b border-border-color">
          <CardTitle className="text-lg font-semibold flex items-center text-primary">
            <i className="fas fa-terminal mr-2 text-accent"></i>
            Available Commands
          </CardTitle>
          <p className="text-text-secondary text-sm">Commands you can use with the Telegram bot</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commands.map((cmd, index) => (
              <div key={index} className="p-4 bg-border-color rounded-lg">
                <div className="font-mono text-accent font-medium">{cmd.command}</div>
                <div className="text-sm text-text-secondary mt-1">{cmd.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
