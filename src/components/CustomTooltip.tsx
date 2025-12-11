import { Card } from "@/components/ui/card";

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  valuePrefix?: string;
}

export const CustomTooltip = ({ active, payload, label, valuePrefix = "" }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <Card className="p-4 border-border shadow-medium bg-card/95 backdrop-blur-sm">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-foreground">
            {valuePrefix}
            {typeof entry.value === "number"
              ? entry.value.toLocaleString("pt-BR")
              : entry.value}
          </span>
        </div>
      ))}
    </Card>
  );
};
