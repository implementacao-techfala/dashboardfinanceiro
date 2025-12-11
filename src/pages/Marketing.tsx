import { useState, useMemo } from "react";
import { ExpandableChart } from "@/components/ExpandableChart";
import { FilterBadges } from "@/components/FilterBadges";
import { CustomTooltip } from "@/components/CustomTooltip";
import DataUploader from "@/components/DataUploader";
import { useFilters } from "@/contexts/FilterContext";
import { useData } from "@/contexts/DataContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, Cell } from "recharts";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

const COLORS = ["hsl(217 91% 60%)", "hsl(142 76% 36%)", "hsl(38 92% 50%)", "hsl(0 84% 60%)", "hsl(280 80% 55%)"];

export default function Marketing() {
  const { filters, setFilter } = useFilters();
  const { getData } = useData();
  const [refreshKey, setRefreshKey] = useState(0);

  // Buscar dados do DataContext
  const campanhasRaw = getData('marketing', 'Campanhas');
  const leadsRaw = getData('marketing', 'Leads');

  // Processar dados de canais a partir das campanhas
  const canalData = useMemo(() => {
    const byCanal: Record<string, { investimento: number; leads: number; conversao: number; vendas: number; receita: number }> = {};
    
    campanhasRaw.forEach((camp: any) => {
      const canal = camp.canal || 'Outros';
      if (!byCanal[canal]) {
        byCanal[canal] = { investimento: 0, leads: 0, conversao: 0, vendas: 0, receita: 0 };
      }
      byCanal[canal].investimento += Number(camp.investimento) || 0;
      byCanal[canal].leads += Number(camp.leads) || 0;
      byCanal[canal].vendas += Number(camp.vendas) || 0;
      byCanal[canal].receita += Number(camp.receita) || 0;
    });

    const result = Object.entries(byCanal).map(([canal, data]) => ({
      canal,
      investimento: data.investimento,
      leads: data.leads,
      conversao: data.leads > 0 ? Number(((data.vendas / data.leads) * 100).toFixed(1)) : 0,
      roi: data.investimento > 0 ? Math.round(((data.receita - data.investimento) / data.investimento) * 100) : 0
    }));

    return result.length > 0 ? result : [
      { canal: "Google Ads", investimento: 45000, leads: 1250, conversao: 12.5, roi: 280 },
      { canal: "Facebook Ads", investimento: 32000, leads: 980, conversao: 9.8, roi: 195 },
      { canal: "Instagram Ads", investimento: 28000, leads: 850, conversao: 11.2, roi: 220 },
      { canal: "LinkedIn Ads", investimento: 18000, leads: 420, conversao: 15.8, roi: 310 },
      { canal: "Orgânico (SEO)", investimento: 8000, leads: 620, conversao: 18.5, roi: 580 },
    ];
  }, [campanhasRaw, refreshKey]);

  // Processar ROI mensal
  const roiMensal = useMemo(() => {
    const monthly: Record<string, { investimento: number; receita: number }> = {};
    
    campanhasRaw.forEach((camp: any) => {
      const date = new Date(camp.mes);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      const month = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);
      
      if (!monthly[month]) {
        monthly[month] = { investimento: 0, receita: 0 };
      }
      monthly[month].investimento += Number(camp.investimento) || 0;
      monthly[month].receita += Number(camp.receita) || 0;
    });

    const result = Object.entries(monthly).map(([month, data]) => ({
      month,
      investimento: data.investimento,
      receita: data.receita,
      roi: data.investimento > 0 ? Math.round(((data.receita - data.investimento) / data.investimento) * 100) : 0
    }));

    return result.length > 0 ? result : [
      { month: "Jan", investimento: 95000, receita: 245000, roi: 158 },
      { month: "Fev", investimento: 102000, receita: 278000, roi: 172 },
      { month: "Mar", investimento: 98000, receita: 256000, roi: 161 },
      { month: "Abr", investimento: 115000, receita: 321000, roi: 179 },
      { month: "Mai", investimento: 108000, receita: 298000, roi: 176 },
      { month: "Jun", investimento: 131000, receita: 368000, roi: 181 },
    ];
  }, [campanhasRaw, refreshKey]);

  // Processar funil de leads
  const funnelData = useMemo(() => {
    const statusCount: Record<string, number> = {
      'Novo': 0,
      'Em contato': 0,
      'Qualificado': 0,
      'Desqualificado': 0,
      'Convertido': 0
    };
    
    leadsRaw.forEach((lead: any) => {
      const status = lead.status || 'Novo';
      if (statusCount[status] !== undefined) {
        statusCount[status]++;
      }
    });

    const total = Object.values(statusCount).reduce((a, b) => a + b, 0);
    
    if (total === 0) {
      return [
        { etapa: "Visitantes", valor: 15420, taxa: 100 },
        { etapa: "Leads", valor: 4120, taxa: 26.7 },
        { etapa: "MQLs", valor: 1856, taxa: 45.0 },
        { etapa: "SQLs", valor: 834, taxa: 44.9 },
        { etapa: "Clientes", valor: 125, taxa: 15.0 },
      ];
    }

    return [
      { etapa: "Novos Leads", valor: statusCount['Novo'], taxa: 100 },
      { etapa: "Em Contato", valor: statusCount['Em contato'], taxa: total > 0 ? Number(((statusCount['Em contato'] / statusCount['Novo']) * 100).toFixed(1)) : 0 },
      { etapa: "Qualificados", valor: statusCount['Qualificado'], taxa: statusCount['Em contato'] > 0 ? Number(((statusCount['Qualificado'] / statusCount['Em contato']) * 100).toFixed(1)) : 0 },
      { etapa: "Convertidos", valor: statusCount['Convertido'], taxa: statusCount['Qualificado'] > 0 ? Number(((statusCount['Convertido'] / statusCount['Qualificado']) * 100).toFixed(1)) : 0 },
    ];
  }, [leadsRaw, refreshKey]);

  const handleCanalClick = (data: any) => {
    if (data && data.activeLabel) {
      toast.info(`Canal: ${data.activeLabel}`);
    }
  };

  const totalInvestimento = canalData.reduce((acc, curr) => acc + curr.investimento, 0);
  const totalLeads = canalData.reduce((acc, curr) => acc + curr.leads, 0);
  const custoPorLead = totalLeads > 0 ? totalInvestimento / totalLeads : 0;
  const conversaoMedia = canalData.length > 0 
    ? (canalData.reduce((acc, curr) => acc + curr.conversao, 0) / canalData.length).toFixed(1)
    : "0";
  const roiMedio = roiMensal.length > 0 ? roiMensal[roiMensal.length - 1].roi : 0;

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Marketing & ROI</h1>
          <p className="text-muted-foreground">Análise de investimento, conversão e retorno</p>
        </div>
        <DataUploader pageId="marketing" onDataUpdated={() => setRefreshKey(k => k + 1)} />
      </div>

      <FilterBadges />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="p-5 gradient-card border-border shadow-soft">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Investimento Total</h3>
          <p className="text-2xl font-bold text-foreground">
            R$ {(totalInvestimento / 1000).toFixed(0)}K
          </p>
          <p className="text-xs text-muted-foreground mt-1">Este mês</p>
        </Card>
        <Card className="p-5 gradient-card border-border shadow-soft">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total de Leads</h3>
          <p className="text-2xl font-bold text-foreground">
            {totalLeads.toLocaleString("pt-BR")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Todos os canais</p>
        </Card>
        <Card className="p-5 gradient-card border-border shadow-soft">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Custo por Lead</h3>
          <p className="text-2xl font-bold text-foreground">
            R$ {custoPorLead.toFixed(0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Média geral</p>
        </Card>
        <Card className="p-5 gradient-card border-border shadow-soft">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">ROI Médio</h3>
          <p className="text-2xl font-bold text-success">
            {roiMedio}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">Retorno sobre investimento</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpandableChart 
          title="Performance por Canal"
          description="Comparação entre quantidade de leads gerados e ROI por canal de marketing."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={canalData} onClick={handleCanalClick}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="canal" stroke="hsl(var(--muted-foreground))" angle={-15} textAnchor="end" height={80} />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="leads" fill="hsl(217 91% 60%)" name="Leads" cursor="pointer" />
              <Bar dataKey="roi" fill="hsl(142 76% 36%)" name="ROI %" cursor="pointer" />
            </BarChart>
          </ResponsiveContainer>
        </ExpandableChart>

        <ExpandableChart 
          title="ROI Mensal"
          description="Acompanhamento mensal do investimento em marketing vs receita gerada."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={roiMensal}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<CustomTooltip valuePrefix="R$ " />} />
              <Legend />
              <Line type="monotone" dataKey="investimento" stroke="hsl(0 84% 60%)" strokeWidth={2} name="Investimento" />
              <Line type="monotone" dataKey="receita" stroke="hsl(142 76% 36%)" strokeWidth={2} name="Receita Gerada" />
            </LineChart>
          </ResponsiveContainer>
        </ExpandableChart>

        <ExpandableChart 
          title="Funil de Conversão"
          description="Jornada do cliente desde lead até conversão."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="etapa" type="category" stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="valor" name="Quantidade" cursor="pointer">
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ExpandableChart>

        <Card className="p-6 gradient-card border-border shadow-soft">
          <h3 className="text-lg font-semibold text-foreground mb-6">Métricas de Conversão</h3>
          <div className="space-y-4">
            {funnelData.map((item, index) => (
              <div key={item.etapa} className="flex justify-between items-center pb-3 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.etapa}</p>
                  <p className="text-xs text-muted-foreground">{item.valor.toLocaleString("pt-BR")}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{item.taxa}%</p>
                  {index > 0 && (
                    <p className="text-xs text-muted-foreground">
                      de {funnelData[index - 1].etapa.toLowerCase()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <strong>Taxa de Conversão Global:</strong> {funnelData.length > 1 && funnelData[0].valor > 0 
                ? ((funnelData[funnelData.length - 1].valor / funnelData[0].valor) * 100).toFixed(2) 
                : 0}%
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
