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

This is a "嘴替机器人" (TTS Voice Clone Bot) - a Next.js 15 app that uses TTS (Text-to-Speech) technology to generate speech in your voice.

### Model Capability

The underlying model is a TTS system that:
- **Input**: Text content + your audio sample + your audio's transcription text
- **Output**: Speech generated in your voice

### Project Structure

- `app/` - Next.js App Router pages and layouts
  - `app/api/voice-convert/` - API endpoint for TTS voice generation
- `components/` - Reusable React components
  - `voice-recorder.tsx` - Records user's voice sample using Web Audio API
  - `audio-player.tsx` - Custom audio player with progress bar
  - `navbar.tsx`, `theme-switch.tsx`, `icons.tsx` - UI components
- `lib/` - Utility libraries
  - `triton-vc-client.ts` - gRPC client for Triton TTS service
  - `audio-utils.ts` - Audio processing utilities (WAV parsing, resampling)
- `config/` - Site configuration (`site.ts` for nav items/links, `fonts.ts` for fonts)
- `styles/` - Global CSS
- `types/` - TypeScript type definitions

### Key Features

1. **Voice Recording**: Uses browser MediaRecorder API to capture user's voice sample
2. **TTS Generation**: API route at `/api/voice-convert` generates speech from text using Triton gRPC service
3. **Voice Sample Upload**: Users can upload their voice sample with transcription for voice cloning
4. **Audio Playback**: Custom player component with play/pause and progress tracking

### Integration Points

- `lib/triton-vc-client.ts`: gRPC client for Triton Inference Server
- `.env.local`: Configure `VC_SERVER_ADDRESS`, `VC_SERVER_PORT`, `VC_MODEL_NAME`, `VC_SAMPLE_RATE`

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
