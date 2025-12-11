import { useState, useEffect } from "react";
import { ExpandableChart } from "@/components/ExpandableChart";
import { CustomTooltip } from "@/components/CustomTooltip";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import DataUploader from "@/components/DataUploader";

// Default data for expenses and projections (these could also be separate uploads)
const defaultCategoriaDespesas = [
  { categoria: "Pessoal", valor: 195000, percentual: 35.2 },
  { categoria: "Marketing", valor: 131000, percentual: 23.6 },
  { categoria: "Operacional", valor: 88500, percentual: 16.0 },
  { categoria: "Impostos", valor: 90450, percentual: 16.3 },
  { categoria: "Diversos", valor: 49140, percentual: 8.9 },
];

const defaultPrevisaoData = [
  { month: "Jul", previsto: 720000, conservador: 680000 },
  { month: "Ago", previsto: 750000, conservador: 700000 },
  { month: "Set", previsto: 780000, conservador: 720000 },
  { month: "Out", previsto: 810000, conservador: 750000 },
];

export default function Cashflow() {
  const { getData } = useData();
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Get data from context (uploaded or sample)
  const rawData = getData('cashflow');
  
  // Transform data to match expected format
  const fluxoCaixaData = rawData.map(item => ({
    month: item.mes || item.month || '',
    entradas: Number(item.entradas) || 0,
    saidas: Number(item.saidas) || 0,
    saldo: item.saldo !== undefined ? Number(item.saldo) : (Number(item.entradas) || 0) - (Number(item.saidas) || 0)
  }));

  const categoriaDespesas = defaultCategoriaDespesas;
  const previsaoData = defaultPrevisaoData;

  const saldoAtual = fluxoCaixaData.length > 0 ? fluxoCaixaData[fluxoCaixaData.length - 1].saldo : 0;
  const saldoAnterior = fluxoCaixaData.length > 1 ? fluxoCaixaData[fluxoCaixaData.length - 2].saldo : saldoAtual;
  const variacao = saldoAnterior !== 0 ? ((saldoAtual - saldoAnterior) / saldoAnterior * 100).toFixed(1) : '0';
  
  const saldoAcumulado = fluxoCaixaData.reduce((acc, curr) => acc + curr.saldo, 0);
  const totalEntradas = fluxoCaixaData.reduce((acc, curr) => acc + curr.entradas, 0);
  const totalSaidas = fluxoCaixaData.reduce((acc, curr) => acc + curr.saidas, 0);

  const handleDataUpdated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in" key={refreshKey}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Fluxo de Caixa</h1>
          <p className="text-muted-foreground">Acompanhamento de entradas, saídas e projeções</p>
        </div>
        <DataUploader pageId="cashflow" onDataUpdated={handleDataUpdated} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="p-5 gradient-card border-border shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Saldo do Mês</h3>
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            R$ {(saldoAtual / 1000).toFixed(0)}K
          </p>
          <div className={`flex items-center mt-2 text-sm ${Number(variacao) >= 0 ? 'text-success' : 'text-destructive'}`}>
            {Number(variacao) >= 0 ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            {variacao}% vs mês anterior
          </div>
        </Card>
        
        <Card className="p-5 gradient-card border-border shadow-soft">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Entradas</h3>
          <p className="text-2xl font-bold text-success">
            R$ {(totalEntradas / 1000).toFixed(0)}K
          </p>
          <p className="text-xs text-muted-foreground mt-1">Últimos 6 meses</p>
        </Card>
        
        <Card className="p-5 gradient-card border-border shadow-soft">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Saídas</h3>
          <p className="text-2xl font-bold text-destructive">
            R$ {(totalSaidas / 1000).toFixed(0)}K
          </p>
          <p className="text-xs text-muted-foreground mt-1">Últimos 6 meses</p>
        </Card>
        
        <Card className="p-5 gradient-card border-border shadow-soft">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Saldo Acumulado</h3>
          <p className="text-2xl font-bold text-primary">
            R$ {(saldoAcumulado / 1000).toFixed(0)}K
          </p>
          <p className="text-xs text-muted-foreground mt-1">Período acumulado</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ExpandableChart 
          title="Fluxo de Caixa Mensal"
          description="Controle de todas as entradas (receitas) e saídas (pagamentos) de dinheiro. O saldo indica o resultado líquido de caixa do mês. Essencial para gerenciar a liquidez."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fluxoCaixaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<CustomTooltip valuePrefix="R$ " />} />
              <Legend />
              <Bar dataKey="entradas" fill="hsl(142 76% 36%)" name="Entradas" />
              <Bar dataKey="saidas" fill="hsl(0 84% 60%)" name="Saídas" />
              <Bar dataKey="saldo" fill="hsl(217 91% 60%)" name="Saldo" />
            </BarChart>
          </ResponsiveContainer>
        </ExpandableChart>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExpandableChart 
            title="Categorias de Despesas"
            description="Distribuição das despesas por categoria. Identifica onde o dinheiro está sendo gasto e ajuda a encontrar oportunidades de redução de custos."
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoriaDespesas} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis 
                  dataKey="categoria" 
                  type="category" 
                  stroke="hsl(var(--muted-foreground))" 
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip valuePrefix="R$ " />} />
                <Bar dataKey="valor" fill="hsl(217 91% 60%)" name="Valor" />
              </BarChart>
            </ResponsiveContainer>
          </ExpandableChart>

          <ExpandableChart 
            title="Projeção de Receita"
            description="Previsão de receitas futuras com dois cenários: Otimista (melhor caso) e Conservador (estimativa prudente). Auxilia no planejamento financeiro estratégico."
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={previsaoData}>
                <defs>
                  <linearGradient id="colorPrevisto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorConservador" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(38 92% 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(38 92% 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip valuePrefix="R$ " />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="previsto"
                  stroke="hsl(142 76% 36%)"
                  strokeWidth={2}
                  fill="url(#colorPrevisto)"
                  name="Cenário Otimista"
                />
                <Area
                  type="monotone"
                  dataKey="conservador"
                  stroke="hsl(38 92% 50%)"
                  strokeWidth={2}
                  fill="url(#colorConservador)"
                  name="Cenário Conservador"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ExpandableChart>
        </div>
      </div>

      <Card className="p-6 gradient-card border-border shadow-soft">
        <h3 className="text-lg font-semibold text-foreground mb-4">Distribuição de Despesas</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {categoriaDespesas.map((cat) => (
            <div key={cat.categoria} className="text-center">
              <p className="text-3xl font-bold text-primary mb-1">{cat.percentual}%</p>
              <p className="text-sm text-muted-foreground">{cat.categoria}</p>
              <p className="text-xs text-muted-foreground mt-1">
                R$ {(cat.valor / 1000).toFixed(0)}K
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
