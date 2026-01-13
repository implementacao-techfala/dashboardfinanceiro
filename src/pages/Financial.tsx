import { useState, useMemo } from "react";
import { ExpandableChart } from "@/components/ExpandableChart";
import { FilterBadges } from "@/components/FilterBadges";
import { CustomTooltip } from "@/components/CustomTooltip";
import PageDataActions from "@/components/PageDataActions";
import { useFilters } from "@/contexts/FilterContext";
import { useData } from "@/contexts/DataContext";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

export default function Financial() {
  const { filters, setFilter } = useFilters();
  const { getData } = useData();
  const [refreshKey, setRefreshKey] = useState(0);

  // Buscar dados do DataContext
  const lancamentosRaw = getData('financial', 'Lancamentos');
  const contasReceberRaw = getData('financial', 'Contas_Receber');
  const orcadoRealizadoRaw = getData('financial', 'Orcado_Realizado');

  // Processar dados de DRE a partir dos lançamentos
  const dreData = useMemo(() => {
    const monthly: Record<string, { receitaBruta: number; impostos: number; custos: number; despesas: number }> = {};
    
    lancamentosRaw.forEach((lanc: any) => {
      const date = new Date(lanc.data);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      const month = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);
      
      if (!monthly[month]) {
        monthly[month] = { receitaBruta: 0, impostos: 0, custos: 0, despesas: 0 };
      }
      
      const valor = Number(lanc.valor) || 0;
      const categoria = (lanc.categoria || '').toLowerCase();
      
      if (lanc.tipo === 'Receita') {
        monthly[month].receitaBruta += valor;
      } else if (lanc.tipo === 'Despesa') {
        if (categoria.includes('imposto') || categoria.includes('tributo')) {
          monthly[month].impostos += valor;
        } else if (categoria.includes('custo') || categoria.includes('operacional')) {
          monthly[month].custos += valor;
        } else {
          monthly[month].despesas += valor;
        }
      }
    });

    // Se não há dados processados, retornar dados de exemplo
    const result = Object.entries(monthly).map(([month, data]) => ({
      month,
      receitaBruta: data.receitaBruta,
      impostos: data.impostos,
      receitaLiquida: data.receitaBruta - data.impostos,
      custos: data.custos,
      despesas: data.despesas,
      lucro: data.receitaBruta - data.impostos - data.custos - data.despesas
    }));

    return result;
  }, [lancamentosRaw, refreshKey]);

  // Calcular indicadores financeiros
  const indicadores = useMemo(() => {
    const totalReceita = dreData.reduce((acc, curr) => acc + curr.receitaLiquida, 0);
    const totalLucro = dreData.reduce((acc, curr) => acc + curr.lucro, 0);
    
    return [
      { indicador: "Liquidez Corrente", valor: 2.8 },
      { indicador: "Liquidez Seca", valor: 2.1 },
      { indicador: "Endividamento", valor: 35 },
      { indicador: "ROE (%)", valor: totalReceita > 0 ? Number(((totalLucro / totalReceita) * 100).toFixed(1)) : 18.5 },
      { indicador: "ROA (%)", valor: 12.3 },
    ];
  }, [dreData]);

  const filteredDreData = filters.month
    ? dreData.filter((d) => d.month === filters.month)
    : dreData;

  const handleDREClick = (data: any) => {
    if (data && data.activeLabel) {
      setFilter("month", filters.month === data.activeLabel ? undefined : data.activeLabel);
      toast.success(
        filters.month === data.activeLabel
          ? "Filtro removido"
          : `Filtrado por: ${data.activeLabel}`
      );
    }
  };

  const totalReceita = filteredDreData.reduce((acc, curr) => acc + curr.receitaLiquida, 0);
  const totalCustos = filteredDreData.reduce((acc, curr) => acc + curr.custos, 0);
  const totalDespesas = filteredDreData.reduce((acc, curr) => acc + curr.despesas, 0);
  const totalLucro = filteredDreData.reduce((acc, curr) => acc + curr.lucro, 0);

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Financeiro & DRE</h1>
          <p className="text-muted-foreground">Demonstrativo de Resultado e análise contábil</p>
        </div>
        <PageDataActions pageId="financial" onDataUpdated={() => setRefreshKey(k => k + 1)} />
      </div>

      <FilterBadges />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="p-5 gradient-card border-border shadow-soft">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Receita Líquida</h3>
          <p className="text-2xl font-bold text-foreground">
            R$ {(totalReceita / 1000).toFixed(0)}K
          </p>
          <p className="text-xs text-success mt-1">100%</p>
        </Card>
        <Card className="p-5 gradient-card border-border shadow-soft">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Custos</h3>
          <p className="text-2xl font-bold text-foreground">
            R$ {(totalCustos / 1000).toFixed(0)}K
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalReceita > 0 ? ((totalCustos / totalReceita) * 100).toFixed(1) : 0}%
          </p>
        </Card>
        <Card className="p-5 gradient-card border-border shadow-soft">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Despesas</h3>
          <p className="text-2xl font-bold text-foreground">
            R$ {(totalDespesas / 1000).toFixed(0)}K
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalReceita > 0 ? ((totalDespesas / totalReceita) * 100).toFixed(1) : 0}%
          </p>
        </Card>
        <Card className="p-5 gradient-card border-border shadow-soft">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Lucro Líquido</h3>
          <p className="text-2xl font-bold text-success">
            R$ {(totalLucro / 1000).toFixed(0)}K
          </p>
          <p className="text-xs text-success mt-1">
            {totalReceita > 0 ? ((totalLucro / totalReceita) * 100).toFixed(1) : 0}%
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ExpandableChart 
          title="DRE - Demonstrativo de Resultado"
          description="Demonstrativo de Resultado do Exercício (DRE): análise mensal da Receita Líquida, Custos Operacionais, Despesas Administrativas e Lucro Líquido."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredDreData} onClick={handleDREClick}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<CustomTooltip valuePrefix="R$ " />} />
              <Legend />
              <Bar dataKey="receitaLiquida" fill="hsl(217 91% 60%)" name="Receita Líquida" cursor="pointer" />
              <Bar dataKey="custos" fill="hsl(0 84% 60%)" name="Custos" cursor="pointer" />
              <Bar dataKey="despesas" fill="hsl(38 92% 50%)" name="Despesas" cursor="pointer" />
              <Bar dataKey="lucro" fill="hsl(142 76% 36%)" name="Lucro" cursor="pointer" />
            </BarChart>
          </ResponsiveContainer>
        </ExpandableChart>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExpandableChart 
            title="Evolução do Resultado"
            description="Tendência de crescimento da Receita Líquida e Lucro ao longo dos meses."
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredDreData} onClick={handleDREClick}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip valuePrefix="R$ " />} />
                <Legend />
                <Line type="monotone" dataKey="receitaLiquida" stroke="hsl(217 91% 60%)" strokeWidth={2} name="Receita" cursor="pointer" />
                <Line type="monotone" dataKey="lucro" stroke="hsl(142 76% 36%)" strokeWidth={2} name="Lucro" cursor="pointer" />
              </LineChart>
            </ResponsiveContainer>
          </ExpandableChart>

          <Card className="p-6 gradient-card border-border shadow-soft">
            <h3 className="text-lg font-semibold text-foreground mb-6">Indicadores Financeiros</h3>
            <div className="space-y-4">
              {indicadores.map((item) => (
                <div key={item.indicador} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{item.indicador}</span>
                  <span className="text-lg font-bold text-foreground">
                    {item.indicador.includes("%") ? `${item.valor}%` : item.valor}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                <strong>Liquidez Corrente:</strong> Capacidade de pagar dívidas de curto prazo<br/>
                <strong>ROE:</strong> Retorno sobre o patrimônio líquido<br/>
                <strong>ROA:</strong> Retorno sobre ativos totais
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
