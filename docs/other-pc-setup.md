# Other PC Setup

Use this checklist when you want to work on the project from another computer.

## 1. Clone the repository

```powershell
git clone https://github.com/daehoon1027/project-management-mvp.git
cd project-management-mvp
```

## 2. Install Node dependencies

```powershell
npm install
```

## 3. Log in to Vercel

```powershell
vercel login
```

Log in with the same Vercel account used for deployment.

## 4. Pull the development environment

```powershell
vercel env pull .env.local --environment development
```

This is the safest path because it pulls the development database URL instead of the production one.

## 5. Start the app

```powershell
npm run dev
```

## 6. Optional database seed

If the development database is empty, run:

```powershell
node prisma/seed.cjs
```

## 7. Usual Git workflow

```powershell
git checkout -b your-branch-name
git add .
git commit -m "Your change"
git push -u origin your-branch-name
```

## What Not To Do

- Do not commit `.env` or `.env.local`.
- Do not use the production `DATABASE_URL` for local development.
- Do not run destructive Prisma commands against production.

## If You Need Fresh Environment Variables Later

```powershell
vercel env pull .env.local --environment development --yes
```
