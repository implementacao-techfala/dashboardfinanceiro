// Smart column mapping and data transformation utilities

export interface ColumnMapping {
  sourceColumn: string;
  targetKey: string;
  confidence: number; // 0-1
  status: 'matched' | 'unmatched' | 'extra' | 'missing';
}

export interface MappingResult {
  mappings: ColumnMapping[];
  unmappedSource: string[];
  missingRequired: string[];
  needsUserReview: boolean;
}

// Common synonyms for column names in PT-BR
const synonyms: Record<string, string[]> = {
  month: ['mes', 'mês', 'período', 'periodo', 'data', 'competencia', 'competência'],
  departamento: ['depto', 'dept', 'área', 'area', 'setor'],
  colaboradores: ['funcionarios', 'funcionários', 'empregados', 'headcount', 'qtd_colab', 'qtde'],
  custo: ['custos', 'despesa', 'gasto', 'valor_custo'],
  turnover: ['rotatividade', 'turn_over'],
  nps: ['nps_score', 'score_nps', 'nota_nps'],
  admissoes: ['admissões', 'contratacoes', 'contratações', 'entradas_rh'],
  desligamentos: ['demissoes', 'demissões', 'saidas_rh', 'saídas'],
  receita: ['faturamento', 'revenue', 'vendas_valor', 'valor_receita'],
  entradas: ['receitas', 'recebimentos', 'entrada'],
  saidas: ['saídas', 'pagamentos', 'despesas', 'saida'],
  categoria: ['tipo', 'classificacao', 'classificação', 'grupo'],
  valor: ['montante', 'total', 'amount'],
  investimento: ['invest', 'gasto_mkt', 'budget'],
  leads: ['leads_gerados', 'contatos', 'prospects'],
  conversao: ['conversão', 'taxa_conversao', 'conv_rate'],
  roi: ['retorno', 'return', 'roi_percent'],
  clientes: ['customers', 'clients', 'base_clientes', 'qtd_clientes'],
  ativos: ['clientes_ativos', 'active', 'base_ativa'],
  novos: ['new', 'novos_clientes', 'aquisicao', 'aquisição'],
  perdidos: ['churn', 'cancelados', 'perdas', 'churned'],
  servico: ['serviço', 'service', 'linha_servico'],
  produto: ['product', 'item', 'linha_produto'],
  vendedor: ['seller', 'rep', 'representante', 'nome_vendedor'],
  meta: ['target', 'objetivo', 'goal', 'meta_vendas'],
  realizado: ['achieved', 'atingido', 'resultado'],
  ligacoes: ['ligações', 'calls', 'telefonemas'],
  whatsapp: ['wpp', 'zap', 'mensagens'],
  margem: ['margin', 'margem_lucro', 'margem_percent'],
  lucro: ['profit', 'resultado', 'lucro_liquido'],
  receitaBruta: ['receita_bruta', 'gross_revenue', 'faturamento_bruto'],
  impostos: ['taxes', 'tributos', 'deducoes', 'deduções'],
};

// Normalize string for comparison
const normalize = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_\s-]+/g, '')
    .trim();
};

// Calculate similarity between two strings (0-1)
const similarity = (a: string, b: string): number => {
  const s1 = normalize(a);
  const s2 = normalize(b);
  
  if (s1 === s2) return 1;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Levenshtein distance
  const matrix: number[][] = [];
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const maxLen = Math.max(s1.length, s2.length);
  return maxLen === 0 ? 1 : 1 - matrix[s1.length][s2.length] / maxLen;
};

// Find best match for a source column
export const findBestMatch = (
  sourceColumn: string,
  targetKeys: string[],
  targetLabels: string[]
): { key: string; confidence: number } | null => {
  let bestMatch: { key: string; confidence: number } | null = null;
  
  const normalizedSource = normalize(sourceColumn);
  
  for (let i = 0; i < targetKeys.length; i++) {
    const key = targetKeys[i];
    const label = targetLabels[i];
    
    // Check exact matches
    if (normalize(key) === normalizedSource || normalize(label) === normalizedSource) {
      return { key, confidence: 1 };
    }
    
    // Check synonyms
    const keySynonyms = synonyms[key] || [];
    if (keySynonyms.some(syn => normalize(syn) === normalizedSource)) {
      return { key, confidence: 0.95 };
    }
    
    // Calculate similarity
    const keySim = similarity(sourceColumn, key);
    const labelSim = similarity(sourceColumn, label);
    const maxSim = Math.max(keySim, labelSim);
    
    if (maxSim > 0.6 && (!bestMatch || maxSim > bestMatch.confidence)) {
      bestMatch = { key, confidence: maxSim };
    }
  }
  
  return bestMatch;
};

// Generate mappings from source columns to target schema
export const generateMappings = (
  sourceColumns: string[],
  targetColumns: { key: string; label: string; required: boolean }[]
): MappingResult => {
  const mappings: ColumnMapping[] = [];
  const usedTargets = new Set<string>();
  const unmappedSource: string[] = [];
  const missingRequired: string[] = [];
  
  const targetKeys = targetColumns.map(c => c.key);
  const targetLabels = targetColumns.map(c => c.label);
  
  // First pass: find matches for source columns
  for (const sourceCol of sourceColumns) {
    const match = findBestMatch(sourceCol, targetKeys, targetLabels);
    
    if (match && match.confidence >= 0.6 && !usedTargets.has(match.key)) {
      mappings.push({
        sourceColumn: sourceCol,
        targetKey: match.key,
        confidence: match.confidence,
        status: 'matched'
      });
      usedTargets.add(match.key);
    } else {
      unmappedSource.push(sourceCol);
    }
  }
  
  // Second pass: identify missing required columns
  for (const col of targetColumns) {
    if (col.required && !usedTargets.has(col.key)) {
      missingRequired.push(col.key);
    }
  }
  
  // Determine if user review is needed - require review for ANY non-perfect match
  const needsUserReview = 
    unmappedSource.length > 0 || 
    missingRequired.length > 0 ||
    mappings.some(m => m.confidence < 0.98);
  
  return { mappings, unmappedSource, missingRequired, needsUserReview };
};

// Apply mappings to transform data
export const applyMappings = (
  data: Record<string, any>[],
  mappings: ColumnMapping[]
): Record<string, any>[] => {
  return data.map(row => {
    const newRow: Record<string, any> = {};
    
    for (const mapping of mappings) {
      if (mapping.status === 'matched' && row[mapping.sourceColumn] !== undefined) {
        newRow[mapping.targetKey] = row[mapping.sourceColumn];
      }
    }
    
    return newRow;
  });
};

// Computed field definitions - fields that can be calculated from others
export interface ComputedField {
  key: string;
  label: string;
  dependencies: string[];
  calculate: (row: Record<string, any>) => number | null;
}

export const computedFields: Record<string, ComputedField[]> = {
  cashflow: [
    {
      key: 'saldo',
      label: 'Saldo (R$)',
      dependencies: ['entradas', 'saidas'],
      calculate: (row) => row.entradas != null && row.saidas != null 
        ? row.entradas - row.saidas : null
    },
    {
      key: 'percentual',
      label: 'Percentual (%)',
      dependencies: ['valor'],
      calculate: () => null // Calculated from total in component
    }
  ],
  hr: [
    {
      key: 'turnover',
      label: 'Turnover (%)',
      dependencies: ['admissoes', 'desligamentos'],
      calculate: (row) => {
        if (row.admissoes == null || row.desligamentos == null) return null;
        const media = (row.admissoes + row.desligamentos) / 2;
        // Assumes 100 employees average, adjust in real scenario
        return media > 0 ? Math.round((media / 100) * 100 * 10) / 10 : 0;
      }
    }
  ],
  financial: [
    {
      key: 'receitaLiquida',
      label: 'Receita Líquida (R$)',
      dependencies: ['receitaBruta', 'impostos'],
      calculate: (row) => row.receitaBruta != null && row.impostos != null
        ? row.receitaBruta - row.impostos : null
    },
    {
      key: 'lucro',
      label: 'Lucro (R$)',
      dependencies: ['receitaLiquida', 'custos', 'despesas'],
      calculate: (row) => {
        const recLiq = row.receitaLiquida ?? (row.receitaBruta - row.impostos);
        if (recLiq == null || row.custos == null || row.despesas == null) return null;
        return recLiq - row.custos - row.despesas;
      }
    }
  ],
  services: [
    {
      key: 'lucro',
      label: 'Lucro (R$)',
      dependencies: ['receita', 'custo'],
      calculate: (row) => row.receita != null && row.custo != null
        ? row.receita - row.custo : null
    },
    {
      key: 'margem',
      label: 'Margem (%)',
      dependencies: ['receita', 'custo'],
      calculate: (row) => {
        if (row.receita == null || row.custo == null || row.receita === 0) return null;
        return Math.round(((row.receita - row.custo) / row.receita) * 100 * 10) / 10;
      }
    }
  ],
  sales: [
    {
      key: 'contatosNecessarios',
      label: 'Contatos/Venda',
      dependencies: ['ligacoes', 'whatsapp', 'oportunidadesConvertidas'],
      calculate: (row) => {
        if (row.ligacoes == null || row.whatsapp == null || !row.oportunidadesConvertidas) return null;
        return Math.round(((row.ligacoes + row.whatsapp) / row.oportunidadesConvertidas) * 10) / 10;
      }
    },
    {
      key: 'atingimento',
      label: 'Atingimento (%)',
      dependencies: ['oportunidadesConvertidas', 'metaVendas'],
      calculate: (row) => {
        if (row.oportunidadesConvertidas == null || !row.metaVendas) return null;
        return Math.round((row.oportunidadesConvertidas / row.metaVendas) * 100 * 10) / 10;
      }
    }
  ],
  marketing: [
    {
      key: 'roi',
      label: 'ROI (%)',
      dependencies: ['investimento', 'receita'],
      calculate: (row) => {
        if (row.investimento == null || row.receita == null || row.investimento === 0) return null;
        return Math.round(((row.receita - row.investimento) / row.investimento) * 100);
      }
    },
    {
      key: 'cpl',
      label: 'CPL (R$)',
      dependencies: ['investimento', 'leads'],
      calculate: (row) => {
        if (row.investimento == null || !row.leads) return null;
        return Math.round(row.investimento / row.leads * 100) / 100;
      }
    }
  ],
  clients: [
    {
      key: 'churnRate',
      label: 'Churn Rate (%)',
      dependencies: ['perdidos', 'ativos'],
      calculate: (row) => {
        if (row.perdidos == null || !row.ativos) return null;
        return Math.round((row.perdidos / row.ativos) * 100 * 100) / 100;
      }
    }
  ],
  overview: [
    {
      key: 'variacao',
      label: 'Variação (%)',
      dependencies: ['valor', 'anterior'],
      calculate: (row) => {
        const atual = parseFloat(row.valor);
        const anterior = parseFloat(row.anterior);
        if (isNaN(atual) || isNaN(anterior) || anterior === 0) return null;
        return Math.round(((atual - anterior) / anterior) * 100 * 10) / 10;
      }
    },
    {
      key: 'crescimentoLiquido',
      label: 'Crescimento Líquido (R$)',
      dependencies: ['novos', 'churn', 'expansao'],
      calculate: (row) => {
        if (row.novos == null || row.churn == null || row.expansao == null) return null;
        return row.novos + row.churn + row.expansao;
      }
    }
  ]
};

// Apply computed fields to data
export const applyComputedFields = (
  data: Record<string, any>[],
  pageId: string
): Record<string, any>[] => {
  const fields = computedFields[pageId] || [];
  if (fields.length === 0) return data;
  
  return data.map(row => {
    const newRow = { ...row };
    
    for (const field of fields) {
      // Only calculate if the field is not already present or is null
      if (newRow[field.key] == null) {
        const calculated = field.calculate(newRow);
        if (calculated !== null) {
          newRow[field.key] = calculated;
        }
      }
    }
    
    return newRow;
  });
};
