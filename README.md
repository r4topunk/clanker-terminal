# 🤖 Clanker Terminal

> Your command center for tracking Clanker bot's latest token alerts on Farcaster.

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS
- shadcn/ui
- Discord SDK
- Neynar SDK
- Webhooks

## What is this?

Clanker Terminal is a real-time dashboard that plugs into the Clanker bot's neural network. It monitors and displays token alerts broadcasted through Farcaster casts, giving you the edge in the web3 social landscape.

## Features

- 🚀 Real-time token cast monitoring
- 💬 Discord integration
- ⚡ Webhook endpoint for instant notifications
- 🎯 Clean, minimal UI built with shadcn
- 🔥 Optimized performance with Next.js 14

## Getting Started

```bash
# Clone the repo
git clone https://github.com/r4topunk/clanker-terminal

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run the development server
pnpm dev
```

## Configuration

Create a `.env.local` file with:

```env
DISCORD_TOKEN=your_discord_token
NEYNAR_API_KEY=your_neynar_key
WEBHOOK_SECRET=your_webhook_secret
```

## License

MIT

## Contributing

PRs and issues welcome. WAGMI 🫡
