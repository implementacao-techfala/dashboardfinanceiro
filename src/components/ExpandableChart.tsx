import { ReactNode, useState } from "react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Maximize2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ExpandableChartProps {
  title: string;
  children: ReactNode;
  delay?: number;
  description?: string;
}

export const ExpandableChart = ({ title, children, delay = 0, description }: ExpandableChartProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <Card
        className="p-6 gradient-card border-border shadow-soft hover:shadow-hover transition-all duration-300 animate-scale-in relative group hover:z-10"
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground break-words">{title}</h3>
            {description && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help hover:text-primary transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-sm">{description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        <div className="w-full h-[300px] relative">
          {children}
          <Button
            variant="ghost"
            size="icon"
            className="absolute bottom-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-primary/20 backdrop-blur-sm hover:bg-primary/30 border border-primary/40"
            onClick={() => setIsExpanded(true)}
          >
            <Maximize2 className="h-4 w-4 text-primary" />
          </Button>
        </div>
      </Card>

      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-6xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {title}
              {description && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p className="text-sm">{description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="w-full h-full pb-8">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
