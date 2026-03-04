# WhatsApp Campaign Manager

A WhatsApp campaign management application for sending bulk messages via Exotel's WhatsApp Business API.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, Database, Edge Functions, Storage)
- **Messaging**: Exotel WhatsApp Business API
- **Hosting**: Azure Static Web Apps
- **CI/CD**: GitHub Actions

## Getting Started

```sh
# Clone the repository
git clone https://github.com/insyncclm75-stack/WA.git
cd WA

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your Supabase project credentials

# Start development server
npm run dev
```

## Environment Variables

See `.env.example` for required frontend variables. Edge function secrets are configured in Supabase dashboard.

## Deployment

Pushes to `main` automatically trigger deployment via GitHub Actions:
- Frontend builds and deploys to Azure Static Web Apps
- Supabase migrations are pushed and edge functions deployed
