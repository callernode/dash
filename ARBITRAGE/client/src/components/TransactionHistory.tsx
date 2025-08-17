import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default function TransactionHistory() {
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const { data: transactionData, isLoading } = useQuery({
    queryKey: ["/api/transactions", currentPage, limit],
    queryFn: async () => {
      const response = await fetch(`/api/transactions?page=${currentPage}&limit=${limit}`);
      return response.json();
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      success: { variant: "default" as const, icon: "check", label: "Success" },
      failed: { variant: "destructive" as const, icon: "times", label: "Failed" },
      skipped: { variant: "secondary" as const, icon: "pause", label: "Skipped" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.failed;

    return (
      <Badge variant={config.variant} className="inline-flex items-center">
        <i className={`fas fa-${config.icon} mr-1`}></i>
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    return type === "arbitrage" ? (
      <Badge variant="outline" className="bg-accent bg-opacity-20 text-accent border-accent">
        Arbitrage
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-warning bg-opacity-20 text-warning border-warning">
        Skip
      </Badge>
    );
  };

  const exportHistory = () => {
    // In a real implementation, this would generate and download a CSV file
    alert("Export functionality would be implemented here");
  };

  const refreshHistory = () => {
    window.location.reload();
  };

  if (isLoading) {
    return (
      <Card className="bg-secondary border-border-color">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <i className="fas fa-spinner fa-spin text-4xl text-accent mb-4"></i>
            <p className="text-text-secondary">Loading transaction history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-secondary border-border-color">
      <CardHeader className="border-b border-border-color">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center text-primary">
              <i className="fas fa-history mr-2 text-accent"></i>
              Transaction History
            </CardTitle>
            <p className="text-text-secondary text-sm">Complete arbitrage trading history</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportHistory}
              className="bg-border-color hover:bg-accent hover:bg-opacity-20 border-border-color text-primary"
            >
              <i className="fas fa-download mr-1"></i>
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshHistory}
              className="bg-border-color hover:bg-accent hover:bg-opacity-20 border-border-color text-primary"
            >
              <i className="fas fa-sync-alt mr-1"></i>
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-border-color">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Profit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Gas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Net</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-color">
            {transactionData?.transactions?.map((tx: any) => (
              <tr key={tx.id} className="hover:bg-border-color hover:bg-opacity-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-primary">
                  {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {getTypeBadge(tx.type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-primary">
                  ${parseFloat(tx.amount).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-accent">
                  {tx.profit ? `+$${parseFloat(tx.profit).toFixed(2)}` : "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-danger">
                  {tx.gasFee ? `-$${parseFloat(tx.gasFee).toFixed(2)}` : "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-semibold text-accent">
                  {tx.netProfit ? `+$${parseFloat(tx.netProfit).toFixed(2)}` : tx.reason}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(tx.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CardContent className="p-6 border-t border-border-color">
        <div className="flex items-center justify-between">
          <div className="text-sm text-text-secondary">
            Showing <span className="font-medium">{((currentPage - 1) * limit) + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(currentPage * limit, transactionData?.pagination?.total || 0)}
            </span> of{" "}
            <span className="font-medium">{transactionData?.pagination?.total || 0}</span> transactions
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="bg-border-color border-border-color text-primary disabled:opacity-50"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage >= (transactionData?.pagination?.pages || 1)}
              className="bg-border-color border-border-color text-primary disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
