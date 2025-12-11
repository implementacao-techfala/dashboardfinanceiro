import { useState, useMemo } from "react";
import { ExpandableChart } from "@/components/ExpandableChart";
import { FilterBadges } from "@/components/FilterBadges";
import { CustomTooltip } from "@/components/CustomTooltip";
import { AccountSelector } from "@/components/AccountSelector";
import DataUploader from "@/components/DataUploader";
import { useData } from "@/contexts/DataContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Target, Users, TrendingUp, Phone, MessageCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Sales() {
  const { getData } = useData();
  const [refreshKey, setRefreshKey] = useState(0);

  // Buscar dados do DataContext
  const oportunidadesRaw = getData('sales', 'Oportunidades');
  const atividadesRaw = getData('sales', 'Atividades_Vendedor');
  const metasRaw = getData('sales', 'Metas');

  // Processar performance por vendedor
  const vendedoresPerformance = useMemo(() => {
    const byVendedor: Record<string, { 
      convertidas: number; 
      meta: number; 
      valor: number; 
      ligacoes: number; 
      whatsapp: number;
      pipeline: number;
    }> = {};
    
    // Processar oportunidades
    oportunidadesRaw.forEach((op: any) => {
      const vendedor = op.vendedor || 'Desconhecido';
      if (!byVendedor[vendedor]) {
        byVendedor[vendedor] = { convertidas: 0, meta: 25, valor: 0, ligacoes: 0, whatsapp: 0, pipeline: 0 };
      }
      
      if (op.etapa === 'Fechado Ganho') {
        byVendedor[vendedor].convertidas++;
        byVendedor[vendedor].valor += Number(op.valor) || 0;
      }
      byVendedor[vendedor].pipeline++;
    });

    // Processar atividades
    atividadesRaw.forEach((at: any) => {
      const vendedor = at.vendedor;
      if (byVendedor[vendedor]) {
        byVendedor[vendedor].ligacoes += Number(at.ligacoes) || 0;
        byVendedor[vendedor].whatsapp += Number(at.whatsapp) || 0;
      }
    });

    // Processar metas
    metasRaw.forEach((meta: any) => {
      const vendedor = meta.vendedor;
      if (byVendedor[vendedor]) {
        byVendedor[vendedor].meta = Number(meta.meta_qtd) || 25;
      }
    });

    const result = Object.entries(byVendedor).map(([vendedor, data]) => ({
      vendedor,
      oportunidadesConvertidas: data.convertidas,
      metaVendas: data.meta,
      conversao: data.pipeline > 0 ? Number(((data.convertidas / data.pipeline) * 100).toFixed(1)) : 0,
      ticket: data.convertidas > 0 ? Math.round(data.valor / data.convertidas) : 0,
      ligacoes: data.ligacoes,
      whatsapp: data.whatsapp,
      contatosNecessarios: data.convertidas > 0 ? Number(((data.ligacoes + data.whatsapp) / data.convertidas).toFixed(1)) : 0,
      pipeline: data.pipeline
    }));

    return result.length > 0 ? result : [
      { vendedor: "Carlos Silva", oportunidadesConvertidas: 28, metaVendas: 25, conversao: 18.5, ticket: 3200, ligacoes: 145, whatsapp: 89, contatosNecessarios: 8.3, pipeline: 42 },
      { vendedor: "Ana Santos", oportunidadesConvertidas: 32, metaVendas: 30, conversao: 21.2, ticket: 3800, ligacoes: 134, whatsapp: 112, contatosNecessarios: 7.7, pipeline: 38 },
      { vendedor: "Pedro Costa", oportunidadesConvertidas: 24, metaVendas: 25, conversao: 16.8, ticket: 2900, ligacoes: 167, whatsapp: 78, contatosNecessarios: 10.2, pipeline: 51 },
      { vendedor: "Mariana Lima", oportunidadesConvertidas: 35, metaVendas: 30, conversao: 23.4, ticket: 4100, ligacoes: 112, whatsapp: 98, contatosNecessarios: 6.0, pipeline: 35 },
      { vendedor: "João Oliveira", oportunidadesConvertidas: 29, metaVendas: 25, conversao: 19.3, ticket: 3400, ligacoes: 156, whatsapp: 67, contatosNecessarios: 7.7, pipeline: 45 },
    ];
  }, [oportunidadesRaw, atividadesRaw, metasRaw, refreshKey]);

  // Processar pipeline por estágio
  const pipelineData = useMemo(() => {
    const byEstagio: Record<string, { quantidade: number; valor: number }> = {};
    
    oportunidadesRaw.forEach((op: any) => {
      const estagio = op.etapa || 'Outros';
      if (!byEstagio[estagio]) {
        byEstagio[estagio] = { quantidade: 0, valor: 0 };
      }
      byEstagio[estagio].quantidade++;
      byEstagio[estagio].valor += Number(op.valor) || 0;
    });

    const result = Object.entries(byEstagio)
      .filter(([estagio]) => !estagio.includes('Fechado'))
      .map(([estagio, data]) => ({
        estagio,
        quantidade: data.quantidade,
        valor: data.valor
      }));

    return result.length > 0 ? result : [
      { estagio: "Prospecção", quantidade: 245, valor: 784000 },
      { estagio: "Qualificação", quantidade: 142, valor: 512000 },
      { estagio: "Proposta", quantidade: 89, valor: 356000 },
      { estagio: "Negociação", quantidade: 54, valor: 248000 },
      { estagio: "Fechamento", quantidade: 28, valor: 134000 },
    ];
  }, [oportunidadesRaw, refreshKey]);

  // Calcular metas do time por mês
  const metasTime = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    return months.map((month, i) => ({
      month,
      meta: 120 + (i * 5),
      realizado: 118 + Math.floor(Math.random() * 20)
    }));
  }, []);

  const totalVendas = vendedoresPerformance.reduce((acc, curr) => acc + curr.oportunidadesConvertidas, 0);
  const totalMeta = vendedoresPerformance.reduce((acc, curr) => acc + curr.metaVendas, 0);
  const atingimentoMeta = totalMeta > 0 ? ((totalVendas / totalMeta) * 100).toFixed(1) : "0";
  const conversaoMedia = vendedoresPerformance.length > 0 
    ? (vendedoresPerformance.reduce((acc, curr) => acc + curr.conversao, 0) / vendedoresPerformance.length).toFixed(1)
    : "0";
  const totalLigacoes = vendedoresPerformance.reduce((acc, curr) => acc + curr.ligacoes, 0);
  const totalWhatsapp = vendedoresPerformance.reduce((acc, curr) => acc + curr.whatsapp, 0);
  const contatosMediosPorVenda = totalVendas > 0 
    ? ((totalLigacoes + totalWhatsapp) / totalVendas).toFixed(1)
    : "0";
  const totalPipeline = pipelineData.reduce((acc, curr) => acc + curr.valor, 0);

  const handleVendedorClick = (data: any) => {
    if (data && data.activeLabel) {
      toast.info(`Vendedor: ${data.activeLabel}`);
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Comercial & Vendas</h1>
          <p className="text-muted-foreground">Performance individual e oportunidades convertidas do time comercial</p>
        </div>
        <div className="flex items-center gap-3">
          <DataUploader pageId="sales" onDataUpdated={() => setRefreshKey(k => k + 1)} />
          <AccountSelector />
        </div>
      </div>

      <FilterBadges />

      {/* KPIs do Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-5 gradient-card border-border shadow-soft hover:shadow-hover transition-all">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground break-words">Oportunidades Convertidas</h3>
            <Target className="h-5 w-5 text-primary flex-shrink-0" />
          </div>
          <p className="text-3xl font-bold text-foreground">{totalVendas}</p>
          <p className="text-xs text-success mt-2 break-words">Meta: {totalMeta} ({atingimentoMeta}%)</p>
        </Card>

        <Card className="p-5 gradient-card border-border shadow-soft hover:shadow-hover transition-all">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground break-words">Taxa de Conversão</h3>
            <TrendingUp className="h-5 w-5 text-success flex-shrink-0" />
          </div>
          <p className="text-3xl font-bold text-success">{conversaoMedia}%</p>
          <p className="text-xs text-muted-foreground mt-2">Média do time</p>
        </Card>

        <Card className="p-5 gradient-card border-border shadow-soft hover:shadow-hover transition-all">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground break-words">Contatos por Venda</h3>
            <MessageCircle className="h-5 w-5 text-primary flex-shrink-0" />
          </div>
          <p className="text-3xl font-bold text-foreground">{contatosMediosPorVenda}</p>
          <p className="text-xs text-muted-foreground mt-2">{totalLigacoes} ligações + {totalWhatsapp} WhatsApp</p>
        </Card>

        <Card className="p-5 gradient-card border-border shadow-soft hover:shadow-hover transition-all">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground break-words">Pipeline Total</h3>
            <Users className="h-5 w-5 text-primary flex-shrink-0" />
          </div>
          <p className="text-3xl font-bold text-primary">R$ {(totalPipeline / 1000000).toFixed(2)}M</p>
          <p className="text-xs text-muted-foreground mt-2">{pipelineData.reduce((acc, curr) => acc + curr.quantidade, 0)} oportunidades</p>
        </Card>
      </div>

      {/* Tabela de Vendedores */}
      <Card className="p-6 gradient-card border-border shadow-soft">
        <h3 className="text-lg font-semibold text-foreground mb-6">Performance Individual</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">Vendedor</th>
                <th className="text-center py-3 px-2 text-muted-foreground font-medium">Meta vs Realizado</th>
                <th className="text-center py-3 px-2 text-muted-foreground font-medium">Contatos</th>
                <th className="text-center py-3 px-2 text-muted-foreground font-medium">Conversão</th>
                <th className="text-right py-3 px-2 text-muted-foreground font-medium">Atingimento</th>
              </tr>
            </thead>
            <tbody>
              {vendedoresPerformance.map((vendedor) => {
                const atingimento = vendedor.metaVendas > 0 ? ((vendedor.oportunidadesConvertidas / vendedor.metaVendas) * 100) : 0;
                return (
                  <tr key={vendedor.vendedor} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-primary/20">
                          <AvatarFallback>{vendedor.vendedor.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{vendedor.vendedor}</p>
                          <p className="text-xs text-muted-foreground">Ticket: R$ {vendedor.ticket.toLocaleString("pt-BR")}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-medium text-foreground">
                          {vendedor.oportunidadesConvertidas} / {vendedor.metaVendas}
                        </span>
                        <Progress value={Math.min(atingimento, 100)} className="h-2 w-24 mt-1" />
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex items-center gap-1 text-xs">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{vendedor.ligacoes}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <MessageCircle className="h-3 w-3 text-success" />
                          <span>{vendedor.whatsapp}</span>
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-4 px-2">
                      <span className="text-sm font-medium text-primary">{vendedor.conversao}%</span>
                    </td>
                    <td className="text-right py-4 px-2">
                      <span className={`text-lg font-bold ${atingimento >= 100 ? 'text-success' : atingimento >= 80 ? 'text-warning' : 'text-destructive'}`}>
                        {atingimento.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpandableChart 
          title="Ranking de Vendedores"
          description="Desempenho de conversão de cada vendedor contra suas metas"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vendedoresPerformance} onClick={handleVendedorClick} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="vendedor" type="category" stroke="hsl(var(--muted-foreground))" width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="oportunidadesConvertidas" fill="hsl(142 76% 36%)" name="Convertidas" cursor="pointer" radius={[0, 8, 8, 0]} />
              <Bar dataKey="metaVendas" fill="hsl(217 91% 60%)" name="Meta" cursor="pointer" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ExpandableChart>

        <ExpandableChart 
          title="Meta do Time vs Realizado"
          description="Evolução mensal das metas do time comercial"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metasTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="meta" stroke="hsl(217 91% 60%)" strokeWidth={2} strokeDasharray="5 5" name="Meta" dot={{ fill: "hsl(217 91% 60%)", r: 4 }} />
              <Line type="monotone" dataKey="realizado" stroke="hsl(142 76% 36%)" strokeWidth={3} name="Realizado" cursor="pointer" dot={{ fill: "hsl(142 76% 36%)", r: 6, strokeWidth: 2, stroke: "#fff" }} />
            </LineChart>
          </ResponsiveContainer>
        </ExpandableChart>

        <ExpandableChart 
          title="Pipeline por Estágio"
          description="Quantidade de oportunidades em cada estágio do funil de vendas"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pipelineData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="estagio" type="category" stroke="hsl(var(--muted-foreground))" width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="quantidade" fill="hsl(217 91% 60%)" name="Quantidade" cursor="pointer" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ExpandableChart>

        <Card className="p-6 gradient-card border-border shadow-soft">
          <h3 className="text-lg font-semibold text-foreground mb-6">Valor por Estágio</h3>
          <div className="space-y-4">
            {pipelineData.map((item) => (
              <div key={item.estagio} className="flex justify-between items-center pb-3 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.estagio}</p>
                  <p className="text-xs text-muted-foreground">{item.quantidade} oportunidades</p>
                </div>
                <p className="text-lg font-bold text-primary">R$ {(item.valor / 1000).toFixed(0)}K</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
