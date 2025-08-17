interface HeaderProps {
  title: string;
  isConnected: boolean;
}

export default function Header({ title, isConnected }: HeaderProps) {
  return (
    <header className="bg-secondary border-b border-border-color px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-primary">{title}</h2>
          <p className="text-text-secondary text-sm">USDT-XSGD-USDT Arbitrage Monitor</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Network Status */}
          <div className="flex items-center space-x-2 bg-border-color px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-accent rounded-full"></div>
            <span className="text-xs text-primary">Polygon</span>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center space-x-2 bg-border-color px-3 py-1 rounded-full">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-accent' : 'bg-danger'}`}></div>
            <span className="text-xs text-primary">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          {/* Last Update */}
          <div className="text-xs text-text-secondary">
            Last update: <span>{isConnected ? 'Live' : 'Connecting...'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
