# 🚀 SvelteKit + Hono + Cloudflare Workers

A modern, production-ready full-stack template combining **SvelteKit**, **Hono**, and **Cloudflare Workers** with enterprise-grade architecture patterns including dependency injection, comprehensive testing, and global error handling.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Svelte](https://img.shields.io/badge/Svelte-4A4A55?style=for-the-badge&logo=svelte&logoColor=FF3E00)](https://svelte.dev/)
[![Hono](https://img.shields.io/badge/Hono-FF6900?style=for-the-badge&logo=hono&logoColor=white)](https://hono.dev/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=Cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)

## ✨ Key Features

### 🏗️ **Enterprise Architecture**

- **Dependency Injection** with InversifyJS for clean, testable code
- **SOLID Principles** implementation with proper separation of concerns
- **Custom Error Classes** with global exception handling
- **Type-Safe APIs** with comprehensive TypeScript support
- **Zod v4 Validation** with schemas colocated in models and inferred DTO types

### 🚀 **Modern Stack**

- **SvelteKit 2** for lightning-fast frontend with Svelte 5
- **Hono** for high-performance API routes
- **Cloudflare Workers** for global edge deployment
- **TailwindCSS 4** for modern, responsive UI

### 🧪 **Developer Experience**

- **Comprehensive Testing** with Vitest (API + Component tests)
- **Hot Reload** development with TypeScript, ESLint, Prettier
- **Health Checks** and structured logging
- **Environment Management** for all deployment stages

## 🏗️ Tech Stack

- **Frontend**: [SvelteKit](https://kit.svelte.dev/) + [Svelte 5](https://svelte.dev/)
- **Backend**: [Hono](https://hono.dev/) API framework
- **Dependency Injection**: [InversifyJS](https://inversify.io/) IoC container
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **Testing**: [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)
- **Platform**: [Cloudflare Workers](https://workers.cloudflare.com/) + [Pages](https://pages.cloudflare.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Package Manager**: [pnpm](https://pnpm.io/)

## 🏗️ Dependency Injection Architecture

This project implements a clean architecture using **InversifyJS** for dependency injection, following SOLID principles for maintainable and testable code.

### Core Architecture Components

- **Services** - Business logic layer with clear responsibilities
- **Repositories** - Data access layer abstraction
- **Interfaces** - Contract definitions for loose coupling
- **Container** - IoC container for dependency resolution

### Key Benefits

- ✅ **Testability** - Easy mocking and unit testing
- ✅ **Maintainability** - Loose coupling between components
- ✅ **Extensibility** - Easy to add new implementations
- ✅ **SOLID Principles** - Clean code architecture

### Service Layer Overview

| Service          | Purpose                               | Scope     |
| ---------------- | ------------------------------------- | --------- |
| `UserService`    | User business logic and orchestration | Transient |
| `UserRepository` | Data access and persistence           | Singleton |
| `Logger`         | Structured logging with context       | Singleton |
| `ConfigService`  | Environment and app configuration     | Singleton |

### Usage Example

```typescript
// In your API routes
import { getUserService, getLogger } from '../container/resolvers';

app.get('/users', async (c) => {
	const userService = getUserService(c);
	const logger = getLogger(c);

	logger.info('Fetching users');
	const users = await userService.getAllUsers();

	return c.json({ success: true, data: users });
});
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Cloudflare account (for deployment)

### Get Started in 2 Minutes

```bash
# Clone and install
git clone <your-repo-url>
cd sveltekit-hono
pnpm install

# Start development
pnpm dev
```

**That's it!** Visit [http://localhost:5173](http://localhost:5173)

### For Cloudflare Development

```bash
# Install Wrangler CLI (one-time setup)
npm install -g wrangler

# Run with Cloudflare Workers simulation
pnpm dev:cf
```

## 🛠️ Development Commands

### Core Development

```bash
pnpm dev           # SvelteKit dev server (recommended)
pnpm dev:cf        # Cloudflare Workers simulation
pnpm build         # Production build
pnpm preview       # Preview built app
```

### Quality & Testing

```bash
pnpm test          # Tests in watch mode
pnpm test:run      # Run all tests once
pnpm test:ui       # Interactive test UI
pnpm test:coverage # Coverage reports
pnpm check         # TypeScript validation
pnpm lint          # Code linting
pnpm format        # Code formatting
```

### Deployment

```bash
pnpm deploy        # Deploy to dev
pnpm deploy:cf     # Deploy to production
```

## 🌐 API Endpoints

Built with **Hono** and comprehensive error handling:

### Core Endpoints

| Method | Endpoint      | Description                  |
| ------ | ------------- | ---------------------------- |
| `GET`  | `/api/health` | System health check          |
| `GET`  | `/api/hello`  | API info and request details |

### User Management (Demo CRUD)

| Method   | Endpoint         | Description     | Status Codes       |
| -------- | ---------------- | --------------- | ------------------ |
| `GET`    | `/api/users`     | List all users  | 200, 500           |
| `GET`    | `/api/users/:id` | Get user by ID  | 200, 400, 404, 500 |
| `POST`   | `/api/users`     | Create new user | 201, 400, 409, 500 |
| `PUT`    | `/api/users/:id` | Update user     | 200, 400, 404, 500 |
| `DELETE` | `/api/users/:id` | Delete user     | 200, 400, 404, 500 |

### Response Format

Consistent JSON responses across all endpoints:

```typescript
// Success
{ "success": true, "data": any, "message?": string, "timestamp": string }

// Error
{ "success": false, "error": string, "timestamp": string }
```

### Quick API Test

```bash
# Health check
curl http://localhost:5173/api/health

# List users (demo data)
curl http://localhost:5173/api/users

# Create user
curl -X POST http://localhost:5173/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'
```

### Error Handling

**Custom Error Classes** with proper HTTP status codes:

- `ValidationError` (400) - Invalid input data
- `NotFoundError` (404) - Resource not found
- `ConflictError` (409) - Duplicate resources
- Plus: `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `InternalServerError`

**Global Error Handler** catches all exceptions and returns consistent JSON responses with structured logging.

## 🧪 Testing

Comprehensive test suite with **Vitest** + **Testing Library**:

```bash
# Run tests
pnpm test:run          # All tests once
pnpm test             # Watch mode
pnpm test:ui          # Interactive UI
pnpm test:coverage    # With coverage
```

### What's Tested

- **API Endpoints** - Request/response validation, error handling
- **Svelte Components** - User interactions, form validation
- **Services** - Business logic with dependency injection
- **Error Scenarios** - Custom error classes and status codes

## ✅ Validation with Zod v4

Input validation is implemented with Zod v4. Schemas live in `src/models/user.model.ts` and types are inferred directly from the schemas for end-to-end type safety.

```ts
// src/models/user.model.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().trim().min(1, { message: 'Name is required' }).refine(v => v.length === 0 || v.length >= 2, { message: 'Name must be at least 2 characters long' }),
  email: z.string().trim().min(1, { message: 'Email is required' }).refine(v => v.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), { message: 'Email format is invalid' })
});

export type CreateUserRequest = z.infer<typeof createUserSchema>;
```

Services validate using `safeParse` and throw a `ValidationError` on failure:

```ts
// src/services/user.service.ts
const parsed = createUserSchema.safeParse(userData);
if (!parsed.success) {
  const messages = parsed.error.issues.map(i => i.message);
  throw new ValidationError(`Validation failed: ${messages.join(', ')}`);
}
```

## 📝 Project Structure

```
src/
├── routes/                        # SvelteKit routes
│   ├── +page.svelte               # Demo page
│   └── api/[...paths]/+server.ts  # Hono API server
├── container/                     # Dependency Injection
│   ├── inversify.config.ts        # IoC container
│   ├── types.ts                   # Service types
│   └── resolvers.ts               # Service resolvers
├── models/                        # Domain models and schemas (Zod)
│   ├── user.model.ts              # User model + Zod schemas
│   └── error.model.ts             # Custom error classes and mapping
├── interfaces/                    # TypeScript interfaces
├── services/                      # Business logic layer
├── types/                         # Type definitions
└── tests/                         # Test suites
    ├── api/                       # API tests
    └── components/                # Component tests
```

**Key Files:**

- `wrangler.toml` - Cloudflare Workers configuration
- `svelte.config.js` - SvelteKit + adapter setup
- `vite.config.ts` - Vite + testing configuration

## 🚀 Deployment

### To Cloudflare Workers

```bash
# One-time setup
wrangler login

# Deploy to development
pnpm deploy

# Deploy to production
pnpm deploy:cf
```

### Environment Variables

- **Local**: `.env.local` (SvelteKit)
- **Production**: `wrangler.toml` (Cloudflare Workers)

## 🔧 Architecture Highlights

### Dependency Injection

Using **InversifyJS** for clean architecture:

- Service interfaces for contracts
- Concrete implementations
- IoC container for dependency resolution
- Easy testing with mocked dependencies

### Cloudflare Optimization

- **Edge deployment** for ultra-low latency
- **Automatic HTTPS** and SSL
- **CDN-cached** static assets
- **Serverless** API routes

## 🤝 Contributing

1. **Fork & Clone** the repository
2. **Install**: `pnpm install`
3. **Create branch**: `git checkout -b feature/your-feature`
4. **Make changes** and add tests
5. **Quality check**: `pnpm test:run && pnpm lint && pnpm check`
6. **Commit & Push** your changes
7. **Open Pull Request**

Ensure all tests pass and follow the existing code patterns.

## 📚 Documentation & Resources

### Project Docs

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Comprehensive development guide

### Tech Stack Docs

- [SvelteKit](https://kit.svelte.dev/) - Frontend framework
- [Hono](https://hono.dev/) - API framework
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) - Deployment platform
- [InversifyJS](https://inversify.io/) - Dependency injection
- [Vitest](https://vitest.dev/) - Testing framework

## 🐛 Troubleshooting

**API routes not working?**

- Check `wrangler.toml` configuration
- Ensure all HTTP methods are exported in `+server.ts`

**Environment variables?**

- Client vars: prefix with `PUBLIC_`
- Server vars: add to `wrangler.toml`

**Build errors?**

- Run `pnpm check` for TypeScript validation
- Verify imports and dependencies

**Test failures?**

- Use `pnpm test:ui` for interactive debugging
- Check mock configurations in test setup

➡️ **See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed troubleshooting**

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

## ⭐ Support

Give a ⭐ if this helped you!

**Built with ❤️ using SvelteKit + Hono + Cloudflare Workers**
