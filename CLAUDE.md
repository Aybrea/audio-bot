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

This is a Next.js 15 app using the App Router with HeroUI (v2) component library, Tailwind CSS 4, and TypeScript.

### Project Structure

- `app/` - Next.js App Router pages and layouts
- `components/` - Reusable React components (navbar, theme-switch, icons, primitives)
- `config/` - Site configuration (`site.ts` for nav items/links, `fonts.ts` for fonts)
- `styles/` - Global CSS
- `types/` - TypeScript type definitions

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
