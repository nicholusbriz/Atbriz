This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Azure Blob uploads

Report attachments upload directly from the browser to a private Azure Blob container. The app server only issues a short-lived, single-blob SAS; never expose an account key or connection string to the browser or commit it to source control.

Set these variables in the ignored `my-app/.env.local` file:

```env
AZURE_STORAGE_ACCOUNT_NAME=atbrizbolb
AZURE_STORAGE_CONTAINER_NAME=your-container-name
AZURE_STORAGE_ACCOUNT_KEY=your-storage-account-key
```

All three variables are required. The account key is used only on the server to verify uploads and sign short-lived SAS URLs; never expose it to browser code, commit it, or put it in a `NEXT_PUBLIC_` variable. Keep it in the ignored `.env.local` file locally and in your hosting provider's protected server-side environment settings in production. This app uses account-key authentication only and has no identity-based fallback.

Configure Blob service CORS to allow the exact origins serving the app (for example `http://localhost:3000` and the production site), with `PUT` and `OPTIONS` methods. Do not make the container public.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
