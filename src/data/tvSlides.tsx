import { TrendingUp, TrendingDown, DollarSign, Users, Target, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CustomTooltip } from "@/components/CustomTooltip";

// Dados Overview
const mrrData = [
  { month: "Jan", mrr: 850000 },
  { month: "Fev", mrr: 898000 },
  { month: "Mar", mrr: 945000 },
  { month: "Abr", mrr: 1004000 },
  { month: "Mai", mrr: 1057000 },
  { month: "Jun", mrr: 1125000 },
];

const mrrComposicao = [
  { month: "Jan", novos: 45000, churn: -12000, expansao: 15000 },
  { month: "Fev", novos: 52000, churn: -9000, expansao: 18000 },
  { month: "Mar", novos: 48000, churn: -11000, expansao: 22000 },
  { month: "Abr", novos: 61000, churn: -8000, expansao: 25000 },
  { month: "Mai", novos: 55000, churn: -10000, expansao: 28000 },
  { month: "Jun", novos: 67000, churn: -7500, expansao: 31000 },
];

// Dados Vendas
const vendedoresData = [
  { vendedor: "Mariana", vendas: 35, meta: 30 },
  { vendedor: "Ana", vendas: 32, meta: 30 },
  { vendedor: "João", vendas: 29, meta: 25 },
  { vendedor: "Carlos", vendas: 28, meta: 25 },
  { vendedor: "Pedro", vendas: 24, meta: 25 },
];

const metasTime = [
  { month: "Jan", meta: 120, realizado: 118 },
  { month: "Fev", meta: 125, realizado: 132 },
  { month: "Mar", meta: 130, realizado: 127 },
  { month: "Abr", meta: 135, realizado: 145 },
  { month: "Mai", meta: 140, realizado: 138 },
  { month: "Jun", meta: 145, realizado: 152 },
];

// Dados Marketing
const canalData = [
  { canal: "Google Ads", leads: 1250, roi: 280 },
  { canal: "Facebook", leads: 980, roi: 195 },
  { canal: "Instagram", leads: 850, roi: 220 },
  { canal: "LinkedIn", leads: 420, roi: 310 },
  { canal: "SEO", leads: 620, roi: 580 },
];

const roiMensal = [
  { month: "Jan", investimento: 95, receita: 245 },
  { month: "Fev", investimento: 102, receita: 278 },
  { month: "Mar", investimento: 98, receita: 256 },
  { month: "Abr", investimento: 115, receita: 321 },
  { month: "Mai", investimento: 108, receita: 298 },
  { month: "Jun", investimento: 131, receita: 368 },
];

// Dados Cashflow
const fluxoCaixa = [
  { month: "Jan", receitas: 850, despesas: 620, saldo: 230 },
  { month: "Fev", receitas: 898, despesas: 645, saldo: 253 },
  { month: "Mar", receitas: 945, despesas: 678, saldo: 267 },
  { month: "Abr", receitas: 1004, despesas: 695, saldo: 309 },
  { month: "Mai", receitas: 1057, despesas: 720, saldo: 337 },
  { month: "Jun", receitas: 1125, despesas: 748, saldo: 377 },
];

// Componente de KPI Card para TV
const TVKPICard = ({ 
  label, 
  value, 
  change, 
  icon: Icon, 
  trend 
}: { 
  label: string; 
  value: string; 
  change: string; 
  icon: any; 
  trend: "up" | "down";
}) => (
  <Card className="p-4 gradient-card border-border shadow-medium">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <div className="flex items-end justify-between">
      <p className="text-3xl font-bold text-foreground">{value}</p>
      <div className={`flex items-center text-base font-medium ${
        trend === "up" ? "text-success" : "text-destructive"
      }`}>
        {trend === "up" ? (
          <TrendingUp className="h-4 w-4 mr-1" />
        ) : (
          <TrendingDown className="h-4 w-4 mr-1" />
        )}
        {change}
      </div>
    </div>
  </Card>
);

export const tvSlides = [
  {
    id: "overview-kpis",
    title: "Visão Executiva",
    subtitle: "Principais Indicadores do Grupo FN",
    content: (
      <div className="space-y-4 h-full flex flex-col">
        <div className="grid grid-cols-4 gap-4">
          <TVKPICard
            label="MRR Atual"
            value="R$ 1.125M"
            change="+6.4%"
            icon={DollarSign}
            trend="up"
          />
          <TVKPICard
            label="Churn Rate"
            value="0.67%"
            change="-29.5%"
            icon={TrendingDown}
            trend="up"
          />
          <TVKPICard
            label="LTV/CAC Ratio"
            value="4.37x"
            change="+21.1%"
            icon={Target}
            trend="up"
          />
          <TVKPICard
            label="Receita/Colab"
            value="R$ 11.250"
            change="+6.4%"
            icon={Users}
            trend="up"
          />
        </div>
        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          <Card className="p-4 gradient-card border-border shadow-soft">
            <h3 className="text-lg font-semibold text-foreground mb-2">Evolução do MRR</h3>
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={mrrData}>
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
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <Card className="p-4 gradient-card border-border shadow-soft">
            <h3 className="text-lg font-semibold text-foreground mb-2">Composição do Crescimento MRR</h3>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={mrrComposicao}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip valuePrefix="R$ " />} />
                <Legend />
                <Bar dataKey="novos" fill="hsl(142 76% 36%)" name="Novos" stackId="a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expansao" fill="hsl(217 91% 60%)" name="Expansão" stackId="a" />
                <Bar dataKey="churn" fill="hsl(0 84% 60%)" name="Churn" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    ),
  },
  {
    id: "sales",
    title: "Comercial & Vendas",
    subtitle: "Performance do Time e Metas",
    content: (
      <div className="space-y-4 h-full flex flex-col">
        <div className="grid grid-cols-4 gap-4">
          <TVKPICard
            label="Vendas do Mês"
            value="148"
            change="+8.4%"
            icon={Target}
            trend="up"
          />
          <TVKPICard
            label="Taxa de Conversão"
            value="19.9%"
            change="+2.1%"
            icon={TrendingUp}
            trend="up"
          />
          <TVKPICard
            label="Ticket Médio"
            value="R$ 3.480"
            change="+5.2%"
            icon={Award}
            trend="up"
          />
          <TVKPICard
            label="Pipeline Total"
            value="R$ 2.03M"
            change="+12.3%"
            icon={DollarSign}
            trend="up"
          />
        </div>
        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          <Card className="p-4 gradient-card border-border shadow-soft">
            <h3 className="text-lg font-semibold text-foreground mb-2">Ranking de Vendedores</h3>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={vendedoresData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="vendedor" type="category" stroke="hsl(var(--muted-foreground))" width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="vendas" fill="hsl(142 76% 36%)" name="Realizado" radius={[0, 8, 8, 0]} />
                <Bar dataKey="meta" fill="hsl(217 91% 60%)" name="Meta" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card className="p-4 gradient-card border-border shadow-soft">
            <h3 className="text-lg font-semibold text-foreground mb-2">Meta vs Realizado</h3>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={metasTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="meta"
                  stroke="hsl(217 91% 60%)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Meta"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="realizado"
                  stroke="hsl(142 76% 36%)"
                  strokeWidth={3}
                  name="Realizado"
                  dot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    ),
  },
  {
    id: "marketing",
    title: "Marketing & ROI",
    subtitle: "Investimento e Retorno",
    content: (
      <div className="space-y-4 h-full flex flex-col">
        <div className="grid grid-cols-4 gap-4">
          <TVKPICard
            label="Investimento"
            value="R$ 131K"
            change="+21.3%"
            icon={DollarSign}
            trend="up"
          />
          <TVKPICard
            label="Total de Leads"
            value="4.120"
            change="+15.8%"
            icon={Users}
            trend="up"
          />
          <TVKPICard
            label="Custo por Lead"
            value="R$ 32"
            change="-8.5%"
            icon={Target}
            trend="up"
          />
          <TVKPICard
            label="ROI Médio"
            value="181%"
            change="+2.8%"
            icon={TrendingUp}
            trend="up"
          />
        </div>
        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          <Card className="p-4 gradient-card border-border shadow-soft">
            <h3 className="text-lg font-semibold text-foreground mb-2">Performance por Canal</h3>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={canalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="canal" stroke="hsl(var(--muted-foreground))" angle={-15} textAnchor="end" height={80} />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="leads" fill="hsl(217 91% 60%)" name="Leads" />
                <Bar dataKey="roi" fill="hsl(142 76% 36%)" name="ROI %" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card className="p-4 gradient-card border-border shadow-soft">
            <h3 className="text-lg font-semibold text-foreground mb-2">ROI Mensal</h3>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={roiMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip valuePrefix="R$ " />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="investimento"
                  stroke="hsl(0 84% 60%)"
                  strokeWidth={3}
                  name="Investimento"
                  dot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="receita"
                  stroke="hsl(142 76% 36%)"
                  strokeWidth={3}
                  name="Receita"
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    ),
  },
  {
    id: "cashflow",
    title: "Fluxo de Caixa",
    subtitle: "Receitas, Despesas e Saldo",
    content: (
      <div className="space-y-4 h-full flex flex-col">
        <div className="grid grid-cols-3 gap-4">
          <TVKPICard
            label="Receitas"
            value="R$ 1.125M"
            change="+6.4%"
            icon={TrendingUp}
            trend="up"
          />
          <TVKPICard
            label="Despesas"
            value="R$ 748K"
            change="+3.9%"
            icon={DollarSign}
            trend="down"
          />
          <TVKPICard
            label="Saldo"
            value="R$ 377K"
            change="+13.2%"
            icon={Award}
            trend="up"
          />
        </div>
        <div className="flex-1 min-h-0">
          <Card className="p-4 gradient-card border-border shadow-soft h-full">
            <h3 className="text-lg font-semibold text-foreground mb-2">Evolução do Fluxo de Caixa</h3>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={fluxoCaixa}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip valuePrefix="R$ " />} />
                <Legend />
                <Bar dataKey="receitas" fill="hsl(142 76% 36%)" name="Receitas" radius={[8, 8, 0, 0]} />
                <Bar dataKey="despesas" fill="hsl(0 84% 60%)" name="Despesas" radius={[8, 8, 0, 0]} />
                <Bar dataKey="saldo" fill="hsl(217 91% 60%)" name="Saldo" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    ),
  },
];
