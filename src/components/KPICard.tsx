import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";

type KPIVariant = "default" | "success" | "warning" | "info" | "primary";

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  subtitle?: string;
  icon: LucideIcon;
  delay?: number;
  variant?: KPIVariant;
}

const variantStyles: Record<KPIVariant, { accent: string; bg: string; iconBg: string }> = {
  default: {
    accent: "hsl(237 100% 67%)",
    bg: "rgba(87, 95, 255, 0.03)",
    iconBg: "rgba(87, 95, 255, 0.08)",
  },
  success: {
    accent: "hsl(142 76% 36%)",
    bg: "rgba(34, 197, 94, 0.03)",
    iconBg: "rgba(34, 197, 94, 0.08)",
  },
  warning: {
    accent: "hsl(38 92% 50%)",
    bg: "rgba(245, 158, 11, 0.03)",
    iconBg: "rgba(245, 158, 11, 0.08)",
  },
  info: {
    accent: "hsl(217 91% 60%)",
    bg: "rgba(59, 130, 246, 0.03)",
    iconBg: "rgba(59, 130, 246, 0.08)",
  },
  primary: {
    accent: "hsl(237 80% 58%)",
    bg: "rgba(65, 65, 233, 0.03)",
    iconBg: "rgba(65, 65, 233, 0.08)",
  },
};

export const KPICard = ({ 
  title, 
  value, 
  change, 
  subtitle,
  icon: Icon, 
  delay = 0,
  variant = "default"
}: KPICardProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const isPositive = change !== undefined ? change >= 0 : true;
  const styles = variantStyles[variant];

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Card
      className={`relative overflow-hidden p-5 border shadow-sm hover:shadow-md transition-all duration-300 ${
        isVisible ? "animate-slide-up" : "opacity-0"
      }`}
      style={{
        background: `linear-gradient(135deg, ${styles.bg} 0%, transparent 100%)`,
        borderColor: 'hsl(var(--border))',
      }}
    >
      {/* Background icon */}
      <div 
        className="absolute -right-4 -bottom-4 opacity-[0.04]"
        style={{ color: styles.accent }}
      >
        <Icon className="h-32 w-32" strokeWidth={1} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header with title and badge */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80 leading-tight max-w-[70%]">
            {title}
          </h3>
          <div 
            className="p-2 rounded-lg"
            style={{ background: styles.iconBg }}
          >
            <Icon className="h-4 w-4" style={{ color: styles.accent }} strokeWidth={2} />
          </div>
        </div>

        {/* Value - dominant */}
        <p 
          className="text-3xl font-bold tracking-tight mb-1"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          {value}
        </p>

        {/* Footer: change badge or subtitle */}
        <div className="flex items-center gap-2 mt-2">
          {change !== undefined && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isPositive 
                  ? "bg-success/10 text-success" 
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {isPositive ? "+" : ""}{change}%
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-muted-foreground/70">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};