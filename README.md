# Alaq - Islamic Learning Application

A free, offline-capable Qur'anic learning application featuring authentic Qur'an recitations, comprehensive hadith collections, and interactive Tajweed lessons.

## About Alaq

Alaq brings Islamic knowledge to everyone through:
- **Qur'an Reader**: Authentic recitations from renowned reciters
- **Hadith Collections**: Sahih Bukhari, Muslim, and other verified sources
- **Tajweed Learning**: Interactive lessons on proper Qur'anic recitation
- **AI Tutor**: Intelligent feedback on recitation and Islamic questions
- **Offline First**: Full functionality without internet connection
- **Multi-Language**: Arabic, Urdu, English, and more

## Quick Start

### Prerequisites
- Node.js 18+ (or use [nvm](https://github.com/nvm-sh/nvm))
- Bun (recommended) or npm

### Development Setup

```bash
# Clone and install
git clone <repository-url>
cd alaq-iqra2
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

## Available Scripts

```bash
npm run dev          # Start dev server with HMR
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode
```

## Project Structure

```
src/
├── components/alaq/     # App-specific components
├── components/ui/       # Radix UI component library
├── routes/              # Page routes
├── integrations/        # Supabase & external services
├── lib/                 # Utility functions
└── styles.css           # Global styles
```

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: TanStack React Start, Node.js
- **Database**: PostgreSQL (Supabase)
- **ORM**: Drizzle
- **Auth**: Supabase Auth + Google OAuth

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and implementation patterns
- **[PRD.md](./PRD.md)** - Product vision, features, and user journeys
- **[TRD.md](./TRD.md)** - Technical specifications and deployment guide
- **[MEMORY.md](./MEMORY.md)** - Session memory and team reference

## Contributing

We welcome contributions! Please ensure:
- Code follows ESLint rules (`npm run lint`)
- Changes are formatted with Prettier (`npm run format`)
- All tests pass (`npm run test`)

## License

Open source and free for educational use.

## Support

For issues or questions, please refer to the documentation or create an issue in the repository.
