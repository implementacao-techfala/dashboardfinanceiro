# Sample Data (CSV)

Estes CSVs são gerados automaticamente a partir do `smartTemplates` para preencher os gráficos com dados reais.

## Como gerar

```bash
npm run gen:sample-data
```

Opções:

- `--scale=3` aumenta o volume de linhas (bom pra “CSV gigante”)
- `--seed=42` fixa o dataset (reprodutível)

## Importante sobre CSV

- Templates com múltiplas abas (ex: `sales`, `financial`, `hr`, etc.) precisam de **um CSV por aba**.
- No modal de upload, ao enviar CSV, selecione a **aba destino** e importe. Repita para as demais abas.

## Arquivos gerados

- `public/sample-data/overview/MRR.csv` (36 linhas)
- `public/sample-data/overview/Produtividade.csv` (36 linhas)
- `public/sample-data/hr/Colaboradores.csv` (100 linhas)
- `public/sample-data/hr/Movimentacoes.csv` (100 linhas)
- `public/sample-data/hr/Pesquisa_Clima.csv` (100 linhas)
- `public/sample-data/financial/Lancamentos.csv` (10.000 linhas)
- `public/sample-data/financial/Contas_Receber.csv` (100 linhas)
- `public/sample-data/financial/Orcado_Realizado.csv` (100 linhas)
- `public/sample-data/sales/Oportunidades.csv` (4.000 linhas)
- `public/sample-data/sales/Atividades_Vendedor.csv` (100 linhas)
- `public/sample-data/sales/Metas.csv` (100 linhas)
- `public/sample-data/marketing/Campanhas.csv` (100 linhas)
- `public/sample-data/marketing/Leads.csv` (6.000 linhas)
- `public/sample-data/clients/Clientes.csv` (3.000 linhas)
- `public/sample-data/clients/Movimentacoes.csv` (150 linhas)
- `public/sample-data/services/Servicos.csv` (100 linhas)
- `public/sample-data/cashflow/Movimentacoes.csv` (12.000 linhas)
- `public/sample-data/cashflow/Saldos_Bancarios.csv` (100 linhas)
