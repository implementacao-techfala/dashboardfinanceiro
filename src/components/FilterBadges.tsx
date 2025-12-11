import { Badge } from "@/components/ui/badge";
import { X, Filter, Trash2 } from "lucide-react";
import { useFilters, ACCOUNTS } from "@/contexts/FilterContext";
import { Button } from "@/components/ui/button";

export const FilterBadges = () => {
  const { filters, setFilter, clearFilters } = useFilters();

  // Don't show "all" account as an active filter - it's the default state
  const activeFilters = Object.entries(filters).filter(
    ([key, value]) => value && !(key === "account" && value === "all")
  );

  const hasFilters = activeFilters.length > 0;

  if (!hasFilters) return null;

  const filterLabels: Record<string, string> = {
    month: "Mês",
    region: "Região",
    category: "Categoria",
    businessUnit: "Unidade",
    account: "Conta",
  };

  const getDisplayValue = (key: string, value: string) => {
    if (key === "account") {
      const account = ACCOUNTS.find((a) => a.id === value);
      return account?.name || value;
    }
    return value;
  };

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent rounded-xl border border-primary/10 animate-slide-up">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter className="h-4 w-4 text-primary/60" />
        <span>Filtros:</span>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        {activeFilters.map(([key, value]) => (
          <Badge
            key={key}
            variant="secondary"
            className="gap-2 pl-3 pr-2 py-1.5 bg-primary/10 hover:bg-primary/15 border border-primary/20 text-foreground transition-all duration-200 group"
          >
            <span className="text-xs font-medium">
              <span className="text-muted-foreground">{filterLabels[key]}:</span>{" "}
              <span className="text-foreground">{getDisplayValue(key, value as string)}</span>
            </span>
            <button
              onClick={() => setFilter(key as keyof typeof filters, undefined)}
              className="p-0.5 rounded-full hover:bg-destructive/20 hover:text-destructive transition-colors"
              aria-label={`Remover filtro ${filterLabels[key]}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={clearFilters}
        className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors gap-1.5"
      >
        <Trash2 className="h-3 w-3" />
        Limpar
      </Button>
    </div>
  );
};
