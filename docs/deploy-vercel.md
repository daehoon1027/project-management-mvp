# Vercel Deployment Guide

## What this gives you

- a stable public deployment URL on `*.vercel.app`
- optional custom domain later
- simple deployment flow for this Next.js app

## Important limitation of the current app

This app still stores data in browser `localStorage`.

That means:

- the URL can be public
- but each browser/device keeps its own separate data
- it is not yet a shared team database system

To make it truly company-ready, the next step is:

- Prisma + SQLite/PostgreSQL
- authentication
- API/server actions

## Fastest deployment path

1. Create a Vercel account
2. Install Vercel CLI
3. Run `vercel`
4. Run `vercel --prod`

## Commands

```bash
npm i -g vercel
vercel
vercel --prod
```

## Stable production URL

After the first production deploy, use:

- your Vercel production domain
- or connect a custom domain in the Vercel dashboard

## Recommended next upgrade

Before using this company-wide, migrate persistence from `localStorage` to Prisma-backed storage.
