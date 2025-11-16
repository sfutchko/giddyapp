# GiddyApp Tech Stack - Production Grade

## Core Principles
- Clean, professional code - no shortcuts
- Latest stable versions only
- Type safety everywhere (TypeScript)
- Edge computing for performance
- Real-time capabilities built-in
- Mobile-first responsive design

## Technology Choices

### Frontend
- **Next.js 14** with App Router (server components for SEO)
- **React Native** with Expo for mobile apps
- **TypeScript** - strict mode, no any types
- **Tailwind CSS** with custom design system
- **Radix UI** for accessible components
- **Tanstack Query** for data fetching
- **Zustand** for client state
- **React Hook Form** with Zod validation

### Backend
- **Node.js 20 LTS** with TypeScript
- **Fastify** (faster than Express)
- **Prisma** ORM with migrations
- **PostgreSQL 16** with pgvector for AI search
- **Redis** for caching and sessions
- **BullMQ** for job queues
- **Socket.io** for real-time features

### Infrastructure
- **Vercel** for Next.js hosting (edge functions)
- **Supabase** for database and auth
- **Cloudflare R2** for media storage (cheaper than S3)
- **Resend** for transactional emails
- **Stripe** for payments
- **Sentry** for error tracking

### AI/ML
- **OpenAI GPT-4** for listing descriptions
- **Replicate** for image analysis
- **pgvector** for semantic search
- **TensorFlow.js** for fraud detection

### DevOps
- **Turborepo** for monorepo management
- **pnpm** for package management
- **GitHub Actions** for CI/CD
- **Docker** for containerization
- **Terraform** for infrastructure as code

## Architecture Decisions

### Why This Stack?

1. **Next.js 14 App Router**
   - Server components = better SEO
   - Streaming = faster perceived performance
   - Built-in optimization
   - Edge runtime support

2. **Supabase over Firebase**
   - Open source (no vendor lock-in)
   - PostgreSQL = better for complex queries
   - Built-in auth with MFA
   - Real-time subscriptions
   - Row-level security

3. **Fastify over Express**
   - 2x faster benchmarks
   - Built-in schema validation
   - Better TypeScript support
   - Async/await by default

4. **Cloudflare R2 over AWS S3**
   - No egress fees (huge for media)
   - Automatic CDN
   - S3-compatible API
   - 10x cheaper at scale

5. **Turborepo Monorepo**
   - Share code between web and mobile
   - Unified TypeScript configs
   - Parallel builds
   - Smart caching