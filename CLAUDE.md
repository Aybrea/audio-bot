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

This is a multi-purpose Next.js 15 application featuring a TTS (Text-to-Speech) voice cloning system as the main feature, along with several mini-games and utilities (Tetris, Flappy Bird, 2048, EPUB reader, etc.).

### Core TTS System

The main feature is a voice cloning TTS system that:
- **Input**: Text content + optional audio sample (user's voice) + transcription text
- **Output**: Speech generated in the cloned voice (or default voice if no sample provided)
- **Backend**: Triton Inference Server running CosyVoice2 model via gRPC streaming
- **Audio Processing**: Supports streaming audio playback with real-time visualization

### Project Structure

```
app/
├── api/
│   ├── voice-convert/route.ts    # Main TTS API endpoint (streaming)
│   ├── samples/route.ts          # Sample voice files API
│   └── history/route.ts          # History data API
├── page.tsx                      # Main TTS interface
├── [feature]/page.tsx            # Various feature pages (tetris, flappy, epub, etc.)
└── providers.tsx                 # React context providers

components/
├── voice-recorder.tsx            # Voice recording with Web Audio API
├── waveform-player.tsx           # Audio player with waveform visualization
├── live-audio-visualizer.tsx    # Real-time audio visualization during streaming
├── streaming-waveform.tsx        # Streaming waveform display
└── [game]-*.tsx                  # Game-specific components

lib/
├── triton-tts-client.ts          # gRPC client for Triton TTS (streaming support)
├── triton-vc-client.ts           # gRPC client for voice conversion (legacy)
├── audio-utils.ts                # WAV parsing, resampling, format conversion
├── streaming-audio-player.ts    # Streaming audio playback with Web Audio API
└── [feature]-engine.ts           # Game engines (tetris, flappy, 2048, epub)

config/
├── site.ts                       # Navigation items and site metadata
└── fonts.ts                      # Font configuration
```

### TTS System Architecture

**Flow**: User Input → API Route → Triton gRPC Client → Streaming Response → Real-time Playback

1. **Frontend** (`app/page.tsx`):
   - User selects voice mode: default, sample file, or custom recording
   - Records voice sample using `VoiceRecorder` component (Web Audio API)
   - Converts audio to WAV format (16kHz mono) before sending
   - Sends text + optional reference audio + transcription to API

2. **API Route** (`app/api/voice-convert/route.ts`):
   - Receives FormData with text, referenceAudio (Blob), referenceText
   - Parses WAV audio using `parseWavBuffer` from `audio-utils.ts`
   - Resamples to 16kHz if needed
   - Initializes `TritonTTSClient` with gRPC connection
   - Streams audio chunks back to client using `ReadableStream`

3. **gRPC Client** (`lib/triton-tts-client.ts`):
   - Connects to Triton Inference Server via gRPC
   - Uses `ModelStreamInfer` for streaming synthesis
   - Sends inputs: `target_text`, `reference_wav`, `reference_wav_len`, `reference_text`
   - Yields Float32Array chunks as they arrive from server
   - Handles connection with keepalive and large message limits

4. **Streaming Playback** (`lib/streaming-audio-player.ts`):
   - Receives streaming response from API
   - Uses Web Audio API to play audio in real-time
   - Buffers chunks and starts playback after initial buffer
   - Provides real-time frequency/time-domain data for visualization
   - Returns complete Float32Array for final WAV generation

5. **Visualization** (`components/live-audio-visualizer.tsx`):
   - Displays real-time waveform during streaming playback
   - Uses canvas to render frequency and time-domain data

### Audio Processing Details

- **Input Format**: Any browser-supported format (WebM, MP3, etc.)
- **Conversion**: Client-side conversion to WAV (16kHz mono) using Web Audio API
- **Server Processing**: Expects 16kHz mono WAV for reference audio
- **Output Format**: 24kHz mono PCM (Float32Array) streamed as chunks
- **Final Output**: WAV file generated client-side from accumulated chunks

### Environment Configuration

Required in `.env.local`:
```bash
VC_SERVER_ADDRESS=<triton-server-host>
VC_SERVER_PORT=8000
VC_MODEL_NAME=cosyvoice2
VC_SAMPLE_RATE=24000
```

### Key Patterns

- **Providers**: `app/providers.tsx` wraps app with HeroUIProvider, NextThemesProvider, and ToastProvider
- **Configuration**: Navigation and site metadata centralized in `config/site.ts`
- **Styling**: Uses HeroUI v2 components with Tailwind CSS 4
- **Imports**: Use `@/` alias for absolute imports from project root
- **Audio Handling**: All audio processing uses Float32Array for PCM data, converted to/from WAV as needed

### ESLint Rules

- Import order: type → builtin → object → external → internal → parent → sibling → index (with blank lines between groups)
- JSX props sorted: reserved first, shorthand first, callbacks last
- Unused imports auto-removed
- Blank line required before `return` statements
- Blank line required after variable declarations (except consecutive declarations)
