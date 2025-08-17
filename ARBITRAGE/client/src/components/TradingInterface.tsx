import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function TradingInterface() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [tradeAmount, setTradeAmount] = useState("100.00");
  const [slippage, setSlippage] = useState("0.5");

  const { data: botSettings } = useQuery({
    queryKey: ["/api/bot-settings"],
  });

  const { data: estimation } = useQuery({
    queryKey: ["/api/estimate-returns", tradeAmount],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/estimate-returns", { amount: parseFloat(tradeAmount) });
      return response.json();
    },
    enabled: !!tradeAmount,
  });

  const executeTradeMutation = useMutation({
    mutationFn: (data: { amount: number; slippage: number }) =>
      apiRequest("POST", "/api/execute-trade", data),
    onSuccess: async (response) => {
      const result = await response.json();
      if (result.success) {
        toast({ 
          title: "Trade executed successfully", 
          description: `Net profit: $${result.profit}` 
        });
      } else {
        toast({ 
          title: "Trade not executed", 
          description: result.error,
          variant: "destructive"
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/recent-trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: () => {
      toast({ title: "Failed to execute trade", variant: "destructive" });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (settings: any) => apiRequest("PUT", "/api/bot-settings", settings),
    onSuccess: () => {
      toast({ title: "Settings saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/bot-settings"] });
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
    },
  });

  const handleExecuteTrade = () => {
    if (!tradeAmount || !slippage) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    executeTradeMutation.mutate({
      amount: parseFloat(tradeAmount),
      slippage: parseFloat(slippage),
    });
  };

  const handleSaveSettings = () => {
    if (!botSettings) return;

    updateSettingsMutation.mutate(botSettings);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Manual Trading Card */}
      <Card className="bg-secondary border-border-color">
        <CardHeader className="border-b border-border-color">
          <CardTitle className="text-lg font-semibold flex items-center text-primary">
            <i className="fas fa-hand-pointer mr-2 text-accent"></i>
            Manual Trading
          </CardTitle>
          <p className="text-text-secondary text-sm">Execute trades manually with current market prices</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <Label className="text-primary">Trade Amount (USDT)</Label>
              <Input
                type="number"
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
                placeholder="100.00"
                className="bg-border-color border-border-color text-primary font-mono"
              />
            </div>
            <div>
              <Label className="text-primary">Max Slippage (%)</Label>
              <Input
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                placeholder="0.5"
                step="0.1"
                className="bg-border-color border-border-color text-primary font-mono"
              />
            </div>
            <div className="p-4 bg-border-color rounded-lg">
              <div className="text-sm text-text-secondary mb-2">Estimated Returns</div>
              <div className="flex justify-between">
                <span className="text-primary">Profit:</span>
                <span className="font-mono text-accent">+${estimation?.profit || "0.00"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary">Gas Fees:</span>
                <span className="font-mono text-danger">-${estimation?.gas || "0.00"}</span>
              </div>
              <div className="flex justify-between border-t border-border-color pt-2 mt-2">
                <span className="font-medium text-primary">Net Profit:</span>
                <span className="font-mono font-bold text-accent">+${estimation?.net || "0.00"}</span>
              </div>
            </div>
            <Button
              onClick={handleExecuteTrade}
              disabled={executeTradeMutation.isPending}
              className="w-full bg-accent hover:bg-accent/90 text-primary font-medium"
            >
              <i className="fas fa-exchange-alt mr-2"></i>
              {executeTradeMutation.isPending ? "Executing..." : "Execute Arbitrage Trade"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Auto Trading Settings Card */}
      <Card className="bg-secondary border-border-color">
        <CardHeader className="border-b border-border-color">
          <CardTitle className="text-lg font-semibold flex items-center text-primary">
            <i className="fas fa-robot mr-2 text-warning"></i>
            Auto Trading Settings
          </CardTitle>
          <p className="text-text-secondary text-sm">Configure automated arbitrage parameters</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-primary">Auto Trading</Label>
              <Switch
                checked={botSettings?.autoTradingEnabled || false}
                onCheckedChange={(checked) => {
                  if (botSettings) {
                    queryClient.setQueryData(["/api/bot-settings"], {
                      ...botSettings,
                      autoTradingEnabled: checked,
                    });
                  }
                }}
              />
            </div>
            <div>
              <Label className="text-primary">Minimum Profit Threshold (%)</Label>
              <Input
                type="number"
                value={botSettings?.minProfitThreshold || "1.0"}
                onChange={(e) => {
                  if (botSettings) {
                    queryClient.setQueryData(["/api/bot-settings"], {
                      ...botSettings,
                      minProfitThreshold: e.target.value,
                    });
                  }
                }}
                step="0.1"
                className="bg-border-color border-border-color text-primary font-mono"
              />
            </div>
            <div>
              <Label className="text-primary">Maximum Trade Amount (USDT)</Label>
              <Input
                type="number"
                value={botSettings?.maxTradeAmount || "1000"}
                onChange={(e) => {
                  if (botSettings) {
                    queryClient.setQueryData(["/api/bot-settings"], {
                      ...botSettings,
                      maxTradeAmount: e.target.value,
                    });
                  }
                }}
                className="bg-border-color border-border-color text-primary font-mono"
              />
            </div>
            <div>
              <Label className="text-primary">Trade Frequency</Label>
              <Select defaultValue="every">
                <SelectTrigger className="bg-border-color border-border-color text-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="every">Every opportunity</SelectItem>
                  <SelectItem value="1min">Maximum 1 per minute</SelectItem>
                  <SelectItem value="5min">Maximum 1 per 5 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSaveSettings}
              disabled={updateSettingsMutation.isPending}
              className="w-full bg-warning hover:bg-warning/90 text-primary font-medium"
            >
              <i className="fas fa-save mr-2"></i>
              {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
