import { useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Activity, Info, AlertTriangle } from "lucide-react";
import { ExpandableChart } from "@/components/ExpandableChart";
import { FilterBadges } from "@/components/FilterBadges";
import { CustomTooltip } from "@/components/CustomTooltip";
import { AccountSelector } from "@/components/AccountSelector";
import DataUploader from "@/components/DataUploader";
import { useFilters } from "@/contexts/FilterContext";
import { useData } from "@/contexts/DataContext";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from "recharts";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// KPI metrics configuration (static display config)

const kpiMetrics = [
  { 
    label: "MRR Atual", 
    value: "R$ 1.125M", 
    previous: "R$ 1.057M",
    change: 6.4,
    period: "+R$ 68K vs mês anterior",
    tooltip: "MRR (Monthly Recurring Revenue) é a receita recorrente mensal. Métrica fundamental para negócios baseados em assinatura, mostra a previsibilidade de receita."
  },
  { 
    label: "Churn Rate", 
    value: "0.67%", 
    previous: "0.95%",
    change: -29.5,
    period: "Meta: < 2% (✓ Atingido)",
    tooltip: "Taxa de cancelamento de clientes. Quanto menor, melhor. Indica a capacidade de reter clientes e a qualidade do serviço prestado."
  },
  { 
    label: "LTV/CAC Ratio", 
    value: "4.37x", 
    previous: "3.61x",
    change: 21.1,
    period: "Ideal: > 3.0x (✓ Saudável)",
    tooltip: "Relação entre Lifetime Value (valor que o cliente gera) e Customer Acquisition Cost (custo para adquirir). Acima de 3x indica negócio saudável e escalável."
  },
  { 
    label: "Receita/Colaborador", 
    value: "R$ 11.250", 
    previous: "R$ 10.570",
    change: 6.4,
    period: "100 colaboradores",
    tooltip: "Produtividade da equipe medida pela receita gerada por cada colaborador. Quanto maior, mais eficiente a operação."
  },
];

export default function Overview() {
  const { filters, setFilter } = useFilters();
  const { getData } = useData();
  const [refreshKey, setRefreshKey] = useState(0);

  // Get data from context
  const mrrDataRaw = getData('overview', 'MRR');
  const receitaPorColaboradorRaw = getData('overview', 'Produtividade');

  const allMRRData = mrrDataRaw.map((item: any) => ({
    month: item.month || item.mes || '',
    mrr: Number(item.mrr) || 0,
    novos: Number(item.novos) || 0,
    churn: Number(item.churn) || 0,
    expansao: Number(item.expansao) || 0,
  }));

  const receitaPorColaborador = receitaPorColaboradorRaw.map((item: any) => ({
    month: item.month || item.mes || '',
    receita: Number(item.receita) || 0,
  }));

  const mrrData = filters.month
    ? allMRRData.filter((d) => d.month === filters.month)
    : allMRRData;

  const handleMRRClick = (data: any) => {
    if (data && data.activeLabel) {
      setFilter("month", filters.month === data.activeLabel ? undefined : data.activeLabel);
      toast.success(
        filters.month === data.activeLabel
          ? "Filtro removido"
          : `Filtrado por: ${data.activeLabel}`
      );
    }
  };

  const mrrAtual = mrrData[mrrData.length - 1]?.mrr || 0;
  const mrrAnterior = mrrData[mrrData.length - 2]?.mrr || 0;
  const crescimentoMRR = mrrAnterior ? (((mrrAtual - mrrAnterior) / mrrAnterior) * 100).toFixed(1) : "0";

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Visão Executiva</h1>
          <p className="text-muted-foreground">Dashboard do CEO - Principais indicadores do Grupo FN</p>
        </div>
        <div className="flex items-center gap-3">
          <DataUploader pageId="overview" onDataUpdated={() => setRefreshKey(k => k + 1)} />
          <AccountSelector />
        </div>
      </div>

      <FilterBadges />

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiMetrics.map((metric, index) => (
          <Card
            key={metric.label}
            className="p-5 gradient-card border-border shadow-soft hover:shadow-hover transition-all duration-300 animate-slide-up"
            style={{ animationDelay: `${500 + index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-muted-foreground break-words">{metric.label}</h3>
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help hover:text-primary transition-colors flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="text-sm">{metric.tooltip}</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-end justify-between mb-2">
              <p className="text-2xl font-bold text-foreground break-words">{metric.value}</p>
              <div
                className={`flex items-center text-xs font-medium flex-shrink-0 ${
                  metric.change >= 0 && !metric.label.includes("Churn") ? "text-success" : 
                  metric.change < 0 && metric.label.includes("Churn") ? "text-success" :
                  "text-destructive"
                }`}
              >
                {metric.change >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(metric.change)}%
              </div>
            </div>
            <p className="text-xs text-muted-foreground break-words">{metric.previous}</p>
            <p className="text-xs text-muted-foreground mt-1 break-words">{metric.period}</p>
          </Card>
        ))}
      </div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpandableChart 
          title="Evolução do MRR - Receita Recorrente Mensal" 
          delay={900}
          description="MRR (Monthly Recurring Revenue) é a receita recorrente mensal. Mostra a previsibilidade de faturamento e saúde financeira do negócio."
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mrrData} onClick={handleMRRClick}>
              <defs>
                <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<CustomTooltip valuePrefix="R$ " />} />
              <Area
                type="monotone"
                dataKey="mrr"
                stroke="hsl(217 91% 60%)"
                strokeWidth={3}
                fill="url(#colorMRR)"
                name="MRR Total"
                cursor="pointer"
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ExpandableChart>

        <ExpandableChart 
          title="Composição do Crescimento MRR" 
          delay={1000}
          description="Detalha como o MRR cresceu: novos clientes (verde), expansão de receita de clientes existentes (azul), e churn/perdas (vermelho)."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mrrData} onClick={handleMRRClick}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<CustomTooltip valuePrefix="R$ " />} />
              <Legend />
              <Bar dataKey="novos" fill="hsl(142 76% 36%)" name="Novos Clientes" stackId="a" cursor="pointer" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expansao" fill="hsl(217 91% 60%)" name="Expansão" stackId="a" cursor="pointer" />
              <Bar dataKey="churn" fill="hsl(0 84% 60%)" name="Churn" stackId="a" cursor="pointer" />
            </BarChart>
          </ResponsiveContainer>
        </ExpandableChart>

        <ExpandableChart 
          title="Receita por Colaborador (Eficiência Operacional)" 
          delay={1100}
          description="Mede a produtividade da equipe dividindo a receita total pelo número de colaboradores. Quanto maior, mais eficiente a operação."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={receitaPorColaborador}>
              <defs>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<CustomTooltip valuePrefix="R$ " />} />
              <Line
                type="monotone"
                dataKey="receita"
                stroke="hsl(142 76% 36%)"
                strokeWidth={3}
                name="Receita/Colab"
                cursor="pointer"
                dot={{ fill: "hsl(142 76% 36%)", r: 6, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 8 }}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </ExpandableChart>

        <Card className="p-6 gradient-card border-border shadow-soft">
          <h3 className="text-lg font-semibold text-foreground mb-6">KPIs Críticos - Atenção!</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg border border-success/20">
              <Activity className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Churn Rate Saudável</p>
                <p className="text-xs text-muted-foreground">0.67% - Abaixo da meta de 2%</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg border border-success/20">
              <Activity className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">LTV/CAC Excelente</p>
                <p className="text-xs text-muted-foreground">4.37x - Muito acima do ideal (3.0x)</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Inadimplência - Monitorar</p>
                <p className="text-xs text-muted-foreground">3.2% (R$ 36K) - Meta: &lt; 3% - Leve atenção necessária para evitar aumento do índice</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <Activity className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Crescimento MRR</p>
                <p className="text-xs text-muted-foreground">+6.4% MoM - Ritmo sustentável</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg border border-success/20">
              <Activity className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Base de Clientes</p>
                <p className="text-xs text-muted-foreground">1.542 ativos - Meta: 1.500+ (✓)</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
