import { useFilters, ACCOUNTS } from "@/contexts/FilterContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

export function AccountSelector() {
  const { filters, setFilter } = useFilters();

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select
        value={filters.account || "all"}
        onValueChange={(value) => setFilter("account", value)}
      >
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue placeholder="Selecione a conta" />
        </SelectTrigger>
        <SelectContent>
          {ACCOUNTS.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              {account.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
