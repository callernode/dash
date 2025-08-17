import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { data: botStatus } = useQuery({
    queryKey: ["/api/bot-status"],
    refetchInterval: 5000,
  });

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "chart-line" },
    { id: "trading", label: "Trading", icon: "exchange-alt" },
    { id: "history", label: "History", icon: "history" },
    { id: "telegram", label: "Telegram Bot", icon: "telegram", brand: true },
    { id: "settings", label: "Settings", icon: "cog" },
  ];

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="w-64 bg-secondary border-r border-border-color flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border-color">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
            <i className="fas fa-robot text-primary text-lg"></i>
          </div>
          <div>
            <h1 className="font-bold text-lg text-primary">ArbiBot</h1>
            <p className="text-text-secondary text-sm">Polygon DEX</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left",
                  activeTab === item.id
                    ? "bg-accent text-primary"
                    : "text-primary hover:bg-border-color"
                )}
              >
                <i className={`fas fa-${item.icon} ${item.brand ? 'fab' : ''}`}></i>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bot Status */}
      <div className="p-4 border-t border-border-color">
        <div className="bg-border-color rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-primary">Bot Status</span>
            <div className="flex items-center space-x-1">
              <div className={cn(
                "w-2 h-2 rounded-full",
                botStatus?.isActive ? "bg-accent animate-pulse" : "bg-warning"
              )}></div>
              <span className={cn(
                "text-xs",
                botStatus?.isActive ? "text-accent" : "text-warning"
              )}>
                {botStatus?.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          <div className="text-xs text-text-secondary">
            <div>Uptime: <span>{botStatus?.uptime ? formatUptime(botStatus.uptime) : "0h 0m"}</span></div>
            <div>Cycles: <span>{botStatus?.totalCycles || 0}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
