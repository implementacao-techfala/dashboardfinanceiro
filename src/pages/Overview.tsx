import { useMemo, useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Activity, Info, AlertTriangle } from "lucide-react";
import { ExpandableChart } from "@/components/ExpandableChart";
import { FilterBadges } from "@/components/FilterBadges";
import { CustomTooltip } from "@/components/CustomTooltip";
import { AccountSelector } from "@/components/AccountSelector";
import PageDataActions from "@/components/PageDataActions";
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

const formatCurrencyShort = (value: number) => {
  if (!Number.isFinite(value)) return "—";
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(3)}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}K`;
  return `R$ ${Math.round(value).toLocaleString("pt-BR")}`;
};

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value)) return "—";
  return `R$ ${Math.round(value).toLocaleString("pt-BR")}`;
};

const formatPct = (value: number) => {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(2)}%`;
};

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
  const crescimentoMRR = mrrAnterior ? (((mrrAtual - mrrAnterior) / mrrAnterior) * 100) : 0;

  const churnAtual = mrrData[mrrData.length - 1]?.churn || 0;
  const churnAnterior = mrrData[mrrData.length - 2]?.churn || 0;
  const churnRateAtual = mrrAnterior > 0 ? (churnAtual / mrrAnterior) * 100 : NaN;
  const churnRateAnterior = (mrrData[mrrData.length - 3]?.mrr || 0) > 0 ? (churnAnterior / (mrrData[mrrData.length - 3]?.mrr || 0)) * 100 : NaN;

  const receitaAtual = receitaPorColaborador[receitaPorColaborador.length - 1]?.receita ?? NaN;
  const receitaAnterior = receitaPorColaborador[receitaPorColaborador.length - 2]?.receita ?? NaN;
  const receitaPorColabAtual = receitaPorColaboradorRaw[receitaPorColaboradorRaw.length - 1]?.colaboradores
    ? receitaAtual / Number(receitaPorColaboradorRaw[receitaPorColaboradorRaw.length - 1]?.colaboradores)
    : NaN;
  const receitaPorColabAnterior = receitaPorColaboradorRaw[receitaPorColaboradorRaw.length - 2]?.colaboradores
    ? receitaAnterior / Number(receitaPorColaboradorRaw[receitaPorColaboradorRaw.length - 2]?.colaboradores)
    : NaN;
  const crescimentoReceitaPorColab =
    Number.isFinite(receitaPorColabAtual) && Number.isFinite(receitaPorColabAnterior) && receitaPorColabAnterior !== 0
      ? ((receitaPorColabAtual - receitaPorColabAnterior) / receitaPorColabAnterior) * 100
      : NaN;

  const kpiMetrics = useMemo(() => {
    const hasMRR = mrrData.length > 0;
    const hasProd = receitaPorColaborador.length > 0;

    return [
      {
        label: "MRR Atual",
        value: hasMRR ? formatCurrencyShort(mrrAtual) : "—",
        previous: hasMRR ? formatCurrencyShort(mrrAnterior) : "—",
        change: hasMRR ? crescimentoMRR : NaN,
        period: hasMRR ? `${formatCurrency(mrrAtual - mrrAnterior)} vs mês anterior` : "Sem dados carregados",
        tooltip:
          "MRR (Monthly Recurring Revenue) é a receita recorrente mensal. Mostra previsibilidade de receita em negócios de assinatura.",
      },
      {
        label: "Churn (MRR)",
        value: hasMRR ? formatPct(churnRateAtual) : "—",
        previous: hasMRR ? formatPct(churnRateAnterior) : "—",
        change:
          Number.isFinite(churnRateAtual) && Number.isFinite(churnRateAnterior)
            ? churnRateAnterior !== 0
              ? ((churnRateAtual - churnRateAnterior) / churnRateAnterior) * 100
              : NaN
            : NaN,
        period: hasMRR ? `Churn: ${formatCurrency(churnAtual)} no mês` : "Sem dados carregados",
        tooltip:
          "Churn de MRR estimado: churn do mês dividido pelo MRR do mês anterior (aproximação).",
      },
      {
        label: "LTV/CAC Ratio",
        value: "—",
        previous: "—",
        change: NaN,
        period: "Defina LTV e CAC no modelo para calcular",
        tooltip:
          "Este KPI depende de dados de LTV e CAC, que não estão no template atual. Quando adicionarmos, ele passa a ser calculado.",
      },
      {
        label: "Receita/Colaborador",
        value: hasProd ? formatCurrency(Math.round(receitaPorColabAtual)) : "—",
        previous: hasProd ? formatCurrency(Math.round(receitaPorColabAnterior)) : "—",
        change: hasProd ? crescimentoReceitaPorColab : NaN,
        period: hasProd ? "Derivado de Receita e Colaboradores" : "Sem dados carregados",
        tooltip:
          "Produtividade: receita do mês dividida pelo número de colaboradores do mês (aba Produtividade).",
      },
    ] as const;
  }, [
    mrrData.length,
    receitaPorColaborador.length,
    mrrAtual,
    mrrAnterior,
    churnAtual,
    churnRateAtual,
    churnRateAnterior,
    crescimentoMRR,
    receitaPorColabAtual,
    receitaPorColabAnterior,
    crescimentoReceitaPorColab,
  ]);

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Visão Executiva</h1>
          <p className="text-muted-foreground">Dashboard do CEO - Principais indicadores do Grupo FN</p>
        </div>
        <div className="flex items-center gap-3">
          <PageDataActions pageId="overview" onDataUpdated={() => setRefreshKey(k => k + 1)} />
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
                  Number.isFinite(metric.change)
                    ? metric.change >= 0
                      ? "text-success"
                      : "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {Number.isFinite(metric.change) ? (
                  metric.change >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )
                ) : (
                  <Activity className="h-3 w-3 mr-1" />
                )}
                {Number.isFinite(metric.change) ? `${Math.abs(metric.change).toFixed(1)}%` : "—"}
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
          <h3 className="text-lg font-semibold text-foreground mb-6">KPIs Críticos</h3>
          {mrrData.length === 0 && receitaPorColaborador.length === 0 ? (
            <div className="text-sm text-muted-foreground">Sem dados carregados. Importe os CSVs de Overview para ver insights.</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <Activity className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Crescimento MRR</p>
                  <p className="text-xs text-muted-foreground">
                    {Number.isFinite(crescimentoMRR) ? `${crescimentoMRR.toFixed(1)}% MoM` : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Churn (MRR)</p>
                  <p className="text-xs text-muted-foreground">
                    {Number.isFinite(churnRateAtual) ? `${churnRateAtual.toFixed(2)}%` : "—"} • {formatCurrency(churnAtual)} no mês
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg border border-success/20">
                <Activity className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Receita/Colaborador</p>
                  <p className="text-xs text-muted-foreground">
                    {Number.isFinite(receitaPorColabAtual) ? formatCurrency(Math.round(receitaPorColabAtual)) : "—"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
