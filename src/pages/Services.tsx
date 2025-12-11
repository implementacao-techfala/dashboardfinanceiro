import { useState, useMemo } from "react";
import { ExpandableChart } from "@/components/ExpandableChart";
import { Card } from "@/components/ui/card";
import { CustomTooltip } from "@/components/CustomTooltip";
import DataUploader from "@/components/DataUploader";
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

    return result.length > 0 ? result : [
      { servico: "Contabilidade Consultiva", receita: 475200, custo: 342144, lucro: 133056, margem: 28.0, clientes: 856 },
      { servico: "BPO Estratégico", receita: 119600, custo: 77740, lucro: 41860, margem: 35.0, clientes: 342 },
      { servico: "BPO RH", receita: 92480, custo: 62886, lucro: 29594, margem: 32.0, clientes: 289 },
      { servico: "BPO Financeiro", receita: 78400, custo: 51184, lucro: 27216, margem: 34.7, clientes: 198 },
      { servico: "ClickOn Treinamentos", receita: 53400, custo: 30972, lucro: 22428, margem: 42.0, clientes: 178 },
      { servico: "Tributação e Legalização", receita: 89200, custo: 58348, lucro: 30852, margem: 34.6, clientes: 267 },
      { servico: "Certificado Digital", receita: 44600, custo: 36568, lucro: 8032, margem: 18.0, clientes: 445 },
      { servico: "FN EUA", receita: 92400, custo: 58344, lucro: 34056, margem: 36.9, clientes: 67 },
    ];
  }, [servicosRaw, refreshKey]);

  // Evolução da margem (simulado por mês)
  const evolucaoMargem = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    return months.map((month, i) => ({
      month,
      consultiva: 27.5 + (i * 0.1),
      bpo: 33.8 + (i * 0.2),
      clickon: 40.2 + (i * 0.3),
      certificado: 17.5 + (i * 0.1)
    }));
  }, []);

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
        <DataUploader pageId="services" onDataUpdated={() => setRefreshKey(k => k + 1)} />
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
