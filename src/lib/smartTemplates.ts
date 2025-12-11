import * as XLSX from 'xlsx';
import { generateMappings, type ColumnMapping } from './columnMapping';

// ==========================================
// FILOSOFIA: DADOS BRUTOS, NÃO CALCULADOS
// O usuário insere FATOS, o sistema calcula
// ==========================================

export interface SmartTemplate {
  id: string;
  name: string;
  description: string;
  sheets: SmartSheet[];
}

export interface SmartSheet {
  name: string;
  description: string;
  columns: SmartColumn[];
  examples: Record<string, any>[];
}

export interface SmartColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  required: boolean;
  description: string;
  options?: string[]; // Para tipo 'select'
}

// Templates simplificados - apenas dados brutos
export const smartTemplates: Record<string, SmartTemplate> = {
  overview: {
    id: 'overview',
    name: 'Visão Geral',
    description: 'Histórico mensal consolidado da empresa',
    sheets: [
      {
        name: 'Historico_Mensal',
        description: 'Dados mensais consolidados',
        columns: [
          { key: 'mes_ano', label: 'Mês/Ano', type: 'date', required: true, description: 'Ex: 2024-01' },
          { key: 'conta', label: 'Conta', type: 'select', required: true, description: 'Zov, Papaya, Mdias', options: ['Zov', 'Papaya', 'Mdias'] },
          { key: 'receita_total', label: 'Receita Total (R$)', type: 'number', required: true, description: 'Faturamento bruto do mês' },
          { key: 'custos_fixos', label: 'Custos Fixos (R$)', type: 'number', required: true, description: 'Aluguel, salários, etc.' },
          { key: 'custos_variaveis', label: 'Custos Variáveis (R$)', type: 'number', required: true, description: 'Comissões, insumos, etc.' },
          { key: 'impostos', label: 'Impostos (R$)', type: 'number', required: true, description: 'Tributos sobre receita' },
          { key: 'numero_clientes', label: 'Nº Clientes Ativos', type: 'number', required: true, description: 'Total de clientes no mês' },
          { key: 'numero_funcionarios', label: 'Nº Funcionários', type: 'number', required: true, description: 'Headcount do mês' },
          { key: 'investimento_marketing', label: 'Investimento Marketing (R$)', type: 'number', required: true, description: 'Total gasto em marketing' },
        ],
        examples: [
          { mes_ano: '2024-01', conta: 'Zov', receita_total: 150000, custos_fixos: 50000, custos_variaveis: 20000, impostos: 10000, numero_clientes: 45, numero_funcionarios: 12, investimento_marketing: 8000 },
          { mes_ano: '2024-02', conta: 'Zov', receita_total: 165000, custos_fixos: 52000, custos_variaveis: 22000, impostos: 11000, numero_clientes: 48, numero_funcionarios: 13, investimento_marketing: 9500 },
        ]
      }
    ]
  },

  hr: {
    id: 'hr',
    name: 'Recursos Humanos',
    description: 'Dados de colaboradores, custos e movimentações',
    sheets: [
      {
        name: 'Colaboradores',
        description: 'Lista completa de funcionários',
        columns: [
          { key: 'nome', label: 'Nome Completo', type: 'text', required: true, description: 'Nome do colaborador' },
          { key: 'departamento', label: 'Departamento', type: 'text', required: true, description: 'Ex: Contabilidade, RH, Comercial' },
          { key: 'cargo', label: 'Cargo', type: 'text', required: true, description: 'Função atual' },
          { key: 'data_admissao', label: 'Data Admissão', type: 'date', required: true, description: 'Formato: YYYY-MM-DD' },
          { key: 'salario_bruto', label: 'Salário Bruto (R$)', type: 'number', required: true, description: 'Salário mensal bruto' },
          { key: 'encargos', label: 'Encargos (R$)', type: 'number', required: true, description: 'INSS, FGTS, etc.' },
          { key: 'beneficios', label: 'Benefícios (R$)', type: 'number', required: true, description: 'VT, VR, plano saúde, etc.' },
          { key: 'tipo_contrato', label: 'Tipo Contrato', type: 'select', required: true, description: 'CLT, PJ, Estágio', options: ['CLT', 'PJ', 'Estágio', 'Temporário'] },
          { key: 'gestor', label: 'Gestor Direto', type: 'text', required: true, description: 'Nome do gestor (N/A se não aplicável)' },
        ],
        examples: [
          { nome: 'João Silva', departamento: 'Contabilidade', cargo: 'Analista Fiscal', data_admissao: '2022-03-15', salario_bruto: 4500, encargos: 1800, beneficios: 850, tipo_contrato: 'CLT', gestor: 'Maria Santos' },
          { nome: 'Maria Santos', departamento: 'Contabilidade', cargo: 'Coordenadora', data_admissao: '2021-08-01', salario_bruto: 8000, encargos: 3200, beneficios: 1200, tipo_contrato: 'CLT', gestor: 'N/A' },
        ]
      },
      {
        name: 'Movimentacoes',
        description: 'Admissões e desligamentos',
        columns: [
          { key: 'data', label: 'Data', type: 'date', required: true, description: 'Data do evento' },
          { key: 'nome', label: 'Nome', type: 'text', required: true, description: 'Nome do colaborador' },
          { key: 'departamento', label: 'Departamento', type: 'text', required: true, description: 'Departamento' },
          { key: 'tipo', label: 'Tipo', type: 'select', required: true, description: 'Admissão ou Desligamento', options: ['Admissão', 'Desligamento'] },
          { key: 'motivo', label: 'Motivo', type: 'text', required: true, description: 'Motivo (ex: Pedido demissão, Justa causa, Contratação, N/A)' },
          { key: 'custo_rescisao', label: 'Custo Rescisão (R$)', type: 'number', required: true, description: 'Valor da rescisão (0 se admissão)' },
        ],
        examples: [
          { data: '2024-01-15', nome: 'Pedro Costa', departamento: 'TI', tipo: 'Admissão', motivo: 'Contratação', custo_rescisao: 0 },
          { data: '2024-02-28', nome: 'Ana Lima', departamento: 'Comercial', tipo: 'Desligamento', motivo: 'Pedido demissão', custo_rescisao: 8500 },
        ]
      },
      {
        name: 'Pesquisa_Clima',
        description: 'Resultados de NPS interno por departamento',
        columns: [
          { key: 'mes', label: 'Mês Referência', type: 'date', required: true, description: 'Ex: 2024-01' },
          { key: 'departamento', label: 'Departamento', type: 'text', required: true, description: 'Departamento avaliado' },
          { key: 'respondentes', label: 'Respondentes', type: 'number', required: true, description: 'Quantidade que respondeu' },
          { key: 'promotores', label: 'Promotores (9-10)', type: 'number', required: true, description: 'Notas 9 ou 10' },
          { key: 'neutros', label: 'Neutros (7-8)', type: 'number', required: true, description: 'Notas 7 ou 8' },
          { key: 'detratores', label: 'Detratores (0-6)', type: 'number', required: true, description: 'Notas 0 a 6' },
        ],
        examples: [
          { mes: '2024-01', departamento: 'Contabilidade', respondentes: 40, promotores: 28, neutros: 8, detratores: 4 },
          { mes: '2024-01', departamento: 'Comercial', respondentes: 12, promotores: 9, neutros: 2, detratores: 1 },
        ]
      }
    ]
  },

  financial: {
    id: 'financial',
    name: 'Financeiro',
    description: 'Lançamentos financeiros detalhados e DRE',
    sheets: [
      {
        name: 'Lancamentos',
        description: 'Receitas e despesas detalhadas',
        columns: [
          { key: 'data', label: 'Data Competência', type: 'date', required: true, description: 'Mês de competência' },
          { key: 'conta', label: 'Conta', type: 'select', required: true, description: 'Zov, Papaya, Mdias', options: ['Zov', 'Papaya', 'Mdias'] },
          { key: 'categoria', label: 'Categoria', type: 'text', required: true, description: 'Ex: Receita de Serviços, Salários, Impostos' },
          { key: 'subcategoria', label: 'Subcategoria', type: 'text', required: true, description: 'Detalhamento (ex: IRPJ, INSS, etc.)' },
          { key: 'tipo', label: 'Tipo', type: 'select', required: true, description: 'Receita ou Despesa', options: ['Receita', 'Despesa'] },
          { key: 'valor', label: 'Valor (R$)', type: 'number', required: true, description: 'Valor do lançamento' },
          { key: 'centro_custo', label: 'Centro de Custo', type: 'text', required: true, description: 'Departamento responsável (N/A se não aplicável)' },
          { key: 'descricao', label: 'Descrição', type: 'text', required: true, description: 'Detalhamento' },
        ],
        examples: [
          { data: '2024-01-01', conta: 'Zov', categoria: 'Receita de Serviços', subcategoria: 'Contabilidade', tipo: 'Receita', valor: 50000, centro_custo: 'Operacional', descricao: 'Mensalidades' },
          { data: '2024-01-05', conta: 'Zov', categoria: 'Pessoal', subcategoria: 'Salários', tipo: 'Despesa', valor: 35000, centro_custo: 'RH', descricao: 'Folha de Pagamento' },
          { data: '2024-01-10', conta: 'Papaya', categoria: 'Impostos', subcategoria: 'DAS', tipo: 'Despesa', valor: 8000, centro_custo: 'Financeiro', descricao: 'DAS Simples Nacional' },
        ]
      },
      {
        name: 'Contas_Receber',
        description: 'Títulos a receber e inadimplência',
        columns: [
          { key: 'cliente', label: 'Cliente', type: 'text', required: true, description: 'Nome do cliente' },
          { key: 'valor', label: 'Valor (R$)', type: 'number', required: true, description: 'Valor do título' },
          { key: 'vencimento', label: 'Data Vencimento', type: 'date', required: true, description: 'Data de vencimento' },
          { key: 'status', label: 'Status', type: 'select', required: true, description: 'Em dia, Vencido, Pago', options: ['Em dia', 'Vencido', 'Pago'] },
          { key: 'dias_atraso', label: 'Dias em Atraso', type: 'number', required: true, description: '0 se em dia ou pago' },
        ],
        examples: [
          { cliente: 'Empresa ABC', valor: 3500, vencimento: '2024-01-15', status: 'Pago', dias_atraso: 0 },
          { cliente: 'Tech Corp', valor: 8000, vencimento: '2024-01-20', status: 'Vencido', dias_atraso: 25 },
        ]
      },
      {
        name: 'Orcado_Realizado',
        description: 'Comparativo orçado vs realizado',
        columns: [
          { key: 'mes', label: 'Mês', type: 'date', required: true, description: 'Ex: 2024-01' },
          { key: 'categoria', label: 'Categoria', type: 'text', required: true, description: 'Categoria do orçamento' },
          { key: 'orcado', label: 'Orçado (R$)', type: 'number', required: true, description: 'Valor planejado' },
          { key: 'realizado', label: 'Realizado (R$)', type: 'number', required: true, description: 'Valor efetivo' },
        ],
        examples: [
          { mes: '2024-01', categoria: 'Receita Total', orcado: 480000, realizado: 450000 },
          { mes: '2024-01', categoria: 'Custos Operacionais', orcado: 280000, realizado: 295000 },
        ]
      }
    ]
  },

  sales: {
    id: 'sales',
    name: 'Comercial',
    description: 'Pipeline de vendas, metas e performance individual',
    sheets: [
      {
        name: 'Oportunidades',
        description: 'Funil de vendas detalhado',
        columns: [
          { key: 'id', label: 'ID Oportunidade', type: 'text', required: true, description: 'Identificador único' },
          { key: 'data_criacao', label: 'Data Criação', type: 'date', required: true, description: 'Quando entrou no funil' },
          { key: 'cliente', label: 'Cliente/Lead', type: 'text', required: true, description: 'Nome do prospect' },
          { key: 'vendedor', label: 'Vendedor', type: 'text', required: true, description: 'Responsável pela oportunidade' },
          { key: 'servico', label: 'Serviço', type: 'text', required: true, description: 'Produto/serviço de interesse' },
          { key: 'etapa', label: 'Etapa', type: 'select', required: true, description: 'Fase do funil', options: ['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Fechado Ganho', 'Fechado Perdido'] },
          { key: 'valor', label: 'Valor (R$)', type: 'number', required: true, description: 'Valor estimado da venda' },
          { key: 'origem', label: 'Origem do Lead', type: 'select', required: true, description: 'Como chegou', options: ['Google Ads', 'Facebook', 'Instagram', 'LinkedIn', 'Indicação', 'Orgânico', 'Evento', 'Outro'] },
          { key: 'data_fechamento', label: 'Data Fechamento', type: 'date', required: true, description: 'Data de ganho/perda (use data futura se em aberto)' },
          { key: 'motivo_perda', label: 'Motivo Perda', type: 'text', required: true, description: 'Se perdido, por quê (N/A se ganho ou aberto)' },
        ],
        examples: [
          { id: 'OP-001', data_criacao: '2024-01-10', cliente: 'Empresa ABC', vendedor: 'Ana Silva', servico: 'Contabilidade', etapa: 'Negociação', valor: 15000, origem: 'Google Ads', data_fechamento: '2024-02-15', motivo_perda: 'N/A' },
          { id: 'OP-002', data_criacao: '2024-01-05', cliente: 'Tech Corp', vendedor: 'Carlos Souza', servico: 'BPO Financeiro', etapa: 'Fechado Ganho', valor: 22000, origem: 'Indicação', data_fechamento: '2024-01-20', motivo_perda: 'N/A' },
          { id: 'OP-003', data_criacao: '2024-01-08', cliente: 'Loja XYZ', vendedor: 'Ana Silva', servico: 'Certificado Digital', etapa: 'Fechado Perdido', valor: 800, origem: 'Orgânico', data_fechamento: '2024-01-25', motivo_perda: 'Preço' },
        ]
      },
      {
        name: 'Atividades_Vendedor',
        description: 'Contatos e atividades diárias por vendedor',
        columns: [
          { key: 'data', label: 'Data', type: 'date', required: true, description: 'Data da atividade' },
          { key: 'vendedor', label: 'Vendedor', type: 'text', required: true, description: 'Nome do vendedor' },
          { key: 'ligacoes', label: 'Ligações', type: 'number', required: true, description: 'Quantidade de ligações' },
          { key: 'whatsapp', label: 'WhatsApp', type: 'number', required: true, description: 'Mensagens enviadas' },
          { key: 'emails', label: 'E-mails', type: 'number', required: true, description: 'E-mails enviados' },
          { key: 'reunioes', label: 'Reuniões', type: 'number', required: true, description: 'Reuniões realizadas' },
          { key: 'propostas', label: 'Propostas Enviadas', type: 'number', required: true, description: 'Propostas formalizadas' },
        ],
        examples: [
          { data: '2024-01-15', vendedor: 'Ana Silva', ligacoes: 25, whatsapp: 18, emails: 12, reunioes: 3, propostas: 2 },
          { data: '2024-01-15', vendedor: 'Carlos Souza', ligacoes: 32, whatsapp: 24, emails: 8, reunioes: 2, propostas: 1 },
        ]
      },
      {
        name: 'Metas',
        description: 'Metas individuais por vendedor',
        columns: [
          { key: 'mes', label: 'Mês Referência', type: 'date', required: true, description: 'Ex: 2024-01' },
          { key: 'vendedor', label: 'Vendedor', type: 'text', required: true, description: 'Nome do vendedor' },
          { key: 'meta_qtd', label: 'Meta Quantidade', type: 'number', required: true, description: 'Meta de vendas em quantidade' },
          { key: 'meta_valor', label: 'Meta Valor (R$)', type: 'number', required: true, description: 'Meta de vendas em reais' },
        ],
        examples: [
          { mes: '2024-01', vendedor: 'Ana Silva', meta_qtd: 25, meta_valor: 100000 },
          { mes: '2024-01', vendedor: 'Carlos Souza', meta_qtd: 20, meta_valor: 80000 },
        ]
      }
    ]
  },

  marketing: {
    id: 'marketing',
    name: 'Marketing',
    description: 'Campanhas, leads e investimentos',
    sheets: [
      {
        name: 'Campanhas',
        description: 'Performance detalhada de campanhas',
        columns: [
          { key: 'mes', label: 'Mês', type: 'date', required: true, description: 'Mês de referência' },
          { key: 'campanha', label: 'Nome Campanha', type: 'text', required: true, description: 'Identificação da campanha' },
          { key: 'canal', label: 'Canal', type: 'select', required: true, description: 'Plataforma', options: ['Google Ads', 'Facebook', 'Instagram', 'LinkedIn', 'TikTok', 'YouTube', 'E-mail', 'Orgânico', 'Evento'] },
          { key: 'investimento', label: 'Investimento (R$)', type: 'number', required: true, description: 'Valor gasto' },
          { key: 'impressoes', label: 'Impressões', type: 'number', required: true, description: 'Vezes exibido (0 se orgânico)' },
          { key: 'cliques', label: 'Cliques', type: 'number', required: true, description: 'Cliques no anúncio' },
          { key: 'leads', label: 'Leads Gerados', type: 'number', required: true, description: 'Formulários preenchidos' },
          { key: 'vendas', label: 'Vendas Originadas', type: 'number', required: true, description: 'Vendas fechadas desta campanha' },
          { key: 'receita', label: 'Receita Gerada (R$)', type: 'number', required: true, description: 'Valor total das vendas' },
        ],
        examples: [
          { mes: '2024-01', campanha: 'Contabilidade PME', canal: 'Google Ads', investimento: 5000, impressoes: 125000, cliques: 3200, leads: 150, vendas: 12, receita: 48000 },
          { mes: '2024-01', campanha: 'BPO Financeiro', canal: 'LinkedIn', investimento: 2000, impressoes: 45000, cliques: 890, leads: 45, vendas: 5, receita: 35000 },
        ]
      },
      {
        name: 'Leads',
        description: 'Base de leads captados',
        columns: [
          { key: 'data_captacao', label: 'Data Captação', type: 'date', required: true, description: 'Quando o lead entrou' },
          { key: 'nome', label: 'Nome/Empresa', type: 'text', required: true, description: 'Identificação do lead' },
          { key: 'origem', label: 'Origem', type: 'text', required: true, description: 'Campanha/canal de origem' },
          { key: 'status', label: 'Status', type: 'select', required: true, description: 'Situação atual', options: ['Novo', 'Em contato', 'Qualificado', 'Desqualificado', 'Convertido'] },
          { key: 'vendedor_atribuido', label: 'Vendedor Atribuído', type: 'text', required: true, description: 'Responsável (N/A se não atribuído)' },
        ],
        examples: [
          { data_captacao: '2024-01-15', nome: 'Comércio ABC', origem: 'Google Ads - Contabilidade PME', status: 'Qualificado', vendedor_atribuido: 'Ana Silva' },
          { data_captacao: '2024-01-16', nome: 'Tech Solutions', origem: 'LinkedIn - BPO', status: 'Em contato', vendedor_atribuido: 'Carlos Souza' },
        ]
      }
    ]
  },

  clients: {
    id: 'clients',
    name: 'Clientes',
    description: 'Base de clientes, contratos e movimentações',
    sheets: [
      {
        name: 'Clientes',
        description: 'Cadastro completo de clientes ativos',
        columns: [
          { key: 'codigo', label: 'Código Cliente', type: 'text', required: true, description: 'ID interno do cliente' },
          { key: 'nome', label: 'Nome/Razão Social', type: 'text', required: true, description: 'Nome do cliente' },
          { key: 'cnpj_cpf', label: 'CNPJ/CPF', type: 'text', required: true, description: 'Documento de identificação' },
          { key: 'conta', label: 'Conta', type: 'select', required: true, description: 'Zov, Papaya ou Mdias', options: ['Zov', 'Papaya', 'Mdias'] },
          { key: 'servico_principal', label: 'Serviço Principal', type: 'text', required: true, description: 'Ex: Contabilidade, BPO' },
          { key: 'servicos_adicionais', label: 'Serviços Adicionais', type: 'text', required: true, description: 'Outros serviços (N/A se nenhum)' },
          { key: 'regime', label: 'Regime Tributário', type: 'select', required: true, description: 'Tipo de tributação', options: ['Simples Nacional', 'Lucro Presumido', 'Lucro Real', 'MEI', 'N/A'] },
          { key: 'mensalidade', label: 'Mensalidade (R$)', type: 'number', required: true, description: 'Valor do contrato mensal' },
          { key: 'faturamento_anual', label: 'Faturamento Anual (R$)', type: 'number', required: true, description: 'Faturamento do cliente (0 se desconhecido)' },
          { key: 'data_inicio', label: 'Data Início Contrato', type: 'date', required: true, description: 'Início do contrato' },
          { key: 'responsavel', label: 'Responsável Interno', type: 'text', required: true, description: 'Gestor de conta' },
          { key: 'nps', label: 'Última Nota NPS', type: 'number', required: true, description: 'Nota 0-10 (0 se nunca avaliou)' },
        ],
        examples: [
          { codigo: 'CLI-001', nome: 'Padaria Bom Pão', cnpj_cpf: '12.345.678/0001-90', conta: 'Zov', servico_principal: 'Contabilidade', servicos_adicionais: 'Certificado Digital', regime: 'Simples Nacional', mensalidade: 800, faturamento_anual: 180000, data_inicio: '2023-01-01', responsavel: 'Maria Santos', nps: 9 },
          { codigo: 'CLI-002', nome: 'Tech Solutions', cnpj_cpf: '98.765.432/0001-10', conta: 'Papaya', servico_principal: 'BPO Financeiro', servicos_adicionais: 'Contabilidade, BPO RH', regime: 'Lucro Presumido', mensalidade: 5500, faturamento_anual: 2500000, data_inicio: '2022-06-15', responsavel: 'João Silva', nps: 8 },
        ]
      },
      {
        name: 'Movimentacoes',
        description: 'Entradas, saídas e alterações de clientes',
        columns: [
          { key: 'data', label: 'Data', type: 'date', required: true, description: 'Data do evento' },
          { key: 'cliente', label: 'Cliente', type: 'text', required: true, description: 'Nome do cliente' },
          { key: 'tipo', label: 'Tipo', type: 'select', required: true, description: 'Tipo de movimentação', options: ['Novo Cliente', 'Churn', 'Upgrade', 'Downgrade'] },
          { key: 'servico', label: 'Serviço Afetado', type: 'text', required: true, description: 'Qual serviço' },
          { key: 'valor_anterior', label: 'Valor Anterior (R$)', type: 'number', required: true, description: '0 se novo cliente' },
          { key: 'valor_novo', label: 'Valor Novo (R$)', type: 'number', required: true, description: '0 se churn' },
          { key: 'motivo', label: 'Motivo', type: 'text', required: true, description: 'Razão da movimentação' },
        ],
        examples: [
          { data: '2024-01-15', cliente: 'Nova Empresa LTDA', tipo: 'Novo Cliente', servico: 'Contabilidade', valor_anterior: 0, valor_novo: 1500, motivo: 'Indicação' },
          { data: '2024-01-28', cliente: 'Antiga Corp', tipo: 'Churn', servico: 'BPO Financeiro', valor_anterior: 2000, valor_novo: 0, motivo: 'Preço - concorrente mais barato' },
          { data: '2024-02-05', cliente: 'Tech Solutions', tipo: 'Upgrade', servico: 'BPO RH', valor_anterior: 3500, valor_novo: 5500, motivo: 'Aumento de escopo' },
        ]
      }
    ]
  },

  services: {
    id: 'services',
    name: 'Serviços',
    description: 'Rentabilidade e performance por linha de serviço',
    sheets: [
      {
        name: 'Servicos',
        description: 'Performance mensal por serviço',
        columns: [
          { key: 'mes', label: 'Mês', type: 'date', required: true, description: 'Mês de referência' },
          { key: 'servico', label: 'Serviço', type: 'text', required: true, description: 'Linha de serviço' },
          { key: 'conta', label: 'Conta', type: 'select', required: true, description: 'Zov, Papaya, Mdias', options: ['Zov', 'Papaya', 'Mdias'] },
          { key: 'receita', label: 'Receita (R$)', type: 'number', required: true, description: 'Faturamento do serviço' },
          { key: 'custo_pessoal', label: 'Custo Pessoal (R$)', type: 'number', required: true, description: 'Mão de obra alocada' },
          { key: 'custo_operacional', label: 'Custo Operacional (R$)', type: 'number', required: true, description: 'Outros custos diretos' },
          { key: 'clientes', label: 'Nº Clientes', type: 'number', required: true, description: 'Clientes ativos neste serviço' },
          { key: 'horas_trabalhadas', label: 'Horas Trabalhadas', type: 'number', required: true, description: 'Total de horas alocadas' },
        ],
        examples: [
          { mes: '2024-01', servico: 'Contabilidade', conta: 'Zov', receita: 80000, custo_pessoal: 32000, custo_operacional: 8000, clientes: 120, horas_trabalhadas: 1200 },
          { mes: '2024-01', servico: 'BPO Financeiro', conta: 'Papaya', receita: 35000, custo_pessoal: 12000, custo_operacional: 3000, clientes: 25, horas_trabalhadas: 450 },
        ]
      }
    ]
  },

  cashflow: {
    id: 'cashflow',
    name: 'Fluxo de Caixa',
    description: 'Movimentações de caixa e projeções',
    sheets: [
      {
        name: 'Movimentacoes',
        description: 'Entradas e saídas de caixa',
        columns: [
          { key: 'data', label: 'Data', type: 'date', required: true, description: 'Data da movimentação' },
          { key: 'conta', label: 'Conta', type: 'select', required: true, description: 'Zov, Papaya, Mdias', options: ['Zov', 'Papaya', 'Mdias'] },
          { key: 'tipo', label: 'Tipo', type: 'select', required: true, description: 'Entrada ou Saída', options: ['Entrada', 'Saída'] },
          { key: 'categoria', label: 'Categoria', type: 'text', required: true, description: 'Ex: Recebimento, Fornecedor, Salários' },
          { key: 'valor', label: 'Valor (R$)', type: 'number', required: true, description: 'Valor da movimentação' },
          { key: 'forma_pagamento', label: 'Forma Pagamento', type: 'select', required: true, description: 'Meio utilizado', options: ['PIX', 'TED', 'Boleto', 'Cartão', 'Dinheiro'] },
          { key: 'descricao', label: 'Descrição', type: 'text', required: true, description: 'Detalhamento' },
        ],
        examples: [
          { data: '2024-01-05', conta: 'Zov', tipo: 'Entrada', categoria: 'Recebimento Clientes', valor: 45000, forma_pagamento: 'PIX', descricao: 'Mensalidades Janeiro' },
          { data: '2024-01-10', conta: 'Zov', tipo: 'Saída', categoria: 'Folha de Pagamento', valor: 35000, forma_pagamento: 'TED', descricao: 'Salários' },
        ]
      },
      {
        name: 'Saldos_Bancarios',
        description: 'Posição de caixa por banco',
        columns: [
          { key: 'data', label: 'Data', type: 'date', required: true, description: 'Data do saldo' },
          { key: 'banco', label: 'Banco', type: 'text', required: true, description: 'Nome do banco' },
          { key: 'conta', label: 'Conta', type: 'select', required: true, description: 'Zov, Papaya, Mdias', options: ['Zov', 'Papaya', 'Mdias'] },
          { key: 'saldo', label: 'Saldo (R$)', type: 'number', required: true, description: 'Saldo disponível' },
        ],
        examples: [
          { data: '2024-01-31', banco: 'Itaú', conta: 'Zov', saldo: 125000 },
          { data: '2024-01-31', banco: 'Bradesco', conta: 'Papaya', saldo: 85000 },
        ]
      }
    ]
  }
};

// Gera o arquivo XLSX a partir do template
export const generateSmartTemplate = (templateId: string): ArrayBuffer => {
  const template = smartTemplates[templateId];
  if (!template) throw new Error(`Template ${templateId} não encontrado`);

  const wb = XLSX.utils.book_new();

  template.sheets.forEach(sheet => {
    const headers = sheet.columns.map(col => col.key);
    const ws = XLSX.utils.json_to_sheet(sheet.examples, { header: headers });
    
    // Ajusta largura das colunas
    ws['!cols'] = headers.map(() => ({ wch: 18 }));
    
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  });

  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
};

// Analisa arquivo uploaded e retorna resumo
export interface SheetMappingAnalysis {
  sourceColumns: string[];
  targetColumns: SmartColumn[];
  suggestedMappings: {
    sourceColumn: string;
    targetKey: string | null;
    targetLabel: string | null;
    confidence: number;
    isRequired: boolean;
  }[];
  needsReview: boolean;
  missingRequired: string[];
}

export interface FileAnalysis {
  fileName: string;
  totalRows: number;
  sheets: {
    name: string;
    rows: number;
    columns: string[];
    preview: Record<string, any>[];
    matchedTemplate: string | null;
    mappingAnalysis: SheetMappingAnalysis | null;
  }[];
  warnings: string[];
  needsColumnMapping: boolean;
}

export const analyzeUploadedFile = async (file: File, templateId: string): Promise<FileAnalysis> => {
  const template = smartTemplates[templateId];
  const warnings: string[] = [];
  let needsColumnMapping = false;

  console.log('[analyzeUploadedFile] Starting analysis for template:', templateId);

  // Check if template requires multiple sheets
  const requiredSheetCount = template?.sheets.length || 1;
  console.log('[analyzeUploadedFile] Template requires', requiredSheetCount, 'sheet(s)');

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        console.log('[analyzeUploadedFile] Excel sheets found:', workbook.SheetNames);
        console.log('[analyzeUploadedFile] Template sheets expected:', template?.sheets.map(s => s.name));

        // Validate: file must have at least as many sheets as the template requires
        if (template && workbook.SheetNames.length < template.sheets.length) {
          const missingCount = template.sheets.length - workbook.SheetNames.length;
          const expectedSheets = template.sheets.map(s => s.name).join(', ');
          reject(new Error(
            `Seu arquivo tem ${workbook.SheetNames.length} aba(s), mas este dashboard precisa de ${template.sheets.length} aba(s): ${expectedSheets}. ` +
            `Por favor, envie um arquivo com todas as abas necessárias.`
          ));
          return;
        }

        const sheets = workbook.SheetNames.map((sheetName, sheetIndex) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];
          const columns = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];

          console.log(`[analyzeUploadedFile] Sheet "${sheetName}": ${columns.length} columns, ${jsonData.length} rows`);
          console.log(`[analyzeUploadedFile] Columns found:`, columns);

          // Find matching template sheet - try multiple strategies
          let expectedSheet = template?.sheets.find(s => 
            s.name.toLowerCase() === sheetName.toLowerCase() ||
            s.name.replace(/_/g, ' ').toLowerCase() === sheetName.toLowerCase() ||
            s.name.replace(/_/g, '').toLowerCase() === sheetName.replace(/[\s_-]/g, '').toLowerCase()
          );

          // Fallback: if no match and this is the first sheet, use the first template sheet
          // (common case: user has "Plan1" or "Sheet1" instead of expected name)
          if (!expectedSheet && sheetIndex === 0 && template?.sheets.length > 0) {
            console.log('[analyzeUploadedFile] No sheet name match, using first template sheet as fallback');
            expectedSheet = template.sheets[0];
          }

          // Also try to match by sheet index if names don't match
          if (!expectedSheet && template?.sheets[sheetIndex]) {
            console.log('[analyzeUploadedFile] Using template sheet by index:', sheetIndex);
            expectedSheet = template.sheets[sheetIndex];
          }

          let mappingAnalysis: SheetMappingAnalysis | null = null;

          if (expectedSheet && columns.length > 0) {
            console.log(`[analyzeUploadedFile] Matching with template sheet: "${expectedSheet.name}"`);
            
            // Generate smart mappings
            const targetColumns = expectedSheet.columns.map(c => ({
              key: c.key,
              label: c.label,
              required: c.required
            }));
            
            const mappingResult = generateMappings(columns, targetColumns);
            
            console.log('[analyzeUploadedFile] Mapping result:', {
              matched: mappingResult.mappings.length,
              unmapped: mappingResult.unmappedSource.length,
              missingRequired: mappingResult.missingRequired
            });

            // Build suggested mappings
            const suggestedMappings = columns.map(sourceCol => {
              const mapping = mappingResult.mappings.find(m => m.sourceColumn === sourceCol);
              const targetCol = mapping ? expectedSheet!.columns.find(c => c.key === mapping.targetKey) : null;
              
              return {
                sourceColumn: sourceCol,
                targetKey: mapping?.targetKey || null,
                targetLabel: targetCol?.label || null,
                confidence: mapping?.confidence || 0,
                isRequired: targetCol?.required || false
              };
            });

            // Check if any mapping needs review - require review for ANY non-perfect match
            const hasLowConfidence = suggestedMappings.some(m => m.targetKey && m.confidence < 0.98);
            const hasMissing = mappingResult.missingRequired.length > 0;
            const hasUnmapped = mappingResult.unmappedSource.length > 0;
            const notAllMapped = suggestedMappings.filter(m => m.targetKey).length < targetColumns.filter(t => t.required).length;

            console.log('[analyzeUploadedFile] Review needed?', { hasLowConfidence, hasMissing, hasUnmapped, notAllMapped });

            mappingAnalysis = {
              sourceColumns: columns,
              targetColumns: expectedSheet.columns,
              suggestedMappings,
              needsReview: hasLowConfidence || hasMissing || hasUnmapped || notAllMapped,
              missingRequired: mappingResult.missingRequired
            };

            if (mappingAnalysis.needsReview) {
              needsColumnMapping = true;
              console.log('[analyzeUploadedFile] Column mapping will be required');
            }

            if (mappingResult.missingRequired.length > 0) {
              warnings.push(`Aba "${sheetName}": colunas obrigatórias não reconhecidas: ${mappingResult.missingRequired.join(', ')}`);
            }
          } else {
            console.log(`[analyzeUploadedFile] No template match for sheet "${sheetName}"`);
          }

          return {
            name: sheetName,
            rows: jsonData.length,
            columns,
            preview: jsonData.slice(0, 3),
            matchedTemplate: expectedSheet?.name || null,
            mappingAnalysis
          };
        });

        const totalRows = sheets.reduce((sum, s) => sum + s.rows, 0);

        resolve({
          fileName: file.name,
          totalRows,
          sheets,
          warnings,
          needsColumnMapping
        });
      } catch (error) {
        reject(new Error('Erro ao processar arquivo. Verifique se é um XLSX/CSV válido.'));
      }
    };

    reader.onerror = () => reject(new Error('Erro ao ler arquivo.'));
    reader.readAsArrayBuffer(file);
  });
};

// Processa e transforma os dados uploaded aplicando os mapeamentos
export const processUploadedData = async (
  file: File, 
  mappings?: Record<string, { sourceColumn: string; targetKey: string }[]>
): Promise<Record<string, any[]>> => {
  console.log('[processUploadedData] Starting...', { fileName: file.name, hasMappings: !!mappings });
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        console.log('[processUploadedData] Workbook sheets:', workbook.SheetNames);

        const result: Record<string, any[]> = {};
        
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const rawData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];
          
          console.log(`[processUploadedData] Sheet "${sheetName}": ${rawData.length} rows`);
          
          // Apply mappings if provided
          const sheetMappings = mappings?.[sheetName];
          if (sheetMappings && sheetMappings.length > 0) {
            console.log(`[processUploadedData] Applying ${sheetMappings.length} mappings to "${sheetName}"`);
            result[sheetName] = rawData.map(row => {
              const transformedRow: Record<string, any> = {};
              for (const mapping of sheetMappings) {
                if (row[mapping.sourceColumn] !== undefined) {
                  transformedRow[mapping.targetKey] = row[mapping.sourceColumn];
                }
              }
              return transformedRow;
            });
          } else {
            result[sheetName] = rawData;
          }
        });

        console.log('[processUploadedData] Final result:', Object.keys(result));
        resolve(result);
      } catch (error) {
        console.error('[processUploadedData] Error:', error);
        reject(new Error('Erro ao processar arquivo.'));
      }
    };

    reader.onerror = () => {
      console.error('[processUploadedData] FileReader error');
      reject(new Error('Erro ao ler arquivo.'));
    };
    reader.readAsArrayBuffer(file);
  });
};
