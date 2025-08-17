import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

export default function TradingActivityCard() {
  const { data: recentTrades } = useQuery({
    queryKey: ["/api/recent-trades"],
    refetchInterval: 10000,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <i className="fas fa-arrow-up text-primary text-xs"></i>;
      case "skipped":
        return <i className="fas fa-pause text-primary text-xs"></i>;
      case "failed":
        return <i className="fas fa-times text-primary text-xs"></i>;
      default:
        return <i className="fas fa-question text-primary text-xs"></i>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-accent";
      case "skipped":
        return "bg-warning";
      case "failed":
        return "bg-danger";
      default:
        return "bg-border-color";
    }
  };

  const getValueColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-accent";
      case "skipped":
        return "text-warning";
      case "failed":
        return "text-danger";
      default:
        return "text-text-secondary";
    }
  };

  return (
    <Card className="bg-secondary border-border-color">
      <CardHeader className="border-b border-border-color">
        <CardTitle className="text-lg font-semibold flex items-center text-primary">
          <i className="fas fa-activity mr-2 text-warning"></i>
          Recent Activity
        </CardTitle>
        <p className="text-text-secondary text-sm">Latest arbitrage executions</p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          {recentTrades && recentTrades.length > 0 ? (
            recentTrades.map((trade: any) => (
              <div key={trade.id} className="flex items-center justify-between p-3 bg-border-color rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getStatusColor(trade.status)}`}>
                    {getStatusIcon(trade.status)}
                  </div>
                  <div className="text-sm">
                    <div className="text-primary">
                      {trade.status === "skipped" ? "Opportunity Skipped" : "USDT→XSGD→USDT"}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className={`font-mono ${getValueColor(trade.status)}`}>
                    {trade.status === "success" 
                      ? `+$${trade.netProfit}` 
                      : trade.status === "skipped" 
                      ? `${((parseFloat(trade.amount) * 0.01) / parseFloat(trade.amount) * 100).toFixed(1)}%`
                      : "Failed"
                    }
                  </div>
                  <div className="text-xs text-text-secondary">
                    {trade.status === "success" 
                      ? `+${((parseFloat(trade.netProfit) / parseFloat(trade.amount)) * 100).toFixed(2)}%`
                      : trade.status === "skipped"
                      ? "Below threshold"
                      : trade.reason
                    }
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-text-secondary">
              <i className="fas fa-history text-4xl mb-4 text-border-color"></i>
              <p>No recent trading activity</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
