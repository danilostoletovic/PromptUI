# PromptUI

PromptUI is a local AI workspace that turns prompts into streamed, interactive interfaces using OpenUI and OpenAI. Use it for writing, coding explanations, study material, comparisons, plans, or analysis of pasted data. The model chooses a layout for the task: text, tables, tabs, steps, charts, or forms.

This is an experimental, single-user application. Custom AI responses require a running backend and an OpenAI API key. A limited offline demo is available without a key.

## Features

- **Task-specific generation:** instructions preserve the user's constraints and conversation context rather than forcing every request into a dashboard template. Eight starter prompts cover different tasks.
- **Streaming interfaces:** OpenUI Lang renders progressively through React. Switch between the rendered interface and its source, or copy the response.
- **Follow-up interactions:** supported conversation buttons and form submissions send answers back to the model. Reopening a history entry restores its conversation context.
- **Delete and undo:** delete individual entries with the trash button in Recent Chats. Undo restores the most recently deleted entry. Deleting the active entry also clears the current workspace.
- **Settings:** enter a session API key, select a model, remove the session key, and read project credits and the full MIT license.
- **Mobile and desktop layouts:** mobile navigation uses a collapsible drawer with backdrop and Escape dismissal. Settings, touch targets, response controls, and scrollable results adapt to smaller screens.
- **Rendering recovery:** natural-language responses have a text fallback. Parser errors expose a **Repair interface** action that requests a corrected response from the model.
- **Stream handling:** cancellation reaches the provider. Interrupted or failed live responses show an error and retain partial output instead of silently appending demo content.

## Quick start

Install Bun 1.4.2 or later, then run these commands from the downloaded or cloned `PromptUI` directory:

```bash
bun install
bun run dev
```

Open [PromptUI locally](http://localhost:5173). The development command starts the Bun backend on port 3001 and Vite on port 5173. Bun must be available on your shell's `PATH`.

### Connect through Settings

1. Open **Settings** using the gear icon in the header or the sidebar button.
2. Paste your OpenAI API key.
3. Enter a Chat Completions compatible model available to your project; the default is `gpt-4o`.
4. Select **Connect & use key**.
5. Close Settings and send a prompt.

The backend checks whether the key can access the selected model without generating a completion. Successful verification does not guarantee available quota or compatibility with every generation request. Connection failures appear in Settings; generation failures appear beside the response.

The session key overrides a server-configured key. **Remove session key** returns to the server key, or offline mode when no server key exists. Stop any active response before changing the connection.

Keys entered in Settings live only in the current tab's JavaScript memory. They are sent in an Authorization header to the backend, which uses them to call OpenAI. They are not saved in localStorage, chat history, or files, and reloading the page clears them.

API usage is billed to your OpenAI account. PromptUI does not sell credits or display an account balance. The **Credits** section acknowledges the creator and technologies used.

### Configure a server key instead

Copy `.env.example` to `.env` and replace the placeholder key:

```env
OPENAI_API_KEY=your_actual_api_key
OPENAI_MODEL=gpt-4o
PORT=3001
```

Restart the backend after changing `.env`. The workspace shows **OpenAI Active** when a key is configured; this health indicator alone does not validate the key. Click the connection indicator to recheck the backend after configuration changes.

The Vite API proxy targets port 3001 in `vite.config.ts`. If you change `PORT`, update that proxy target too.

Keep `.env` private and excluded from Git. For offline mode, omit `.env` or leave `OPENAI_API_KEY` empty rather than retaining the example placeholder.

## Offline demo

If no key is configured or the backend cannot be reached during the health check, PromptUI starts in **Offline demo** mode. It can:

- Render supplied CSV as a table, including quoted commas, escaped quotes, and multiline cells.
- Show five fixed, clearly labeled samples for the exact prompts below.
- Display an explanation when a request needs a live model.

Try **Work with your data**, or paste:

```text
Show this CSV as a table:
Month,Revenue,Costs
January,12000,8000
February,14500,9000
March,13200,8500
```

The offline renderer preserves supplied values; it does not analyze them or perform calculations. CSV rows must have consistent column counts.

The fixed sample prompts are:

- `Compare three laptops in a table.`
- `Create a 7-day travel itinerary.`
- `Explain recursion with an interactive example.`
- `Create a simple project dashboard.`
- `Make a workout plan.`

Samples contain illustrative content, not personalized or current recommendations. Other prompts and follow-up edits require a live model. A failed live request never silently switches to a sample answer.

## History and navigation

Completed responses appear in Recent Chats. Each entry retains the conversation context available when it was created, so follow-ups can continue from an earlier result. The current implementation records completed turns as separate history entries.

**New chat** and **Clear** reset the current workspace without deleting history. Use an entry's trash button to delete it. Undo retains only the most recent deletion and restores the history entry; select it to reopen the response.

History, undo state, and session API keys are held in memory. Reloading or closing the tab clears them. There is no database or cross-device synchronization.

## Scripts and verification

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start backend and frontend together |
| `bun run server` | Start the Bun API server |
| `bun run client` | Start the Vite development server |
| `bun run build` | Type-check TypeScript and build the frontend |
| `bun test` | Run credential handling, prompt routing, CSV, OpenUI parsing, and SSE regression tests |
| `bun run lint` | Run the current ESLint configuration, which targets JavaScript and JSX files |
| `bun run preview` | Preview the built frontend; this does not start the backend |

Run `bun test` and `bun run build` when changing behavior. The tests mock connection requests and do not require a real API key. Live generation must be checked separately with your own configured account.

## Architecture

1. The frontend submits conversation messages to the Bun gateway.
2. The gateway builds a system prompt from the installed OpenUI component schema and task-specific instructions.
3. The OpenAI provider streams output over Server-Sent Events.
4. The client detects OpenUI or plain text, renders the response, and handles supported follow-up actions.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Report configured key presence and the server's default model |
| `POST /api/connection` | Check access to a selected model using the supplied key |
| `POST /api/chat` | Stream a response using the conversation, model, and request or server key |

### Project structure

```text
server/
  index.ts                    API routes and streaming gateway
  connection.ts               Request credentials, model validation, safe connection errors
  prompt.ts                   Task instructions and OpenUI schema prompt
  providers/                  OpenAI provider and streaming interfaces
src/
  components/
    SettingsDialog.tsx        API connection, credits, and license dialog
    SessionHistory.tsx        History drawer and delete controls
    WorkspaceHeader.tsx       Connection status and settings access
    PromptInput.tsx           Composer and starter prompts
    OpenUIRenderer.tsx        Rendering, fallback views, actions, and repair
  hooks/useChat.ts             Conversation, history, cancellation, delete, and undo state
  services/
    api.ts                    Health requests and SSE/demo streaming
    connection.ts             In-memory session credentials and connection verification
    connection.test.ts        Credential and connection regression tests
    mockData.ts               Labeled fixed samples and offline routing
    offlineData.ts            CSV parsing and table generation
    promptExamples.ts         Starter prompt definitions
    prompt.test.ts            Prompt, CSV, parser, and stream regression tests
  types/chat.ts               Message, history, and health types
  utils/openuiDetector.ts     Response format detection and text wrapper
  App.tsx                     Workspace layout and responsive navigation
  index.css                   Theme, responsive styles, and settings layout
  main.tsx                    React entry point
.env.example                  Server configuration template
vite.config.ts                Development server and API proxy
LICENSE                       MIT license
```

The stack includes React 19, TypeScript, Vite, Bun, Lucide, the OpenAI Node SDK, and `@openuidev/react-lang`, `@openuidev/react-ui`, and `@openuidev/react-headless`.

## Limitations and credential handling

- Intended for local, single-user use. There are no user accounts, access controls, rate limits, or production deployment setup.
- No web browsing, live-data retrieval, file uploads, or server tool execution. Generated content depends on supplied context and the model's knowledge.
- Conversation actions and form submissions can request another response; they do not book, purchase, send, or save things in external services.
- A response that looks like a calculator or application is limited to the interactions supported by the installed component library.
- Environment keys remain on the backend and are not included in the frontend bundle. Session keys entered in Settings necessarily exist in browser memory until removed or reloaded.
- Do not commit credentials or put them in `VITE_` environment variables. Use a trusted backend and HTTPS if adapting the application beyond localhost.
- OpenUI and model output are experimental; rendering and answer quality can vary. The build currently reports a large frontend bundle warning.

## Credits and license

Created by **Danilo Stoletovic**. Built with the open-source technologies listed above; third-party dependencies retain their own licenses.

PromptUI is released under the [MIT License](LICENSE).

Copyright (c) 2026 Danilo Stoletovic.
