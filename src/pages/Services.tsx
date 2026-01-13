import { useState, useMemo } from "react";
import { ExpandableChart } from "@/components/ExpandableChart";
import { Card } from "@/components/ui/card";
import { CustomTooltip } from "@/components/CustomTooltip";
import PageDataActions from "@/components/PageDataActions";
import { useData } from "@/contexts/DataContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, Cell } from "recharts";
import { Package, TrendingUp, DollarSign, Percent } from "lucide-react";

export default function Services() {
  const { getData } = useData();
  const [refreshKey, setRefreshKey] = useState(0);

  // Buscar dados do DataContext
  const servicosRaw = getData('services', 'Servicos');

  // Processar margem por serviço
  const margemPorServico = useMemo(() => {
    const byServico: Record<string, { receita: number; custo: number; clientes: number }> = {};
    
    servicosRaw.forEach((serv: any) => {
      const servico = serv.servico || 'Outros';
      if (!byServico[servico]) {
        byServico[servico] = { receita: 0, custo: 0, clientes: 0 };
      }
      byServico[servico].receita += Number(serv.receita) || 0;
      byServico[servico].custo += (Number(serv.custo_pessoal) || 0) + (Number(serv.custo_operacional) || 0);
      byServico[servico].clientes += Number(serv.clientes) || 0;
    });

    const result = Object.entries(byServico).map(([servico, data]) => ({
      servico,
      receita: data.receita,
      custo: data.custo,
      lucro: data.receita - data.custo,
      margem: data.receita > 0 ? Number(((data.receita - data.custo) / data.receita * 100).toFixed(1)) : 0,
      clientes: data.clientes
    }));

    return result;
  }, [servicosRaw, refreshKey]);

  // Evolução da margem por mês (derivada do upload)
  const evolucaoMargem = useMemo(() => {
    const monthly: Record<string, Record<string, { receita: number; custo: number }>> = {};
    servicosRaw.forEach((row: any) => {
      const date = new Date(row.mes);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      const month = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);
      const servico = row.servico || 'Outros';
      if (!monthly[month]) monthly[month] = {};
      if (!monthly[month][servico]) monthly[month][servico] = { receita: 0, custo: 0 };
      monthly[month][servico].receita += Number(row.receita) || 0;
      monthly[month][servico].custo += (Number(row.custo_pessoal) || 0) + (Number(row.custo_operacional) || 0);
    });

    const months = Object.keys(monthly);
    if (months.length === 0) return [];

    // Pega até 4 serviços mais relevantes pela receita total no período
    const totals: Record<string, number> = {};
    months.forEach(m => {
      Object.entries(monthly[m]).forEach(([s, v]) => {
        totals[s] = (totals[s] || 0) + v.receita;
      });
    });
    const top = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([s]) => s);

    return months.map((m) => {
      const out: any = { month: m };
      top.forEach((s) => {
        const v = monthly[m][s] || { receita: 0, custo: 0 };
        out[s] = v.receita > 0 ? Number((((v.receita - v.custo) / v.receita) * 100).toFixed(1)) : 0;
      });
      return out;
    });
  }, [servicosRaw, refreshKey]);

  const receitaTotal = margemPorServico.reduce((acc, curr) => acc + curr.receita, 0);
  const lucroTotal = margemPorServico.reduce((acc, curr) => acc + curr.lucro, 0);
  const margemTotal = receitaTotal > 0 ? ((lucroTotal / receitaTotal) * 100).toFixed(1) : "0";

  const servicoMaisLucrativo = margemPorServico.reduce((prev, current) => 
    (prev.margem > current.margem) ? prev : current
  , margemPorServico[0]);

  const servicoMaiorReceita = margemPorServico.reduce((prev, current) => 
    (prev.receita > current.receita) ? prev : current
  , margemPorServico[0]);

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Margem por Serviço</h1>
          <p className="text-muted-foreground">Análise de lucratividade por linha de serviço</p>
        </div>
        <PageDataActions pageId="services" onDataUpdated={() => setRefreshKey(k => k + 1)} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-5 gradient-card border-border shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Receita Total</h3>
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">R$ {(receitaTotal / 1000).toFixed(0)}K</p>
          <p className="text-xs text-muted-foreground mt-2">{margemPorServico.length} linhas de serviço</p>
        </Card>

        <Card className="p-5 gradient-card border-border shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Lucro Total</h3>
            <TrendingUp className="h-5 w-5 text-success" />
          </div>
          <p className="text-3xl font-bold text-success">R$ {(lucroTotal / 1000).toFixed(0)}K</p>
          <p className="text-xs text-muted-foreground mt-2">Margem: {margemTotal}%</p>
        </Card>

        <Card className="p-5 gradient-card border-border shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Maior Margem</h3>
            <Percent className="h-5 w-5 text-success" />
          </div>
          <p className="text-2xl font-bold text-success">{servicoMaisLucrativo?.margem || 0}%</p>
          <p className="text-xs text-muted-foreground mt-2">{servicoMaisLucrativo?.servico || '-'}</p>
        </Card>

        <Card className="p-5 gradient-card border-border shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Maior Receita</h3>
            <Package className="h-5 w-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">R$ {((servicoMaiorReceita?.receita || 0) / 1000).toFixed(0)}K</p>
          <p className="text-xs text-muted-foreground mt-2">{servicoMaiorReceita?.servico || '-'}</p>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6">
        <ExpandableChart 
          title="Margem de Lucro por Serviço (%)"
          description="Percentual de lucro sobre a receita para cada linha de serviço."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={margemPorServico} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" domain={[0, 50]} />
              <YAxis dataKey="servico" type="category" stroke="hsl(var(--muted-foreground))" width={200} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="margem" name="Margem %" cursor="pointer" fill="hsl(217 91% 60%)">
                {margemPorServico.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.margem >= 35 ? "hsl(142 76% 36%)" : entry.margem >= 25 ? "hsl(217 91% 60%)" : "hsl(38 92% 50%)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ExpandableChart>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExpandableChart 
            title="Receita vs Lucro por Serviço"
            description="Comparação entre receita total e lucro líquido por serviço."
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={margemPorServico}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="servico" stroke="hsl(var(--muted-foreground))" angle={-45} textAnchor="end" height={140} interval={0} tick={{ fontSize: 11 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip valuePrefix="R$ " />} />
                <Legend />
                <Bar dataKey="receita" fill="hsl(217 91% 60%)" name="Receita" cursor="pointer" />
                <Bar dataKey="lucro" fill="hsl(142 76% 36%)" name="Lucro" cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          </ExpandableChart>

          <ExpandableChart 
            title="Evolução da Margem"
            description="Acompanhamento mensal da margem de lucro dos principais serviços."
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucaoMargem}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 50]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="consultiva" stroke="hsl(217 91% 60%)" strokeWidth={2} name="Consultiva" />
                <Line type="monotone" dataKey="bpo" stroke="hsl(142 76% 36%)" strokeWidth={2} name="BPO" />
                <Line type="monotone" dataKey="clickon" stroke="hsl(280 80% 55%)" strokeWidth={2} name="ClickOn" />
                <Line type="monotone" dataKey="certificado" stroke="hsl(38 92% 50%)" strokeWidth={2} name="Certificado" />
              </LineChart>
            </ResponsiveContainer>
          </ExpandableChart>
        </div>
      </div>

      {/* Tabela Detalhada */}
      <Card className="p-6 gradient-card border-border shadow-soft">
        <h3 className="text-lg font-semibold text-foreground mb-6">Detalhamento Completo</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">Serviço</th>
                <th className="text-right py-3 px-2 text-muted-foreground font-medium">Receita</th>
                <th className="text-right py-3 px-2 text-muted-foreground font-medium">Custo</th>
                <th className="text-right py-3 px-2 text-muted-foreground font-medium">Lucro</th>
                <th className="text-right py-3 px-2 text-muted-foreground font-medium">Margem</th>
                <th className="text-right py-3 px-2 text-muted-foreground font-medium">Clientes</th>
                <th className="text-right py-3 px-2 text-muted-foreground font-medium">Receita/Cliente</th>
              </tr>
            </thead>
            <tbody>
              {margemPorServico.map((servico) => (
                <tr key={servico.servico} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-2 font-medium text-foreground">{servico.servico}</td>
                  <td className="text-right py-3 px-2 text-foreground">R$ {(servico.receita / 1000).toFixed(0)}K</td>
                  <td className="text-right py-3 px-2 text-muted-foreground">R$ {(servico.custo / 1000).toFixed(0)}K</td>
                  <td className="text-right py-3 px-2 text-success font-medium">R$ {(servico.lucro / 1000).toFixed(0)}K</td>
                  <td className="text-right py-3 px-2">
                    <span className={`font-bold ${servico.margem >= 35 ? 'text-success' : servico.margem >= 25 ? 'text-primary' : 'text-warning'}`}>
                      {servico.margem}%
                    </span>
                  </td>
                  <td className="text-right py-3 px-2 text-muted-foreground">{servico.clientes}</td>
                  <td className="text-right py-3 px-2 text-foreground">
                    R$ {servico.clientes > 0 ? Math.round(servico.receita / servico.clientes).toLocaleString("pt-BR") : 0}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border font-bold">
                <td className="py-3 px-2 text-foreground">TOTAL</td>
                <td className="text-right py-3 px-2 text-foreground">R$ {(receitaTotal / 1000).toFixed(0)}K</td>
                <td className="text-right py-3 px-2 text-muted-foreground">R$ {((receitaTotal - lucroTotal) / 1000).toFixed(0)}K</td>
                <td className="text-right py-3 px-2 text-success">R$ {(lucroTotal / 1000).toFixed(0)}K</td>
                <td className="text-right py-3 px-2 text-primary">{margemTotal}%</td>
                <td className="text-right py-3 px-2 text-muted-foreground">{margemPorServico.reduce((acc, curr) => acc + curr.clientes, 0)}</td>
                <td className="text-right py-3 px-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">💚 Excelente (≥35%)</p>
              <p className="font-medium">{margemPorServico.filter(s => s.margem >= 35).map(s => s.servico).join(', ') || 'Nenhum'}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">🔵 Bom (25-35%)</p>
              <p className="font-medium">{margemPorServico.filter(s => s.margem >= 25 && s.margem < 35).map(s => s.servico).join(', ') || 'Nenhum'}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">⚠️ Atenção (&lt;25%)</p>
              <p className="font-medium">{margemPorServico.filter(s => s.margem < 25).map(s => s.servico).join(', ') || 'Nenhum'}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
