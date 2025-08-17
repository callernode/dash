import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

export default function StatsGrid() {
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    refetchInterval: 10000,
  });

  const statCards = [
    {
      title: "Total Profit (24h)",
      value: stats?.totalProfit ? `+$${stats.totalProfit}` : "$0.00",
      icon: "chart-line",
      color: "text-accent",
      subtitle: "from yesterday",
      change: "+2.3%",
    },
    {
      title: "Successful Trades",
      value: stats?.successfulTrades || 0,
      icon: "check-circle",
      color: "text-accent",
      subtitle: `Win rate: ${stats?.winRate || 0}%`,
      change: null,
    },
    {
      title: "Avg Profit/Trade",
      value: stats?.avgProfit ? `${((parseFloat(stats.avgProfit) / 400) * 100).toFixed(2)}%` : "0.00%",
      icon: "percentage",
      color: "text-warning",
      subtitle: "Target: 1.0%+",
      change: null,
    },
    {
      title: "Gas Spent",
      value: stats?.gasSpent ? `$${stats.gasSpent}` : "$0.00",
      icon: "fire",
      color: "text-danger",
      subtitle: `Avg: $${stats?.successfulTrades ? (parseFloat(stats.gasSpent) / stats.successfulTrades).toFixed(2) : '0.00'}/trade`,
      change: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="bg-secondary border-border-color">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-text-secondary text-sm">{stat.title}</h3>
              <i className={`fas fa-${stat.icon} ${stat.color}`}></i>
            </div>
            <div className={`text-2xl font-bold font-mono ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-xs text-text-secondary mt-1">
              {stat.change && <span className="text-accent">{stat.change}</span>} {stat.subtitle}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
