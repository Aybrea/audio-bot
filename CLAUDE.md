# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev      # Start development server with Turbopack
bun run build    # Build for production
bun run lint     # Run ESLint with auto-fix
bun run start    # Start production server
```

## Architecture

This is a "嘴替机器人" (Roast Bot) - a Next.js 15 app that lets users record their voice, describe something they want to complain about, and have AI generate a roast in their own voice.

### Project Structure

- `app/` - Next.js App Router pages and layouts
  - `app/api/generate-roast/` - API endpoint for AI to generate roast text
  - `app/api/text-to-speech/` - API endpoint for TTS voice synthesis
- `components/` - Reusable React components
  - `voice-recorder.tsx` - Records user's voice sample using Web Audio API
  - `audio-player.tsx` - Custom audio player with progress bar
  - `navbar.tsx`, `theme-switch.tsx`, `icons.tsx` - UI components
- `config/` - Site configuration (`site.ts` for nav items/links, `fonts.ts` for fonts)
- `styles/` - Global CSS
- `types/` - TypeScript type definitions

### Key Features

1. **Voice Recording**: Uses browser MediaRecorder API to capture user's voice sample
2. **AI Roast Generation**: API route at `/api/generate-roast` generates roast text (needs custom LLM integration)
3. **Voice Cloning TTS**: API route at `/api/text-to-speech` synthesizes speech (needs TTS service integration)
4. **Audio Playback**: Custom player component with play/pause and progress tracking

### Integration Points

- `app/api/generate-roast/route.ts`: Replace mock implementation with your deployed LLM API
- `app/api/text-to-speech/route.ts`: Integrate TTS service (Fish Audio, ElevenLabs, etc.)
- `.env.local`: Configure API keys for MODEL_API_KEY, FISH_AUDIO_API_KEY, etc.

### Key Patterns

- **Providers**: `app/providers.tsx` wraps the app with HeroUIProvider and NextThemesProvider (dark mode default)
- **Configuration**: Site metadata, navigation items, and external links are centralized in `config/site.ts`
- **Styling**: Uses `tailwind-variants` for component variants, and HeroUI's theme plugin in `tailwind.config.js`
- **Imports**: Use `@/` alias for absolute imports from project root

### ESLint Rules

- Import order: type → builtin → object → external → internal → parent → sibling → index (with blank lines between groups)
- JSX props should be sorted (reserved first, shorthand first, callbacks last)
- Unused imports are auto-removed
- Blank line required before `return` statements
