// lib/monitoring/alerts.ts
interface Alert {
  id: string;
  message: string;
  timestamp: Date;
  severity: "info" | "warning" | "error";
  resolved: boolean;
}

class AlertSystem {
  private alerts: Alert[] = [];
  private subscribers: ((alert: Alert) => void)[] = [];

  createAlert(message: string, severity: "info" | "warning" | "error" = "info"): Alert {
    const newAlert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      timestamp: new Date(),
      severity,
      resolved: false,
    };
    this.alerts.push(newAlert);
    this.notifySubscribers(newAlert);
    console.warn(`ALERT [${severity.toUpperCase()}]: ${message}`);
    return newAlert;
  }

  getAlerts(filter?: { severity?: Alert["severity"]; resolved?: boolean }): Alert[] {
    return this.alerts.filter(alert => {
      let match = true;
      if (filter?.severity && alert.severity !== filter.severity) {
        match = false;
      }
      if (typeof filter?.resolved === "boolean" && alert.resolved !== filter.resolved) {
        match = false;
      }
      return match;
    });
  }

  resolveAlert(id: string): boolean {
    const alertIndex = this.alerts.findIndex(alert => alert.id === id);
    if (alertIndex > -1) {
      this.alerts[alertIndex].resolved = true;
      return true;
    }
    return false;
  }

  subscribe(callback: (alert: Alert) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers(alert: Alert): void {
    this.subscribers.forEach(callback => callback(alert));
  }
}

export const alertSystem = new AlertSystem();

// Example usage for scraping success rate
export function checkScrapingSuccessRate(successRate: number) {
  if (successRate < 80) {
    alertSystem.createAlert(
      `Scraping success rate dropped to ${successRate}% which is below 80%!`,
      "error"
    );
  } else if (successRate < 90) {
    alertSystem.createAlert(
      `Scraping success rate is ${successRate}%, consider investigating.`,
      "warning"
    );
  }
}
