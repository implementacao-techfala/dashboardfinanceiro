# 📚 Arquitetura do Sistema - Guia para IAs

Este documento serve como referência completa para qualquer IA que precise manipular o código deste projeto. Leia este arquivo PRIMEIRO antes de fazer alterações.

---

## 🎯 Visão Geral do Projeto

**Tipo:** Dashboard analítico estilo Power BI (somente leitura)
**Público:** CEO e gestores do Grupo FN (contabilidade brasileira)
**Idioma:** Português (PT-BR) em toda interface
**Foco:** Métricas de negócio, KPIs financeiros, visualizações interativas

---

## 🛠️ Stack Tecnológica

| Tecnologia | Uso |
|------------|-----|
| React 18 | Framework UI |
| TypeScript | Tipagem estática |
| Vite | Bundler/dev server |
| Tailwind CSS | Estilização utility-first |
| shadcn/ui | Componentes base (em `src/components/ui/`) |
| Recharts | Gráficos e visualizações |
| React Router | Navegação SPA |
| Lucide React | Ícones |
| IndexedDB | Persistência local de dados |

---

## 📁 Estrutura de Diretórios

```
src/
├── assets/              # Imagens e recursos estáticos
├── components/          # Componentes reutilizáveis
│   ├── ui/              # Componentes shadcn/ui (NÃO MODIFICAR diretamente)
│   ├── ChartCard.tsx    # Container para gráficos
│   ├── ExpandableChart.tsx # Gráficos com modal fullscreen
│   ├── KPICard.tsx      # Cards de métricas principais
│   ├── FilterBadges.tsx # Badges de filtros ativos
│   ├── AccountSelector.tsx # Seletor de contas (Zov, Papaya, Mdias)
│   ├── DashboardLayout.tsx # Layout wrapper com sidebar
│   ├── DashboardSidebar.tsx # Menu lateral de navegação
│   ├── SmartUploadModal.tsx # Modal de upload de dados
│   ├── SmartColumnMapper.tsx # Mapeamento de colunas Excel→Sistema
│   └── ...
├── contexts/            # Estado global React Context
│   ├── AuthContext.tsx  # Autenticação e roles de usuário
│   ├── DataContext.tsx  # Dados carregados (MRR, vendas, etc.)
│   └── FilterContext.tsx # Filtros globais (conta, mês, região)
├── hooks/               # Custom hooks
├── lib/                 # Utilitários e lógica de negócio
│   ├── utils.ts         # Função cn() para classes Tailwind
│   ├── indexedDB.ts     # Persistência local
│   ├── smartTemplates.ts # Templates de upload por página
│   ├── columnMapping.ts # Lógica de mapeamento de colunas
│   └── templates.ts     # Definições de campos esperados
├── pages/               # Páginas/rotas do dashboard
│   ├── Index.tsx        # Redirecionamento inicial
│   ├── Login.tsx        # Seleção de role (sem senha)
│   ├── Overview.tsx     # Dashboard CEO (visão geral)
│   ├── Financial.tsx    # Métricas financeiras
│   ├── Sales.tsx        # Vendas e comercial
│   ├── Clients.tsx      # Base de clientes
│   ├── Marketing.tsx    # Métricas de marketing
│   ├── HR.tsx           # Recursos humanos
│   ├── Cashflow.tsx     # Fluxo de caixa
│   ├── Services.tsx     # Serviços e margens
│   └── TVPresentation.tsx # Modo TV (slides automáticos)
└── data/                # Dados estáticos e configurações
    └── tvSlides.tsx     # Configuração dos slides TV
```

---

## 🔄 Fluxo de Dados

### 1. Upload de Dados (usuário → sistema)
```
Usuário clica "Upload" 
  → SmartUploadModal abre
  → Usuário seleciona arquivo Excel
  → analyzeUploadedFile() (smartTemplates.ts) processa
  → Se colunas não batem: SmartColumnMapper aparece
  → Usuário mapeia colunas
  → Dados salvos no IndexedDB
  → DataContext atualizado
  → Gráficos re-renderizam
```

### 2. Filtros (usuário → visualizações)
```
Usuário seleciona conta no AccountSelector
  → FilterContext.setFilter('account', 'zov')
  → Todos componentes que usam useFilters() re-renderizam
  → Dados filtrados automaticamente
  → FilterBadges mostra filtros ativos
```

### 3. Autenticação (role-based)
```
Usuário acessa /login
  → Seleciona role (Master, Comercial, Financeiro, etc.)
  → AuthContext.login(role) chamado
  → Sidebar mostra apenas páginas permitidas
  → Rotas protegidas verificam canAccess()
```

---

## 🎨 Sistema de Design

### Cores (definidas em `src/index.css`)

**REGRA CRÍTICA:** NUNCA use cores diretas como `text-white`, `bg-black`. SEMPRE use tokens semânticos.

```css
/* Tokens principais */
--background    /* Fundo geral */
--foreground    /* Texto principal */
--primary       /* Cor de destaque (azul) */
--secondary     /* Elementos secundários */
--muted         /* Elementos sutis */
--destructive   /* Erros/alertas */
--border        /* Bordas */
--card          /* Fundo de cards */
```

### Uso correto:
```tsx
// ✅ CORRETO
<div className="bg-background text-foreground border-border">
<Badge className="bg-primary/10 text-primary">

// ❌ ERRADO
<div className="bg-white text-black border-gray-200">
```

### Gradientes e sombras
```css
--gradient-primary   /* Gradiente principal */
--shadow-soft        /* Sombra suave */
--shadow-hover       /* Sombra em hover */
```

---

## 📊 Componentes de Gráficos

### ExpandableChart
O componente principal para gráficos. Suporta:
- Tipos: `area`, `bar`, `line`, `pie`, `composed`
- Modal fullscreen ao clicar no botão de expandir
- Click-to-filter nos elementos do gráfico
- Tooltips customizados

```tsx
<ExpandableChart
  title="Receita Mensal"
  description="Evolução do MRR"
  chartType="area"
  data={mrrData}
  dataKey="value"
  xAxisKey="month"
  color="hsl(var(--primary))"
  onClick={handleChartClick} // Para filtrar
/>
```

### KPICard
Cards de métricas com indicadores de variação:

```tsx
<KPICard
  title="MRR"
  value="R$ 150.000"
  change={12.5}
  trend="up"
  icon={DollarSign}
  tooltip="Monthly Recurring Revenue"
/>
```

---

## 🗃️ Sistema de Upload de Dados

### Templates (`src/lib/smartTemplates.ts`)

Cada página tem um template definindo campos esperados:

```typescript
{
  id: "financial",
  name: "Dashboard Financeiro",
  sheets: [
    {
      name: "Receitas",
      columns: [
        { name: "data_competencia", type: "date", required: true },
        { name: "receita_total", type: "number", required: true },
        // ...
      ]
    }
  ]
}
```

### Mapeamento de Colunas (`SmartColumnMapper.tsx`)

Quando o Excel do usuário tem nomes diferentes:
1. Sistema sugere mapeamentos por similaridade
2. Usuário confirma/corrige
3. Dados são transformados para o formato esperado

---

## 🔐 Sistema de Roles

### Roles disponíveis (`AuthContext.tsx`)

| Role | Páginas acessíveis |
|------|-------------------|
| Master | Todas |
| Comercial | Clients, Sales, Services, Marketing |
| Marketing | Clients, Sales, Services, Marketing |
| Financeiro | Todas exceto HR |
| RH | Apenas HR |
| Suporte | Todas + upload de dados |

### Verificação de acesso:
```tsx
const { canAccess } = useAuth();

if (canAccess('financial')) {
  // Mostrar conteúdo
}
```

---

## 📺 Modo TV (`TVPresentation.tsx`)

Apresentação automática para monitores:
- Slides trocam a cada 12 segundos
- Controles play/pause
- Navegação manual
- Layout otimizado para TV horizontal
- Sem sidebar

---

## 🧪 Padrões de Código

### Imports
```tsx
// 1. React e hooks
import { useState, useEffect } from "react";

// 2. Bibliotecas externas
import { format } from "date-fns";

// 3. Componentes UI (shadcn)
import { Button } from "@/components/ui/button";

// 4. Componentes próprios
import { KPICard } from "@/components/KPICard";

// 5. Contextos e hooks
import { useFilters } from "@/contexts/FilterContext";

// 6. Utilitários
import { cn } from "@/lib/utils";
```

### Estilização
```tsx
// Usar cn() para classes condicionais
<div className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === "primary" && "primary-classes"
)}>
```

### Estado
```tsx
// Preferir contextos para estado global
const { filters, setFilter } = useFilters();

// useState para estado local de componente
const [isOpen, setIsOpen] = useState(false);
```

---

## ⚠️ Regras Importantes

1. **NUNCA modifique `src/components/ui/`** - São componentes shadcn base
2. **SEMPRE use tokens de cor** - Nunca cores diretas
3. **Mantenha PT-BR** - Toda interface em português
4. **Sem backend** - Dados via IndexedDB, não Supabase
5. **Responsivo** - Todos componentes devem funcionar em diferentes telas
6. **Filtros reativos** - Gráficos devem reagir a FilterContext
7. **Templates completos** - Todos campos são obrigatórios nos uploads

---

## 🔧 Comandos Úteis

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run preview  # Preview do build
```

---

## 📝 Checklist para Alterações

Antes de modificar código, verifique:

- [ ] Arquivo já está no contexto? Não leia novamente
- [ ] Usa tokens de cor do design system?
- [ ] Mantém português na interface?
- [ ] Componente é responsivo?
- [ ] Não quebra filtros existentes?
- [ ] Segue padrão de imports?
- [ ] Não modifica componentes UI base?

---

## 🗺️ Mapa de Dependências entre Arquivos

```
App.tsx
├── AuthContext (login, roles)
├── FilterContext (filtros globais)
├── DataContext (dados carregados)
└── Routes
    ├── Login.tsx
    ├── Overview.tsx
    │   ├── DashboardLayout
    │   │   └── DashboardSidebar
    │   ├── FilterBadges
    │   ├── AccountSelector
    │   ├── ExpandableChart
    │   └── KPICard
    ├── Financial.tsx (mesma estrutura)
    ├── Sales.tsx
    └── ...
```

---

*Última atualização: Dezembro 2024*
