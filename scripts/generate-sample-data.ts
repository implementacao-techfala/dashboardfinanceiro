import fs from "node:fs";
import path from "node:path";
import { smartTemplates } from "../src/lib/smartTemplates";

type Args = {
  outDir: string;
  seed: number;
  scale: number;
};

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const outDir = args.find(a => a.startsWith("--out="))?.slice("--out=".length) || "public/sample-data";
  const seedStr = args.find(a => a.startsWith("--seed="))?.slice("--seed=".length) || "42";
  const scaleStr = args.find(a => a.startsWith("--scale="))?.slice("--scale=".length) || "1";
  return { outDir, seed: Number(seedStr) || 42, scale: Math.max(1, Number(scaleStr) || 1) };
}

// RNG determinístico (LCG)
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function monthsBetween(startYm: string, count: number) {
  const [y0, m0] = startYm.split("-").map(Number);
  const out: string[] = [];
  let y = y0;
  let m = m0;
  for (let i = 0; i < count; i++) {
    out.push(`${y}-${pad2(m)}`);
    m++;
    if (m === 13) {
      m = 1;
      y++;
    }
  }
  return out;
}

function csvEscape(v: any) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function writeCsv(filePath: string, rows: Record<string, any>[], headers: string[]) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const lines: string[] = [];
  lines.push(headers.join(","));
  for (const r of rows) {
    lines.push(headers.map(h => csvEscape(r[h])).join(","));
  }
  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
}

function genFromExamples(rng: () => number, examples: Record<string, any>[], headers: string[], count: number) {
  const out: Record<string, any>[] = [];
  for (let i = 0; i < count; i++) {
    const base = { ...pick(rng, examples) };
    // Pequenas variações em números pra não ficar “clone”
    for (const h of headers) {
      const v = base[h];
      if (typeof v === "number") {
        const factor = 0.75 + rng() * 0.6;
        base[h] = Math.round(v * factor);
      }
    }
    out.push(base);
  }
  return out;
}

function generateSheetData(templateId: string, sheetName: string, rng: () => number, scale: number) {
  const t = smartTemplates[templateId];
  const s = t.sheets.find(x => x.name === sheetName)!;
  const headers = s.columns.map(c => c.key);

  // Geradores especiais por aba (pra realmente preencher gráficos)
  if (templateId === "overview" && sheetName === "MRR") {
    const months = monthsBetween("2023-01", 36);
    let mrr = 900_000;
    const rows = months.map((month) => {
      const novos = Math.round(60_000 + rng() * 80_000);
      const expansao = Math.round(20_000 + rng() * 50_000);
      const churn = Math.round(15_000 + rng() * 40_000);
      mrr = Math.max(0, mrr + novos + expansao - churn);
      return { month, mrr, novos, expansao, churn };
    });
    return { headers, rows };
  }
  if (templateId === "overview" && sheetName === "Produtividade") {
    const months = monthsBetween("2023-01", 36);
    let receita = 900_000;
    let colaboradores = 85;
    const rows = months.map((month) => {
      receita = Math.max(0, Math.round(receita * (0.98 + rng() * 0.08)));
      colaboradores = Math.max(10, Math.round(colaboradores + (rng() * 4 - 1)));
      return { month, receita, colaboradores };
    });
    return { headers, rows };
  }

  if (templateId === "sales" && sheetName === "Oportunidades") {
    const vendedores = ["Ana Silva", "Carlos Souza", "Mariana Lima", "João Oliveira", "Pedro Costa", "Bruna Rocha"];
    const servicos = ["Contabilidade", "BPO Financeiro", "BPO RH", "Certificado Digital", "Legalização", "Tributário"];
    const origens = ["Google Ads", "Facebook", "Instagram", "LinkedIn", "Indicação", "Orgânico", "Evento", "Outro"];
    const etapas = ["Prospecção", "Qualificação", "Proposta", "Negociação", "Fechado Ganho", "Fechado Perdido"];
    const rowsCount = 2000 * scale;
    const rows: any[] = [];
    for (let i = 1; i <= rowsCount; i++) {
      const dataCriacao = `2024-${pad2(1 + Math.floor(rng() * 12))}-${pad2(1 + Math.floor(rng() * 28))}`;
      const etapa = pick(rng, etapas);
      const ganhoOuPerda = etapa.startsWith("Fechado");
      const dataFechamento = ganhoOuPerda ? `2024-${pad2(1 + Math.floor(rng() * 12))}-${pad2(1 + Math.floor(rng() * 28))}` : "2026-12-31";
      rows.push({
        id: `OP-${String(i).padStart(5, "0")}`,
        data_criacao: dataCriacao,
        cliente: `Lead ${String(i).padStart(5, "0")}`,
        vendedor: pick(rng, vendedores),
        servico: pick(rng, servicos),
        etapa,
        valor: Math.round(800 + rng() * 40_000),
        origem: pick(rng, origens),
        data_fechamento: dataFechamento,
        motivo_perda: etapa === "Fechado Perdido" ? pick(rng, ["Preço", "Timing", "Concorrente", "Sem fit", "N/A"]) : "N/A",
      });
    }
    return { headers, rows };
  }

  if (templateId === "marketing" && sheetName === "Leads") {
    const status = ["Novo", "Em contato", "Qualificado", "Desqualificado", "Convertido"];
    const vendedores = ["Ana Silva", "Carlos Souza", "N/A"];
    const origens = ["Google Ads - Contabilidade PME", "LinkedIn - BPO", "Instagram - Conteúdo", "Orgânico - SEO", "Evento - Workshop"];
    const rowsCount = 3000 * scale;
    const rows: any[] = [];
    for (let i = 1; i <= rowsCount; i++) {
      rows.push({
        data_captacao: `2024-${pad2(1 + Math.floor(rng() * 12))}-${pad2(1 + Math.floor(rng() * 28))}`,
        nome: `Lead ${i}`,
        origem: pick(rng, origens),
        status: pick(rng, status),
        vendedor_atribuido: pick(rng, vendedores),
      });
    }
    return { headers, rows };
  }

  if (templateId === "clients" && sheetName === "Clientes") {
    const contas = ["Zov", "Papaya", "Mdias"];
    const regimes = ["Simples Nacional", "Lucro Presumido", "Lucro Real", "MEI", "N/A"];
    const servicos = ["Contabilidade", "BPO Financeiro", "BPO RH", "Certificado Digital", "Legalização"];
    const responsaveis = ["Maria Santos", "João Silva", "Ana Silva", "Carlos Souza"];
    const rowsCount = 1500 * scale;
    const rows: any[] = [];
    for (let i = 1; i <= rowsCount; i++) {
      const principal = pick(rng, servicos);
      rows.push({
        codigo: `CLI-${String(i).padStart(5, "0")}`,
        nome: `Cliente ${i}`,
        cnpj_cpf: `00.${String(10000000 + i).slice(0, 3)}.${String(10000000 + i).slice(3, 6)}/0001-00`,
        conta: pick(rng, contas),
        servico_principal: principal,
        servicos_adicionais: rng() > 0.6 ? pick(rng, servicos.filter(s => s !== principal)).toString() : "N/A",
        regime: pick(rng, regimes),
        mensalidade: Math.round(400 + rng() * 9000),
        faturamento_anual: Math.round(rng() * 8_000_000),
        data_inicio: `202${Math.floor(rng() * 3) + 2}-${pad2(1 + Math.floor(rng() * 12))}-${pad2(1 + Math.floor(rng() * 28))}`,
        responsavel: pick(rng, responsaveis),
        nps: Math.round(rng() * 10),
      });
    }
    return { headers, rows };
  }

  if (templateId === "financial" && sheetName === "Lancamentos") {
    const contas = ["Zov", "Papaya", "Mdias"];
    const categorias = [
      { cat: "Receita de Serviços", subs: ["Contabilidade", "BPO Financeiro", "BPO RH", "Certificado Digital"] },
      { cat: "Pessoal", subs: ["Salários", "Encargos", "Benefícios"] },
      { cat: "Impostos", subs: ["DAS", "IRPJ", "CSLL", "INSS"] },
      { cat: "Operacional", subs: ["SaaS", "Ferramentas", "Infra", "Fornecedor"] },
      { cat: "Marketing", subs: ["Google Ads", "Meta Ads", "Agência", "Eventos"] },
    ];
    const centros = ["Operacional", "RH", "Financeiro", "Comercial", "Marketing"];
    const rowsCount = 5000 * scale;
    const rows: any[] = [];
    for (let i = 1; i <= rowsCount; i++) {
      const isReceita = rng() > 0.55;
      const c = pick(rng, categorias);
      rows.push({
        data: `2024-${pad2(1 + Math.floor(rng() * 12))}-${pad2(1 + Math.floor(rng() * 28))}`,
        conta: pick(rng, contas),
        categoria: isReceita ? "Receita de Serviços" : c.cat,
        subcategoria: isReceita ? pick(rng, categorias[0].subs) : pick(rng, c.subs),
        tipo: isReceita ? "Receita" : "Despesa",
        valor: isReceita ? Math.round(2000 + rng() * 18_000) : Math.round(200 + rng() * 12_000),
        centro_custo: pick(rng, centros),
        descricao: isReceita ? "Mensalidade" : "Lançamento",
      });
    }
    return { headers, rows };
  }

  if (templateId === "cashflow" && sheetName === "Movimentacoes") {
    const contas = ["Zov", "Papaya", "Mdias"];
    const formas = ["PIX", "TED", "Boleto", "Cartão", "Dinheiro"];
    const catIn = ["Recebimento Clientes", "Antecipação", "Outros Recebimentos"];
    const catOut = ["Folha de Pagamento", "Fornecedor", "Marketing", "Impostos", "Operacional"];
    const rowsCount = 6000 * scale;
    const rows: any[] = [];
    for (let i = 1; i <= rowsCount; i++) {
      const tipo = rng() > 0.5 ? "Entrada" : "Saída";
      rows.push({
        data: `2024-${pad2(1 + Math.floor(rng() * 12))}-${pad2(1 + Math.floor(rng() * 28))}`,
        conta: pick(rng, contas),
        tipo,
        categoria: tipo === "Entrada" ? pick(rng, catIn) : pick(rng, catOut),
        valor: tipo === "Entrada" ? Math.round(500 + rng() * 50_000) : Math.round(300 + rng() * 40_000),
        forma_pagamento: pick(rng, formas),
        descricao: tipo === "Entrada" ? "Recebimento" : "Pagamento",
      });
    }
    return { headers, rows };
  }

  // Default: usa exemplos (varia e escala)
  const baseCount = Math.max(50, s.examples.length * 25);
  const rows = genFromExamples(rng, s.examples, headers, baseCount * scale);
  return { headers, rows };
}

function main() {
  const { outDir, seed, scale } = parseArgs();
  const rng = makeRng(seed);

  const summary: { file: string; rows: number }[] = [];

  for (const templateId of Object.keys(smartTemplates)) {
    const t = smartTemplates[templateId];
    for (const sheet of t.sheets) {
      const { headers, rows } = generateSheetData(templateId, sheet.name, rng, scale);
      const filePath = path.join(outDir, templateId, `${sheet.name}.csv`);
      writeCsv(filePath, rows, headers);
      summary.push({ file: filePath.replace(/\\/g, "/"), rows: rows.length });
    }
  }

  const readmePath = path.join(outDir, "README.md");
  const readme = [
    "# Sample Data (CSV)",
    "",
    "Estes CSVs são gerados automaticamente a partir do `smartTemplates` para preencher os gráficos com dados reais.",
    "",
    "## Como gerar",
    "",
    "```bash",
    "npm run gen:sample-data",
    "```",
    "",
    "Opções:",
    "",
    "- `--scale=3` aumenta o volume de linhas (bom pra “CSV gigante”)",
    "- `--seed=42` fixa o dataset (reprodutível)",
    "",
    "## Importante sobre CSV",
    "",
    "- Templates com múltiplas abas (ex: `sales`, `financial`, `hr`, etc.) precisam de **um CSV por aba**.",
    "- No modal de upload, ao enviar CSV, selecione a **aba destino** e importe. Repita para as demais abas.",
    "",
    "## Arquivos gerados",
    "",
    ...summary.map(s => `- \`${s.file}\` (${s.rows.toLocaleString("pt-BR")} linhas)`),
    "",
  ].join("\n");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(readmePath, readme, "utf8");

  console.log(`✅ CSVs gerados em: ${outDir}`);
  console.log(`Dica: rode com --scale=3 para ficar bem grande.`);
}

main();

