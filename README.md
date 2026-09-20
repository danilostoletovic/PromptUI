## PromptUI (OpenUI AI Workspace)

A lightweight proof-of-concept AI workspace that validates rendering interactive generative UI directly from large language model streams using **OpenUI** (`@openuidev/react-lang` & `@openuidev/react-ui`) and OpenAI.

Instead of outputting static Markdown or brittle JSON payloads, the model streams **OpenUI Lang**—a token-efficient, streaming-first domain-specific language—which the browser dynamically parses and renders into live, interactive React components (such as comparison tables, step-by-step itineraries, KPI dashboards, tabs, and metric callouts).

---

## What the Project Does

Modern generative AI applications typically face a compromise:
- **Plain Markdown / Text**: Fast to stream, but non-interactive and static.
- **Raw JSON**: Difficult to stream incrementally, consumes significantly more tokens, and requires rigid custom UI mapping on the client.

**OpenUI Lang** provides a middle ground:
1. The server equips the LLM with an OpenUI system prompt describing available UI primitives (`Table`, `Tabs`, `Card`, `Callout`, `Steps`, etc.).
2. The model returns concise declarative assignment statements (e.g. `root = Stack([tbl])`).
3. The client progressively parses the token stream and renders interactive components in real time.
4. A built-in detector validates output before passing it to the parser, routing natural-language responses to a formatted message fallback to prevent parser errors.

---

## Features & Capabilities

- **Streaming OpenUI Rendering**: Real-time component generation from OpenAI (`eg: gpt-4o`) via Server-Sent Events (SSE).
- **Interactive UI Primitives**: Renders structured tables, tabs, multi-card summaries, metric badges, and callouts.
- **Response Validation & Graceful Fallback**: An intelligent detection layer (`openuiDetector.ts`) intercepts natural-language or refusal responses (e.g. *"I am unable to..."*) and displays them in a clean message card, preventing `"Code parsed but produced no renderable root component"` errors.
- **Multi-View Modes**:
  - **Interactive UI**: Live interactive React component tree.
  - **OpenUI Lang**: Raw DSL code viewer with syntax metrics.
  - **Dynamic OpenUI Card**: Converts fallback text into an OpenUI Callout component with a single click.
  - **Raw Text**: View plain text responses.
- **Offline Mock Support**: Built-in mock data generator allows full testing of interactive OpenUI streaming without requiring an OpenAI API key or internet access.
- **ChatGPT-Inspired Light Theme**: Clean, minimalist interface with a collapsible session sidebar, quick prompt suggestions, and floating input capsule.

---

## Explicitly Unsupported Capabilities

To keep this proof-of-concept focused on generative UI validation, the following production capabilities are deliberately out of scope:
- **No User Accounts or Authentication**: Intended for local single-user exploration.
- **No Persistent Database or Cloud Storage**: Session history is stored in-memory during the browser session.
- **No Payments or Billing**: No subscription logic, rate limiting, or paywall integration.
- **Desktop/Tablet Focus**: Responsive layout is optimized primarily for desktop and tablet screens; dedicated mobile navigation patterns are not implemented.
- **No Tool/Function Calling or File Uploads**: Does not execute server tools, web scraping, or file attachments.

---

## Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/), Vanilla CSS Design Tokens, [Lucide React](https://lucide.dev/) icons.
- **Generative UI Engine**:
  - `@openuidev/react-lang` — Streaming OpenUI Lang parser and `<Renderer />`.
  - `@openuidev/react-ui` — Component library definitions and system prompt generator.
  - `@openuidev/react-headless` — Headless state primitives.
- **Backend**: [Bun](https://bun.sh/) (`Bun.serve`) providing lightweight local API endpoints (`/api/chat` SSE and `/api/health`).
- **AI Integration**: Official [OpenAI Node SDK](https://github.com/openai/openai-node) streaming `gpt-4o`.

---

## Prerequisites

- [Bun](https://bun.sh/) (v1.1 or later recommended).
- An [OpenAI API Key](https://platform.openai.com/api-keys) (optional if using mock mode).

---

## Installation

1. Clone or download the repository:
   ```bash
   git clone <repository-url>
   cd aiTestApp
   ```

2. Install dependencies using Bun:
   ```bash
   bun install
   ```

---

## Environment Configuration

1. Copy the example environment file to create `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` in your text editor and provide your configuration:
   ```env
   # OpenAI API Configuration
   OPENAI_API_KEY=your_openai_api_key_here

   # Model selection (defaults to gpt-4o)
   OPENAI_MODEL=gpt-4o

   # Bun Server Port (Vite proxies /api to this port)
   PORT=3001
   ```

> [!IMPORTANT]
> The `.env` file contains sensitive credentials and is strictly excluded by `.gitignore`. Never commit `.env` or share your secret API key publicly.

---

## Running the Application

### Option A: Automatic Mock Fallback (Zero Setup / Offline)

The application includes an **automatic mock fallback**. If no `OPENAI_API_KEY` is configured or if the backend server is offline, the client seamlessly falls back to the built-in mock streaming generator:

```bash
bun run dev
```

Open `http://localhost:5173` in your browser. All interactive template suggestions and custom queries will stream and render interactive OpenUI interfaces out of the box.

### Option B: Live OpenAI Streaming

To stream live responses from OpenAI:
1. Copy `.env.example` to `.env`.
2. Set `OPENAI_API_KEY=your_openai_api_key_here`.
3. Run `bun run dev`.

The workspace will detect your configured API key, display **OpenAI Active** in the header, and stream live OpenUI completions directly from `gpt-4o`.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `bun run dev` | Runs both the Bun backend server and Vite client concurrently |
| `bun run server` | Starts only the Bun API server on port 3001 |
| `bun run client` | Starts only the Vite development server on port 5173 |
| `bun run build` | Runs TypeScript type check and compiles the production bundle |
| `bun run lint` | Runs ESLint to check for code quality and syntax issues |
| `bun run preview` | Previews the compiled production bundle locally |

---

## Project Structure

```
├── server/
│   ├── index.ts                # Bun server entry point (/api/chat, /api/health)
│   ├── prompt.ts               # OpenUI system prompt generator & constraints
│   └── providers/              # Extensible provider abstraction (OpenAI)
│       ├── index.ts            # Provider factory
│       ├── openai.ts           # OpenAI SDK streaming implementation
│       └── types.ts            # AIProvider & StreamChatOptions interfaces
├── src/
│   ├── components/
│   │   ├── OpenUIRenderer.tsx  # OpenUI renderer, validation & fallback UI
│   │   ├── PromptInput.tsx     # Floating input capsule & suggestions
│   │   ├── SessionHistory.tsx  # Collapsible sidebar history
│   │   └── WorkspaceHeader.tsx # Header with model info & health status
│   ├── hooks/
│   │   └── useChat.ts          # Chat state machine & SSE streaming hook
│   ├── services/
│   │   ├── api.ts              # API client & mock stream handler
│   │   └── mockData.ts         # Predefined OpenUI responses for offline testing
│   ├── types/
│   │   └── chat.ts             # Message, session, and view mode types
│   ├── utils/
│   │   └── openuiDetector.ts   # OpenUI detection, validation & fallback wrapper
│   ├── App.tsx                 # Main application layout
│   ├── index.css               # ChatGPT light theme design tokens & styles
│   └── main.tsx                # React root entry point
├── .env.example                # Safe environment variable template
├── .gitignore                  # Git ignore rules for secrets, builds & logs
├── package.json                # Scripts and project dependencies
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite config with /api proxy to Bun server
```

---

## Project Status

This repository is an **early-stage experimental proof-of-concept** designed to demonstrate the feasibility of real-time generative UI using OpenUI and LLMs. The APIs and component schemas may evolve as the OpenUI project develops.

---

## Security

- **Server-Side Key Isolation**: The `OPENAI_API_KEY` is loaded strictly inside the Bun backend (`server/index.ts`) and is never passed to or bundled with the client-side JavaScript.
- **Client Bundles**: No `VITE_` prefixed environment variables are used to prevent secrets from being injected into the client bundle at build time.
- **Repository Safety**: Always keep `.env` in `.gitignore` and ensure your private keys are never committed to version control.

---

## License

This project is licensed under the MIT License - see the [LICENSE](file:///c:/Users/danil/Downloads/aiTestApp/LICENSE) file for details.

Copyright (c) 2026 Danilo Stoletovic.

