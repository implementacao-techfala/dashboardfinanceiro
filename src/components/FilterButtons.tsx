import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterButtonsProps {
  filters: { label: string; value: string }[];
  currentValue?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export const FilterButtons = ({ filters, currentValue, onValueChange, placeholder = "Todos" }: FilterButtonsProps) => {
  return (
    <div className="flex gap-2 items-center">
      <span className="text-sm font-medium text-muted-foreground">Filtrar:</span>
      <Select value={currentValue || "all"} onValueChange={(val) => onValueChange(val === "all" ? "" : val)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {filters.map((filter) => (
            <SelectItem key={filter.value} value={filter.value}>
              {filter.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
