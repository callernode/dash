import { useWebSocket } from "@/hooks/useWebSocket";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  title: string;
}

export default function Layout({ children, activeTab, onTabChange, title }: LayoutProps) {
  const { isConnected } = useWebSocket();

  return (
    <div className="flex h-screen overflow-hidden bg-primary text-primary">
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} isConnected={isConnected} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
