import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { PriceUpdate, ArbitrageData } from "@shared/schema";

export default function PriceMonitorCard() {
  const { lastMessage } = useWebSocket();
  const [prices, setPrices] = useState<PriceUpdate>({
    uniswapPrice: "0.7412",
    sushiswapPrice: "0.7398",
    timestamp: new Date(),
  });
  const [arbitrageData, setArbitrageData] = useState<ArbitrageData>({
    profitPercentage: "1.89",
    profitable: true,
    estimatedProfit: "7.56",
    estimatedGas: "0.37",
    netProfit: "7.19",
  });

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === "price_update") {
      setPrices(lastMessage.data);
    } else if (lastMessage.type === "arbitrage_opportunity") {
      setArbitrageData(lastMessage.data);
    }
  }, [lastMessage]);

  const calculateChange = (current: string, previous: string) => {
    const curr = parseFloat(current);
    const prev = parseFloat(previous);
    const change = ((curr - prev) / prev) * 100;
    return change;
  };

  return (
    <Card className="bg-secondary border-border-color">
      <CardHeader className="border-b border-border-color">
        <CardTitle className="text-lg font-semibold flex items-center text-primary">
          <i className="fas fa-exchange-alt mr-2 text-accent"></i>
          Price Monitoring
        </CardTitle>
        <p className="text-text-secondary text-sm">Real-time USDT/XSGD prices</p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Uniswap Price */}
          <div className="flex items-center justify-between p-4 bg-border-color rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                <i className="fas fa-unicorn text-white text-sm"></i>
              </div>
              <div>
                <div className="font-medium text-primary">Uniswap V2</div>
                <div className="text-xs text-text-secondary">USDT/XSGD</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-semibold text-primary">{prices.uniswapPrice}</div>
              <div className="text-xs text-accent">+0.02%</div>
            </div>
          </div>

          {/* SushiSwap Price */}
          <div className="flex items-center justify-between p-4 bg-border-color rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <i className="fas fa-fish text-white text-sm"></i>
              </div>
              <div>
                <div className="font-medium text-primary">SushiSwap</div>
                <div className="text-xs text-text-secondary">USDT/XSGD</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-semibold text-primary">{prices.sushiswapPrice}</div>
              <div className="text-xs text-danger">-0.05%</div>
            </div>
          </div>

          {/* Arbitrage Opportunity */}
          <div className={`p-4 border rounded-lg ${
            arbitrageData.profitable 
              ? "bg-accent bg-opacity-10 border-accent" 
              : "bg-warning bg-opacity-10 border-warning"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`font-medium ${
                  arbitrageData.profitable ? "text-accent" : "text-warning"
                }`}>
                  {arbitrageData.profitable ? "Arbitrage Opportunity" : "Below Threshold"}
                </div>
                <div className="text-xs text-text-secondary">
                  {parseFloat(prices.uniswapPrice) > parseFloat(prices.sushiswapPrice) 
                    ? "Buy Sushi → Sell Uni" 
                    : "Buy Uni → Sell Sushi"}
                </div>
              </div>
              <div className="text-right">
                <div className={`font-mono font-bold ${
                  arbitrageData.profitable ? "text-accent" : "text-warning"
                }`}>
                  {arbitrageData.profitable ? "+" : ""}{arbitrageData.profitPercentage}%
                </div>
                <div className="text-xs text-text-secondary">After fees</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
