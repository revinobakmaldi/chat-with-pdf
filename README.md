# Chat with PDF

AI-powered PDF document Q&A tool. Upload a PDF, ask questions in plain English, and get accurate answers with page references — all in the browser.

## How It Works

```
Browser (PDF.js)                   Vercel Serverless (Python)
┌─────────────────────┐           ┌───────────────────────┐
│ PDF → Text extract  │           │ /api/chat             │
│ Page-by-page parse  │──────────>│ Build system prompt   │
│ Display answers     │<──────────│ Call OpenRouter LLM   │
│ Page references     │           │ Return answer + pages │
└─────────────────────┘           └───────────────────────┘
```

- **PDF parsing & text extraction** happen client-side via PDF.js — no files leave the browser
- **LLM calls** go through a Python serverless function that talks to OpenRouter
- The LLM receives the document text with page markers, then returns answers with page references
- Answers display with clickable page citations for easy verification

## Tech Stack

- **Next.js 16** / React 19 / TypeScript
- **Tailwind CSS 4** / Framer Motion
- **PDF.js** — client-side PDF text extraction
- **Python serverless** — OpenRouter API integration
- **Vercel** — deployment

## Getting Started

```bash
git clone https://github.com/revinobakmaldi/chat-with-pdf.git
cd chat-with-pdf
npm install
```

Create a `.env.local` file:

```
OPENROUTER_API_KEY=your_key_here
```

Get a free API key from [openrouter.ai](https://openrouter.ai).

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Import the repo on [vercel.com](https://vercel.com)
2. Add `OPENROUTER_API_KEY` as an environment variable
3. Deploy

## Project Structure

```
app/
  layout.tsx          # Root layout (Geist fonts, dark theme)
  page.tsx            # State machine: upload → loading → ready
api/
  chat.py             # Python serverless → OpenRouter LLM
components/
  shared/             # Animated background, navbar
  upload/             # File dropzone, sample document button
  chat/               # Chat container, messages, input, document sidebar
lib/
  pdf.ts              # PDF.js text extraction
  prompt.ts           # System prompt builder + suggested questions
  api.ts              # Client-side API calls
  types.ts            # TypeScript interfaces
  animations.ts       # Framer Motion variants
  utils.ts            # Utility functions
public/
  sample.pdf          # Demo PDF document
```

## License

MIT
