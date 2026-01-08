# WhatsApp SaaS Platform

A complete WhatsApp Business API SaaS platform for businesses to manage their WhatsApp communications, with built-in billing, analytics, and team management.

## Features

- **Multi-tenant Architecture** - Support multiple businesses with isolated data
- **WhatsApp Business API Integration** - Send/receive messages, templates, media
- **Team Inbox** - Shared inbox for team collaboration
- **Contact Management** - Organize and segment contacts
- **Analytics Dashboard** - Message insights, response times, team performance
- **Billing & Subscriptions** - Razorpay integration for payments
- **AI-Powered Responses** - Canned responses with AI suggestions
- **Developer API** - REST API with API keys and webhooks

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js
- **Styling:** Tailwind CSS
- **Payments:** Razorpay
- **WhatsApp:** Meta Cloud API

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- WhatsApp Business API access (Meta Developer Account)
- Razorpay account (for payments)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/whatsapp-saas.git
cd whatsapp-saas
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the app.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables
4. Deploy!

The project includes a `vercel.json` with optimal settings.

### Environment Variables

See `.env.example` for all required environment variables.

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Auth secret (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Your app URL

**WhatsApp:**
- `WHATSAPP_API_VERSION` - Meta API version (e.g., "v18.0")
- `META_APP_SECRET` - Your Meta App secret

**Payments:**
- `RAZORPAY_KEY_ID` - Razorpay API key
- `RAZORPAY_KEY_SECRET` - Razorpay secret
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` - Public Razorpay key

## Project Structure

```
.
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── (auth)/       # Authentication pages
│   │   ├── (dashboard)/  # Dashboard pages
│   │   ├── (marketing)/  # Marketing pages
│   │   └── api/          # API routes
│   ├── components/       # React components
│   ├── lib/              # Utilities and services
│   └── hooks/            # React hooks
├── packages/
│   └── whatsapp-core/    # WhatsApp API integration
├── prisma/
│   └── schema.prisma     # Database schema
└── public/               # Static assets
```

## API Documentation

### REST API

The platform provides a REST API for developers:

- `POST /api/v1/messages` - Send messages
- `GET /api/v1/conversations` - List conversations
- `GET /api/v1/contacts` - List contacts
- `POST /api/v1/templates` - Create templates

API keys can be generated in Settings > Developers.

### Webhooks

Configure webhooks to receive real-time events:
- Message received
- Message status updates
- Contact updates

## Pricing Plans

The platform includes three pricing tiers:
- **Starter** - 1,000 messages/month
- **Professional** - 10,000 messages/month
- **Enterprise** - Unlimited messages

## License

MIT License - see LICENSE file for details.

## Support

For support, email support@yourcompany.com or open an issue on GitHub.
