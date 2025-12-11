import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface ChartCardProps {
  title: string;
  children: ReactNode;
  delay?: number;
}

export const ChartCard = ({ title, children, delay = 0 }: ChartCardProps) => {
  return (
    <Card
      className="p-6 gradient-card border-border shadow-soft hover:shadow-hover transition-all duration-300 animate-scale-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <h3 className="text-lg font-semibold text-foreground mb-4 break-words">{title}</h3>
      <div className="w-full h-[300px]">{children}</div>
    </Card>
  );
};
