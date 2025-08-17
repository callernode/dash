import { useState } from "react";
import Layout from "@/components/Layout";
import StatsGrid from "@/components/StatsGrid";
import PriceMonitorCard from "@/components/PriceMonitorCard";
import TradingActivityCard from "@/components/TradingActivityCard";
import QuickActionsCard from "@/components/QuickActionsCard";
import TradingInterface from "@/components/TradingInterface";
import TransactionHistory from "@/components/TransactionHistory";
import TelegramSettings from "@/components/TelegramSettings";
import SystemSettings from "@/components/SystemSettings";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <StatsGrid />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PriceMonitorCard />
              <TradingActivityCard />
            </div>
            <QuickActionsCard />
          </div>
        );
      case "trading":
        return <TradingInterface />;
      case "history":
        return <TransactionHistory />;
      case "telegram":
        return <TelegramSettings />;
      case "settings":
        return <SystemSettings />;
      default:
        return null;
    }
  };

  const getTabTitle = () => {
    const titleMap = {
      dashboard: "Dashboard",
      trading: "Trading Interface",
      history: "Transaction History",
      telegram: "Telegram Bot Settings",
      settings: "System Settings",
    };
    return titleMap[activeTab as keyof typeof titleMap] || "Dashboard";
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} title={getTabTitle()}>
      {renderTabContent()}
    </Layout>
  );
}
