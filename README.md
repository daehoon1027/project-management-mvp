# Project Management MVP

Next.js project management app backed by Prisma and PostgreSQL.

## Live App

- Production: [https://project-management-mvp-tau.vercel.app](https://project-management-mvp-tau.vercel.app)

## Stack

- Next.js 15
- React 19
- Prisma
- PostgreSQL
- Vercel
- Neon

## Local Development

1. Install dependencies.
2. Pull the Vercel development environment.
3. Start the dev server.

```powershell
npm install
vercel env pull .env.local --environment development
npm run dev
```

## Important Safety Rule

- Do not copy the production `DATABASE_URL` into local development.
- Use the Vercel `development` environment so local work stays on the separate dev database.

## Other PC Setup

See [docs/other-pc-setup.md](docs/other-pc-setup.md).
