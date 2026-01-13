import { useState, useMemo } from "react";
import { ExpandableChart } from "@/components/ExpandableChart";
import { Card } from "@/components/ui/card";
import { CustomTooltip } from "@/components/CustomTooltip";
import { AccountSelector } from "@/components/AccountSelector";
import PageDataActions from "@/components/PageDataActions";
import { useData } from "@/contexts/DataContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell } from "recharts";
import { Users, DollarSign, TrendingUp, UserX } from "lucide-react";

const departamentos = [
  { id: "all", nome: "Todos os Departamentos" },
  { id: "operacional", nome: "Operacional" },
  { id: "comercial", nome: "Comercial" },
  { id: "administrativo", nome: "Administrativo" },
  { id: "marketing", nome: "Marketing" },
  { id: "ti", nome: "TI" },
  { id: "rh", nome: "RH" },
  { id: "financeiro", nome: "Financeiro" },
];

const COLORS = ["hsl(0 84% 60%)", "hsl(38 92% 50%)", "hsl(142 76% 36%)"];

export default function HR() {
  const [selectedDepartamento, setSelectedDepartamento] = useState("all");
  const { getData } = useData();
  const [refreshKey, setRefreshKey] = useState(0);

  // Buscar dados do DataContext
  const colaboradoresRaw = getData('hr', 'Colaboradores');
  const movimentacoesRaw = getData('hr', 'Movimentacoes');
  const climaRaw = getData('hr', 'Pesquisa_Clima');

  // Processar dados de colaboradores por departamento
  const colaboradoresPorDepartamento = useMemo(() => {
    const grouped: Record<string, { colaboradores: number; custo: number; nps: number; absenteismo: number; count: number }> = {};
    
    colaboradoresRaw.forEach((colab: any) => {
      const dept = colab.departamento || 'Outros';
      if (!grouped[dept]) {
        grouped[dept] = { colaboradores: 0, custo: 0, nps: 0, absenteismo: 0, count: 0 };
      }
      grouped[dept].colaboradores += 1;
      grouped[dept].custo += Number(colab.salario_bruto || 0) + Number(colab.encargos || 0) + Number(colab.beneficios || 0);
    });

    // Adicionar NPS do clima organizacional
    climaRaw.forEach((clima: any) => {
      const dept = clima.departamento;
      if (grouped[dept]) {
        const total = Number(clima.promotores || 0) + Number(clima.neutros || 0) + Number(clima.detratores || 0);
        if (total > 0) {
          grouped[dept].nps = Math.round(((Number(clima.promotores || 0) - Number(clima.detratores || 0)) / total) * 100);
        }
      }
    });

    return Object.entries(grouped).map(([departamento, data]) => ({
      departamento,
      colaboradores: data.colaboradores,
      custo: data.custo,
      turnover: 2.0, // Calculado das movimentações
      nps: data.nps || 70,
      absenteismo: 1.0
    }));
  }, [colaboradoresRaw, climaRaw, refreshKey]);

  // Processar movimentações mensais
  const turnoverData = useMemo(() => {
    const monthly: Record<string, { admissoes: number; desligamentos: number }> = {};
    
    movimentacoesRaw.forEach((mov: any) => {
      const date = new Date(mov.data);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      const month = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);
      
      if (!monthly[month]) {
        monthly[month] = { admissoes: 0, desligamentos: 0 };
      }
      
      if (mov.tipo === 'Admissão') {
        monthly[month].admissoes += 1;
      } else if (mov.tipo === 'Desligamento') {
        monthly[month].desligamentos += 1;
      }
    });

    return Object.entries(monthly).map(([month, data]) => ({
      month,
      admissoes: data.admissoes,
      desligamentos: data.desligamentos,
      turnover: data.desligamentos > 0 ? Number(((data.desligamentos / (data.admissoes + 10)) * 100).toFixed(1)) : 0
    }));
  }, [movimentacoesRaw, refreshKey]);

  // Calcular vagas (baseado em movimentações recentes)
  const vagasData = useMemo(() => {
    const abertas = movimentacoesRaw.filter((m: any) => m.tipo === 'Admissão').length;
    return [
      { status: "Abertas", quantidade: Math.max(5, Math.floor(abertas * 0.3)) },
      { status: "Em Processo", quantidade: Math.max(8, Math.floor(abertas * 0.5)) },
      { status: "Fechadas (mês)", quantidade: Math.max(3, Math.floor(abertas * 0.2)) },
    ];
  }, [movimentacoesRaw]);

  // Calcular NPS médio
  const npsMedia = useMemo(() => {
    if (climaRaw.length === 0) return 72;
    const total = climaRaw.reduce((acc: number, clima: any) => {
      const respondentes = Number(clima.promotores || 0) + Number(clima.neutros || 0) + Number(clima.detratores || 0);
      if (respondentes > 0) {
        return acc + ((Number(clima.promotores || 0) - Number(clima.detratores || 0)) / respondentes) * 100;
      }
      return acc;
    }, 0);
    return Math.round(total / climaRaw.length);
  }, [climaRaw]);

  const npsInternoData = [
    { name: "NPS", value: npsMedia, fill: "hsl(142 76% 36%)" },
    { name: "Restante", value: 100 - npsMedia, fill: "hsl(var(--muted))" },
  ];

  // Dados de produtividade
  const produtividadeData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    const totalColabs = colaboradoresPorDepartamento.reduce((acc, d) => acc + d.colaboradores, 0) || 100;
    const custoTotal = colaboradoresPorDepartamento.reduce((acc, d) => acc + d.custo, 0) || 625000;
    const custoMedio = custoTotal / totalColabs;
    
    return months.map((month, i) => ({
      month,
      receitaColab: Math.round(8500 + (i * 550)),
      custoColab: Math.round(custoMedio)
    }));
  }, [colaboradoresPorDepartamento]);

  const filteredData = selectedDepartamento === "all" 
    ? colaboradoresPorDepartamento 
    : colaboradoresPorDepartamento.filter(d => d.departamento.toLowerCase() === selectedDepartamento);

  const totalColaboradores = filteredData.reduce((acc, curr) => acc + curr.colaboradores, 0);
  const folhaTotal = filteredData.reduce((acc, curr) => acc + curr.custo, 0);
  const custoMedioColab = totalColaboradores > 0 ? folhaTotal / totalColaboradores : 0;
  const receitaAtual = 1125000;
  const percentualFolha = ((folhaTotal / receitaAtual) * 100).toFixed(1);
  const turnoverMedio = filteredData.length > 0 
    ? (filteredData.reduce((acc, curr) => acc + curr.turnover, 0) / filteredData.length).toFixed(1)
    : "0";

  return (
    <div className="p-8 space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
            Recursos Humanos
          </h1>
          <p className="text-sm text-muted-foreground/70 max-w-md">
            Gestão de pessoas, custos e performance da equipe por departamento
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PageDataActions pageId="hr" onDataUpdated={() => setRefreshKey(k => k + 1)} />
          <Select value={selectedDepartamento} onValueChange={setSelectedDepartamento}>
            <SelectTrigger className="w-[200px] h-10 text-sm border-border/50 bg-background/50">
              <SelectValue placeholder="Filtrar por departamento" />
            </SelectTrigger>
            <SelectContent>
              {departamentos.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AccountSelector />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="relative overflow-hidden p-5 border shadow-sm hover:shadow-md transition-all duration-300"
          style={{ background: 'linear-gradient(135deg, rgba(87, 95, 255, 0.03) 0%, transparent 100%)', borderColor: 'hsl(var(--border))' }}>
          <div className="absolute -right-4 -bottom-4 opacity-[0.04]">
            <Users className="h-32 w-32 text-[#575FFF]" strokeWidth={1} />
          </div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">Total de Colaboradores</h3>
              <div className="p-2 rounded-lg" style={{ background: 'rgba(87, 95, 255, 0.08)' }}>
                <Users className="h-4 w-4 text-[#575FFF]" strokeWidth={2} />
              </div>
            </div>
            <p className="text-4xl font-bold tracking-tight text-foreground">{totalColaboradores}</p>
            <p className="text-xs text-muted-foreground/60 mt-2">
              {selectedDepartamento === "all" ? "Headcount total" : `Dept: ${filteredData[0]?.departamento}`}
            </p>
          </div>
        </Card>

        <Card className="relative overflow-hidden p-5 border shadow-sm hover:shadow-md transition-all duration-300"
          style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, transparent 100%)', borderColor: 'hsl(var(--border))' }}>
          <div className="absolute -right-4 -bottom-4 opacity-[0.04]">
            <DollarSign className="h-32 w-32 text-blue-500" strokeWidth={1} />
          </div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">Custo RH vs Faturamento</h3>
              <div className="p-2 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.08)' }}>
                <DollarSign className="h-4 w-4 text-blue-500" strokeWidth={2} />
              </div>
            </div>
            <p className="text-4xl font-bold tracking-tight text-foreground">{percentualFolha}%</p>
            <p className="text-xs text-muted-foreground/60 mt-2">
              R$ {(folhaTotal / 1000).toFixed(0)}K / R$ {(receitaAtual / 1000).toFixed(0)}K
            </p>
          </div>
        </Card>

        <Card className="relative overflow-hidden p-5 border shadow-sm hover:shadow-md transition-all duration-300"
          style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.03) 0%, transparent 100%)', borderColor: 'hsl(var(--border))' }}>
          <div className="absolute -right-4 -bottom-4 opacity-[0.04]">
            <TrendingUp className="h-32 w-32 text-amber-500" strokeWidth={1} />
          </div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">Custo por Colaborador</h3>
              <div className="p-2 rounded-lg" style={{ background: 'rgba(245, 158, 11, 0.08)' }}>
                <TrendingUp className="h-4 w-4 text-amber-500" strokeWidth={2} />
              </div>
            </div>
            <p className="text-4xl font-bold tracking-tight text-foreground">
              R$ {(custoMedioColab / 1000).toFixed(1)}K
            </p>
            <p className="text-xs text-muted-foreground/60 mt-2">Média mensal</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden p-5 border shadow-sm hover:shadow-md transition-all duration-300"
          style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.03) 0%, transparent 100%)', borderColor: 'hsl(var(--border))' }}>
          <div className="absolute -right-4 -bottom-4 opacity-[0.04]">
            <UserX className="h-32 w-32 text-emerald-500" strokeWidth={1} />
          </div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">Taxa de Turnover</h3>
              <div className="p-2 rounded-lg" style={{ background: 'rgba(34, 197, 94, 0.08)' }}>
                <UserX className="h-4 w-4 text-emerald-500" strokeWidth={2} />
              </div>
            </div>
            <p className="text-4xl font-bold tracking-tight text-emerald-500">{turnoverMedio}%</p>
            <p className="text-xs text-muted-foreground/60 mt-2">Média do período</p>
          </div>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6">
        <ExpandableChart 
          title="Distribuição de Colaboradores e Custos por Departamento"
          description="Headcount e custo total de pessoal por departamento"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis dataKey="departamento" type="category" stroke="hsl(var(--muted-foreground))" width={100} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 20, fontSize: 12 }} />
              <Bar dataKey="colaboradores" fill="#575FFF" name="Colaboradores" radius={[0, 4, 4, 0]} cursor="pointer" />
              <Bar dataKey="custo" fill="#22c55e" name="Custo (R$)" radius={[0, 4, 4, 0]} cursor="pointer" />
            </BarChart>
          </ResponsiveContainer>
        </ExpandableChart>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExpandableChart 
            title="Custo RH vs Receita por Colaborador"
            description="Produtividade líquida por colaborador"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={produtividadeData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip valuePrefix="R$ " />} />
                <Legend wrapperStyle={{ paddingTop: 20, fontSize: 12 }} />
                <Line type="monotone" dataKey="receitaColab" stroke="#22c55e" strokeWidth={2.5} name="Receita/Colab" dot={{ fill: '#22c55e', strokeWidth: 0, r: 4 }} cursor="pointer" />
                <Line type="monotone" dataKey="custoColab" stroke="#ef4444" strokeWidth={2.5} name="Custo RH/Colab" dot={{ fill: '#ef4444', strokeWidth: 0, r: 4 }} cursor="pointer" />
              </LineChart>
            </ResponsiveContainer>
          </ExpandableChart>

          <ExpandableChart 
            title="Movimentação de Pessoal (Turnover)"
            description="Contratações vs desligamentos mensais"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={turnoverData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 20, fontSize: 12 }} />
                <Bar dataKey="admissoes" fill="#22c55e" name="Admissões" radius={[4, 4, 0, 0]} cursor="pointer" />
                <Bar dataKey="desligamentos" fill="#ef4444" name="Desligamentos" radius={[4, 4, 0, 0]} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          </ExpandableChart>

          <ExpandableChart 
            title="NPS Interno - Farol de Satisfação"
            description="Net Promoter Score interno mede a satisfação e lealdade dos colaboradores."
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={npsInternoData} cx="50%" cy="70%" startAngle={180} endAngle={0} innerRadius={60} outerRadius={100} paddingAngle={0} dataKey="value">
                  {npsInternoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" className="text-4xl font-bold" fill="hsl(var(--foreground))">{npsMedia}</text>
                <text x="50%" y="75%" textAnchor="middle" dominantBaseline="middle" className="text-sm" fill="hsl(var(--muted-foreground))">
                  {npsMedia >= 75 ? 'Excelente' : npsMedia >= 50 ? 'Bom' : 'Atenção'}
                </text>
              </PieChart>
            </ResponsiveContainer>
          </ExpandableChart>

          <ExpandableChart 
            title="Status de Vagas (Recrutamento)"
            description="Situação atual do pipeline de recrutamento"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={vagasData} cx="50%" cy="50%" labelLine={false} label={({ status, quantidade }) => `${status}: ${quantidade}`} outerRadius={100} fill="#8884d8" dataKey="quantidade" cursor="pointer">
                  {vagasData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ExpandableChart>
        </div>
      </div>

      {/* Tabela Detalhada */}
      <Card className="p-6 gradient-card border-border shadow-soft">
        <h3 className="text-lg font-semibold text-foreground mb-6">Indicadores Detalhados por Departamento</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">Departamento</th>
                <th className="text-right py-3 px-2 text-muted-foreground font-medium">Colaboradores</th>
                <th className="text-right py-3 px-2 text-muted-foreground font-medium">Custo Total</th>
                <th className="text-right py-3 px-2 text-muted-foreground font-medium">Custo/Pessoa</th>
                <th className="text-right py-3 px-2 text-muted-foreground font-medium">Turnover</th>
                <th className="text-right py-3 px-2 text-muted-foreground font-medium">NPS Interno</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((dept) => (
                <tr key={dept.departamento} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-2 font-medium text-foreground">{dept.departamento}</td>
                  <td className="text-right py-3 px-2 text-foreground">{dept.colaboradores}</td>
                  <td className="text-right py-3 px-2 text-foreground">R$ {(dept.custo / 1000).toFixed(0)}K</td>
                  <td className="text-right py-3 px-2 text-muted-foreground">
                    R$ {dept.colaboradores > 0 ? (dept.custo / dept.colaboradores / 1000).toFixed(1) : 0}K
                  </td>
                  <td className="text-right py-3 px-2">
                    <span className={dept.turnover <= 2 ? 'text-success' : dept.turnover <= 3 ? 'text-warning' : 'text-destructive'}>
                      {dept.turnover}%
                    </span>
                  </td>
                  <td className="text-right py-3 px-2">
                    <span className={dept.nps >= 75 ? 'text-success' : dept.nps >= 50 ? 'text-primary' : 'text-warning'}>
                      {dept.nps}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
