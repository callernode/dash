import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function QuickActionsCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const pauseBotMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/bot/pause"),
    onSuccess: () => {
      toast({ title: "Bot paused successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/bot-status"] });
    },
    onError: () => {
      toast({ title: "Failed to pause bot", variant: "destructive" });
    },
  });

  const resumeBotMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/bot/resume"),
    onSuccess: () => {
      toast({ title: "Bot resumed successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/bot-status"] });
    },
    onError: () => {
      toast({ title: "Failed to resume bot", variant: "destructive" });
    },
  });

  const testTelegramMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/test-telegram"),
    onSuccess: () => {
      toast({ title: "Test notification sent" });
    },
    onError: () => {
      toast({ title: "Failed to send test notification", variant: "destructive" });
    },
  });

  const actions = [
    {
      label: "Pause Bot",
      icon: "pause",
      color: "hover:bg-warning hover:bg-opacity-20",
      iconColor: "text-warning",
      onClick: () => pauseBotMutation.mutate(),
      disabled: pauseBotMutation.isPending,
    },
    {
      label: "Resume Bot",
      icon: "play",
      color: "hover:bg-accent hover:bg-opacity-20",
      iconColor: "text-accent",
      onClick: () => resumeBotMutation.mutate(),
      disabled: resumeBotMutation.isPending,
    },
    {
      label: "View Logs",
      icon: "file-alt",
      color: "hover:bg-blue-500 hover:bg-opacity-20",
      iconColor: "text-blue-500",
      onClick: () => {
        toast({ title: "Logs feature coming soon" });
      },
      disabled: false,
    },
    {
      label: "Test Alert",
      icon: "telegram",
      color: "hover:bg-purple-500 hover:bg-opacity-20",
      iconColor: "text-purple-500",
      onClick: () => testTelegramMutation.mutate(),
      disabled: testTelegramMutation.isPending,
      brand: true,
    },
  ];

  return (
    <Card className="bg-secondary border-border-color">
      <CardHeader className="border-b border-border-color">
        <CardTitle className="text-lg font-semibold flex items-center text-primary">
          <i className="fas fa-bolt mr-2 text-warning"></i>
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`p-4 bg-border-color ${action.color} rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <i className={`${action.brand ? 'fab' : 'fas'} fa-${action.icon} ${action.iconColor} mb-2`}></i>
              <div className="text-sm font-medium text-primary">{action.label}</div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
