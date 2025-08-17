import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SystemSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [tradingSettings, setTradingSettings] = useState({
    minProfitThreshold: "1.0",
    maxSlippage: "0.5",
    gasLimit: 500000,
    gasPriceStrategy: "standard",
    refreshInterval: 5,
  });

  const [walletInfo] = useState({
    address: "0x1234...5678",
    maticBalance: "125.67",
    usdtBalance: "2,450.00",
  });

  const { data: botSettings } = useQuery({
    queryKey: ["/api/bot-settings"],
  });

  useEffect(() => {
    if (botSettings) {
      setTradingSettings({
        minProfitThreshold: botSettings.minProfitThreshold,
        maxSlippage: botSettings.maxSlippage,
        gasLimit: botSettings.gasLimit,
        gasPriceStrategy: botSettings.gasPriceStrategy,
        refreshInterval: botSettings.refreshInterval,
      });
    }
  }, [botSettings]);

  const saveSettingsMutation = useMutation({
    mutationFn: (settings: any) => apiRequest("PUT", "/api/bot-settings", settings),
    onSuccess: () => {
      toast({ title: "Settings saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/bot-settings"] });
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
    },
  });

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate(tradingSettings);
  };

  const handleResetSettings = () => {
    setTradingSettings({
      minProfitThreshold: "1.0",
      maxSlippage: "0.5",
      gasLimit: 500000,
      gasPriceStrategy: "standard",
      refreshInterval: 5,
    });
    toast({ title: "Settings reset to defaults" });
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletInfo.address);
    toast({ title: "Address copied to clipboard!" });
  };

  const refreshBalance = () => {
    toast({ title: "Balance refreshed (simulated)" });
  };

  const disconnectWallet = () => {
    toast({ title: "Wallet disconnected (simulated)" });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trading Settings Card */}
        <Card className="bg-secondary border-border-color">
          <CardHeader className="border-b border-border-color">
            <CardTitle className="text-lg font-semibold flex items-center text-primary">
              <i className="fas fa-cog mr-2 text-accent"></i>
              Trading Parameters
            </CardTitle>
            <p className="text-text-secondary text-sm">Configure core arbitrage settings</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <Label className="text-primary">Minimum Profit Threshold (%)</Label>
                <Input
                  type="number"
                  value={tradingSettings.minProfitThreshold}
                  onChange={(e) => setTradingSettings(prev => ({ ...prev, minProfitThreshold: e.target.value }))}
                  step="0.1"
                  className="bg-border-color border-border-color text-primary font-mono"
                />
                <p className="text-xs text-text-secondary mt-1">Skip trades below this profit percentage</p>
              </div>
              <div>
                <Label className="text-primary">Maximum Slippage (%)</Label>
                <Input
                  type="number"
                  value={tradingSettings.maxSlippage}
                  onChange={(e) => setTradingSettings(prev => ({ ...prev, maxSlippage: e.target.value }))}
                  step="0.1"
                  className="bg-border-color border-border-color text-primary font-mono"
                />
                <p className="text-xs text-text-secondary mt-1">Maximum acceptable price slippage</p>
              </div>
              <div>
                <Label className="text-primary">Gas Limit</Label>
                <Input
                  type="number"
                  value={tradingSettings.gasLimit}
                  onChange={(e) => setTradingSettings(prev => ({ ...prev, gasLimit: parseInt(e.target.value) }))}
                  className="bg-border-color border-border-color text-primary font-mono"
                />
                <p className="text-xs text-text-secondary mt-1">Maximum gas units per transaction</p>
              </div>
              <div>
                <Label className="text-primary">Gas Price Strategy</Label>
                <Select 
                  value={tradingSettings.gasPriceStrategy}
                  onValueChange={(value) => setTradingSettings(prev => ({ ...prev, gasPriceStrategy: value }))}
                >
                  <SelectTrigger className="bg-border-color border-border-color text-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fast">Fast (Higher fees, faster execution)</SelectItem>
                    <SelectItem value="standard">Standard (Balanced fees and speed)</SelectItem>
                    <SelectItem value="safe">Safe Low (Lower fees, slower execution)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Settings Card */}
        <Card className="bg-secondary border-border-color">
          <CardHeader className="border-b border-border-color">
            <CardTitle className="text-lg font-semibold flex items-center text-primary">
              <i className="fas fa-wallet mr-2 text-warning"></i>
              Wallet Configuration
            </CardTitle>
            <p className="text-text-secondary text-sm">Manage wallet connection and security</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <Label className="text-primary">Wallet Address</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    value={walletInfo.address}
                    readOnly
                    className="flex-1 bg-border-color border-border-color text-primary font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyAddress}
                    className="bg-border-color hover:bg-accent hover:bg-opacity-20 border-border-color"
                  >
                    <i className="fas fa-copy"></i>
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-primary">MATIC Balance</Label>
                  <div className="px-3 py-2 bg-border-color rounded-lg text-primary font-mono">
                    {walletInfo.maticBalance}
                  </div>
                </div>
                <div>
                  <Label className="text-primary">USDT Balance</Label>
                  <div className="px-3 py-2 bg-border-color rounded-lg text-primary font-mono">
                    {walletInfo.usdtBalance}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
                <div className="flex items-start space-x-2">
                  <i className="fas fa-exclamation-triangle text-yellow-500 mt-0.5"></i>
                  <div className="text-sm">
                    <div className="font-medium text-yellow-500">Security Notice</div>
                    <div className="text-text-secondary mt-1">
                      Never share your private keys. This bot operates with read-only access in demo mode.
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={refreshBalance}
                  className="flex-1 bg-border-color hover:bg-accent hover:bg-opacity-20 text-primary border-border-color"
                  variant="outline"
                >
                  <i className="fas fa-sync-alt mr-2"></i>
                  Refresh Balance
                </Button>
                <Button
                  onClick={disconnectWallet}
                  className="flex-1 bg-danger hover:bg-red-600 text-white"
                >
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  Disconnect
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Settings Card */}
      <Card className="bg-secondary border-border-color">
        <CardHeader className="border-b border-border-color">
          <CardTitle className="text-lg font-semibold flex items-center text-primary">
            <i className="fas fa-server mr-2 text-blue-500"></i>
            System Settings
          </CardTitle>
          <p className="text-text-secondary text-sm">Configure monitoring and performance settings</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-primary">Price Refresh Interval (seconds)</Label>
                <Input
                  type="number"
                  value={tradingSettings.refreshInterval}
                  onChange={(e) => setTradingSettings(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) }))}
                  min="1"
                  max="60"
                  className="bg-border-color border-border-color text-primary font-mono"
                />
              </div>
              <div>
                <Label className="text-primary">Log Level</Label>
                <Select defaultValue="info">
                  <SelectTrigger className="bg-border-color border-border-color text-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-primary">Max Transaction History</Label>
                <Input
                  type="number"
                  defaultValue="1000"
                  className="bg-border-color border-border-color text-primary font-mono"
                />
              </div>
              <div>
                <Label className="text-primary">RPC Endpoint</Label>
                <Select defaultValue="polygon">
                  <SelectTrigger className="bg-border-color border-border-color text-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="polygon">Polygon Mainnet (Default)</SelectItem>
                    <SelectItem value="mumbai">Polygon Mumbai (Testnet)</SelectItem>
                    <SelectItem value="custom">Custom RPC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-2">
            <Button
              onClick={handleResetSettings}
              variant="outline"
              className="bg-border-color hover:bg-danger hover:bg-opacity-20 border-border-color text-primary"
            >
              <i className="fas fa-undo mr-2"></i>
              Reset to Defaults
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={saveSettingsMutation.isPending}
              className="bg-accent hover:bg-accent/90 text-primary"
            >
              <i className="fas fa-save mr-2"></i>
              {saveSettingsMutation.isPending ? "Saving..." : "Save All Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
