import { createContext, useContext, useState, ReactNode } from "react";

interface Filters {
  month?: string;
  region?: string;
  category?: string;
  businessUnit?: string;
  account?: string;
}

interface FilterContextType {
  filters: Filters;
  setFilter: (key: keyof Filters, value: string | undefined) => void;
  clearFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const ACCOUNTS = [
  { id: "all", name: "Todas as Contas" },
  { id: "zov", name: "Conta 1" },
  { id: "papaya", name: "Conta 2" },
  { id: "mdias", name: "Conta 3" },
];

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<Filters>({ account: "all" });

  const setFilter = (key: keyof Filters, value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({ account: "all" });
  };

  return (
    <FilterContext.Provider value={{ filters, setFilter, clearFilters }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilters must be used within FilterProvider");
  }
  return context;
};
