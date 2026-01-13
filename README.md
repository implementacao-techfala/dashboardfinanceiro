# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/297d3541-6707-47dc-af97-c1e0d07c046b

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/297d3541-6707-47dc-af97-c1e0d07c046b) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Google Sheets API (opcional)

## Configuração do Google Sheets

Para habilitar a integração com Google Sheets:

1. **Crie um arquivo `.env.local`** na raiz do projeto (copie de `.env.example`)

2. **Obtenha uma API Key do Google:**
   - Acesse [Google Cloud Console](https://console.cloud.google.com/)
   - Crie um projeto ou selecione um existente
   - Ative a API "Google Sheets API"
   - Crie uma credencial do tipo "API Key"
   - Copie a chave e cole em `VITE_GOOGLE_SHEETS_API_KEY`

3. **Configure os Sheet IDs:**
   - Para cada página que você quer conectar ao Google Sheets, obtenha o ID da planilha
   - O ID está na URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
   - Configure as variáveis: `VITE_GOOGLE_SHEETS_{PAGE}_ID`

4. **Permissões da Planilha:**
   - Se usar API Key pública: a planilha precisa ser **pública** (qualquer pessoa com o link pode ver)
   - Se usar Service Account: compartilhe a planilha com o email da service account

5. **Uso no Dashboard:**
   - Quando uma página tem Google Sheets configurado, aparece um toggle "Arquivo" ↔ "Google Sheets"
   - Selecione "Google Sheets" e clique em "Sincronizar" para buscar dados
   - Os dados são atualizados em tempo real do Google Sheets

**Nota:** Para produção com planilhas privadas, recomenda-se usar um proxy backend ao invés de expor a API Key no frontend.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/297d3541-6707-47dc-af97-c1e0d07c046b) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
