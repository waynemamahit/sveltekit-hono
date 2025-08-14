# Development Guide: SvelteKit + Hono + Cloudflare

This guide explains how to develop, preview, and deploy your SvelteKit + Hono application on Cloudflare Workers.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm installed
- Cloudflare account (for deployment)
- Wrangler CLI installed globally: `npm install -g wrangler`

### Development Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Copy environment configuration:**

   ```bash
   cp .env.example .env.local
   ```

3. **Start development server:**

   ```bash
   # Standard SvelteKit development (recommended for frontend dev)
   pnpm dev

   # Or with Cloudflare Workers simulation
   pnpm cf:dev
   ```

## 🔧 Development Workflows

### Local Development Options

1. **Standard SvelteKit Dev (Recommended for UI/Frontend work):**

   ```bash
   pnpm dev
   ```

   - Runs on `http://localhost:5173`
   - Fastest hot reload
   - Full TypeScript checking
   - API routes work through SvelteKit

2. **Cloudflare Workers Simulation (For testing CF-specific features):**

   ```bash
   pnpm cf:dev
   ```

   - Builds the app first
   - Runs with Wrangler dev server
   - Simulates Cloudflare Workers environment
   - Runs on `http://localhost:8787`

### API Development

The Hono API is located in `src/routes/api/[...paths]/+server.ts` and includes:

- **GET /api/health** - Health check endpoint
- **GET /api/hello** - Basic hello endpoint
- **GET /api/users** - List users (mock data)
- **POST /api/users** - Create user (mock)
- **PUT /api/users/:id** - Update user (mock)
- **DELETE /api/users/:id** - Delete user (mock)

### Environment Variables

1. **Client-side variables** (prefix with `PUBLIC_`):
   - Accessible in browser
   - Configure in `src/lib/env.ts`

2. **Server-side variables**:
   - Cloudflare Workers environment
   - Configure in `wrangler.toml`

## 📦 Building and Deployment

### Local Preview

1. **Build the application:**

   ```bash
   pnpm build
   ```

2. **Preview locally:**

   ```bash
   # SvelteKit preview
   pnpm preview

   # Or Cloudflare Workers preview
   pnpm preview:wrangler
   ```

### Cloudflare Deployment

1. **Login to Cloudflare:**

   ```bash
   wrangler login
   ```

2. **Deploy to development:**

   ```bash
   pnpm deploy
   ```

3. **Deploy to production:**
   ```bash
   pnpm deploy:production
   ```

### Deployment Configuration

The app is configured for **Cloudflare Pages** deployment with:

- Static assets served from Cloudflare's edge
- API routes handled by Cloudflare Workers
- Automatic HTTPS and global CDN

## 🏗️ Project Structure

```
src/
├── routes/
│   ├── +page.svelte          # Main page with API demos
│   ├── +page.ts              # Page configuration
│   ├── +layout.svelte        # Layout component
│   └── api/
│       └── [...paths]/
│           └── +server.ts     # Hono API server
├── lib/
│   └── env.ts                # Environment configuration
├── app.html                  # HTML template
└── app.css                   # Global styles

Configuration:
├── svelte.config.js          # SvelteKit configuration
├── wrangler.toml            # Cloudflare Workers config
├── vite.config.ts           # Vite configuration
├── package.json             # Dependencies and scripts
└── .env.example             # Environment variables template
```

## 🛠️ Available Scripts

| Command                  | Description                              |
| ------------------------ | ---------------------------------------- |
| `pnpm dev`               | Start SvelteKit dev server               |
| `pnpm dev:wrangler`      | Start Wrangler dev server                |
| `pnpm build`             | Build for production                     |
| `pnpm preview`           | Preview built app locally                |
| `pnpm preview:wrangler`  | Preview with Wrangler                    |
| `pnpm deploy`            | Deploy to Cloudflare                     |
| `pnpm deploy:production` | Deploy to production environment         |
| `pnpm cf:dev`            | Build and run with Cloudflare simulation |
| `pnpm cf:build`          | Test build for Cloudflare (dry run)      |

## 🔍 Debugging

### Common Issues

1. **API routes not working in production:**
   - Check `wrangler.toml` configuration
   - Ensure all HTTP methods are exported in `+server.ts`

2. **Environment variables not accessible:**
   - Client-side vars must be prefixed with `PUBLIC_`
   - Server-side vars must be in `wrangler.toml`

3. **Build errors:**
   - Check TypeScript types
   - Ensure all imports are correct
   - Run `pnpm check` for type checking

### Development Tips

1. **Use standard SvelteKit dev** for most development
2. **Test with Wrangler** before deploying
3. **Check Cloudflare Workers docs** for platform-specific features
4. **Monitor Cloudflare Dashboard** for deployment status and logs

## 📚 Resources

- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Hono Documentation](https://hono.dev/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
