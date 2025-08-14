# 🚀 SvelteKit + Hono + Cloudflare Workers

A modern, full-stack web application template combining the power of **SvelteKit** frontend with **Hono** API backend, optimized for deployment on **Cloudflare Workers**.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Svelte](https://img.shields.io/badge/Svelte-4A4A55?style=for-the-badge&logo=svelte&logoColor=FF3E00)](https://svelte.dev/)
[![Hono](https://img.shields.io/badge/Hono-FF6900?style=for-the-badge&logo=hono&logoColor=white)](https://hono.dev/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=Cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## ✨ Features

- 🔥 **Lightning Fast** - SvelteKit for optimal performance and developer experience
- 🌐 **Global Edge Deployment** - Cloudflare Workers for worldwide low-latency
- 🛠️ **Type-Safe API** - Hono with full TypeScript support and validation
- 🎨 **Modern UI** - TailwindCSS for beautiful, responsive design
- 🔧 **Developer Experience** - Hot reload, TypeScript, ESLint, Prettier
- 🚀 **Production Ready** - Optimized builds and edge-side caching
- 🔒 **Environment Management** - Secure variable handling for all environments
- 📊 **Built-in Monitoring** - Health checks and request logging

## 🏗️ Tech Stack

- **Frontend**: [SvelteKit](https://kit.svelte.dev/) + [Svelte 5](https://svelte.dev/)
- **Backend**: [Hono](https://hono.dev/) API framework
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **Platform**: [Cloudflare Workers](https://workers.cloudflare.com/) + [Pages](https://pages.cloudflare.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Package Manager**: [pnpm](https://pnpm.io/)

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and **pnpm** installed
- **Cloudflare account** (for deployment)
- **Wrangler CLI**: `npm install -g wrangler`

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd sveltekit-hono
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

4. **Start development server**

   ```bash
   pnpm dev
   ```

5. **Open your browser**
   Visit [http://localhost:5173](http://localhost:5173)

## 🛠️ Development

### Available Scripts

| Command           | Description                                 |
| ----------------- | ------------------------------------------- |
| `pnpm dev`        | Start SvelteKit development server          |
| `pnpm dev:cf`     | Start Cloudflare Workers development server |
| `pnpm build`      | Build for production                        |
| `pnpm preview`    | Preview production build locally            |
| `pnpm preview:cf` | Preview with Cloudflare Workers simulation  |
| `pnpm deploy`     | Deploy to Cloudflare Workers                |
| `pnpm deploy:cf`  | Deploy to Cloudflare production environment |
| `pnpm check`      | Run TypeScript and Svelte checks            |
| `pnpm lint`       | Lint code with ESLint and Prettier          |
| `pnpm format`     | Format code with Prettier                   |

### Development Workflows

**For Frontend Development:**

```bash
pnpm dev  # Fastest hot reload, recommended for UI work
```

**For Full-Stack with Cloudflare Simulation:**

```bash
pnpm dev:cf  # Test with Cloudflare Workers environment
```

## 🌐 API Endpoints

The Hono API provides the following endpoints:

| Method   | Endpoint         | Description                            |
| -------- | ---------------- | -------------------------------------- |
| `GET`    | `/api/health`    | Health check and environment info      |
| `GET`    | `/api/hello`     | Basic hello endpoint with request info |
| `GET`    | `/api/users`     | Get all users (demo data)              |
| `POST`   | `/api/users`     | Create a new user                      |
| `PUT`    | `/api/users/:id` | Update user by ID                      |
| `DELETE` | `/api/users/:id` | Delete user by ID                      |

### Example API Usage

```typescript
// Fetch users
const response = await fetch('/api/users');
const { users } = await response.json();

// Create user
const newUser = await fetch('/api/users', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({ name: 'John Doe', email: 'john@example.com' })
});
```

## 📁 Project Structure

```
├── src/
│   ├── routes/
│   │   ├── +page.svelte          # Main demo page
│   │   ├── +layout.svelte        # App layout
│   │   └── api/
│   │       └── [...paths]/
│   │           └── +server.ts     # Hono API server
│   ├── lib/
│   │   └── env.ts                # Environment configuration
│   ├── models/
│   │   └── user.model.ts         # TypeScript models
│   ├── types/
│   │   └── health.ts             # Type definitions
│   ├── app.html                  # HTML template
│   └── app.css                   # Global styles
├── static/                       # Static assets
├── wrangler.toml                 # Cloudflare Workers config
├── svelte.config.js              # SvelteKit configuration
├── vite.config.ts                # Vite configuration
└── DEVELOPMENT.md                # Detailed development guide
```

## 🚀 Deployment

### Cloudflare Workers Deployment

1. **Login to Cloudflare**

   ```bash
   wrangler login
   ```

2. **Deploy to development**

   ```bash
   pnpm deploy
   ```

3. **Deploy to production**
   ```bash
   pnpm deploy:cf
   ```

### Environment Variables

Configure your environment variables in:

- **Local development**: `.env.local`
- **Cloudflare Workers**: `wrangler.toml`

```toml
# wrangler.toml
[vars]
ENVIRONMENT = "development"

[env.production.vars]
ENVIRONMENT = "production"
```

## 🔧 Configuration

### Environment Variables

```bash
# .env.local
ENVIRONMENT=development
API_BASE_URL=http://localhost:5173/api
CF_PAGES_URL=https://localhost:8787
```

### Cloudflare Workers

The application is optimized for Cloudflare Workers with:

- **Global Edge Deployment** - Ultra-low latency worldwide
- **Automatic HTTPS** - SSL certificates handled automatically
- **Static Asset Optimization** - CDN-cached static files
- **Serverless Functions** - API routes as Cloudflare Workers

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Documentation

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Comprehensive development guide
- **[SvelteKit Docs](https://kit.svelte.dev/)** - SvelteKit documentation
- **[Hono Docs](https://hono.dev/)** - Hono API framework docs
- **[Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)** - Deployment platform docs

## 🐛 Troubleshooting

### Common Issues

**API routes not working in production?**

- Check `wrangler.toml` configuration
- Ensure all HTTP methods are exported in `+server.ts`

**Environment variables not accessible?**

- Client-side vars must be prefixed with `PUBLIC_`
- Server-side vars must be configured in `wrangler.toml`

**Build errors?**

- Run `pnpm check` for TypeScript validation
- Check all imports and dependencies

For more troubleshooting tips, see [DEVELOPMENT.md](./DEVELOPMENT.md).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⭐ Show your support

Give a ⭐️ if this project helped you!

---

**Built with ❤️ using SvelteKit, Hono, and Cloudflare Workers**
