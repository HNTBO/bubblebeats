# CLAUDE.md

This file provides guidance to Claude Code when working on the BubbleBeats project.

## Project Overview

BubbleBeats is a visual script timing editor for video production. It provides a two-column layout where bubble height represents duration, allowing users to visualize, pace, and edit voiceover scripts alongside visual descriptions.

Built as a companion tool for the Tailwind Video Explainer Remotion project.

## Commands

```bash
npm run dev       # Launch Vite dev server (HMR)
npm run build     # Production build
npm run lint      # ESLint check
npx tsc --noEmit  # TypeScript type check
```

## Architecture

**Tech Stack**: Vite + React 19 + Tailwind CSS 4 + TypeScript (strict)

**Key Files**:
- `src/App.tsx` - Main app shell (Header + BubbleTimeline + Footer)
- `src/hooks/useScript.ts` - Script state management (split, insert filler, update)
- `src/types/script.ts` - Core types (Bubble, BubblePair, Script)
- `src/utils/timing.ts` - WPM calculations, px/seconds conversion

**Components**:
- `Header.tsx` - Title input, duration display, export button
- `BubbleTimeline.tsx` - Two-column layout orchestrator
- `TextBubble.tsx` - Editable text bubble with timing validation
- `VisualBubble.tsx` - Visual description bubble

**Key Interactions**:
- Ctrl+Click in text → splits bubble at cursor position
- Ctrl+Click at bubble boundary → inserts filler/pause
- Drag bottom edge → resize bubble duration
- Red glow → text doesn't fit in allocated time

## Issue Tracking (Beads)

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd close <id>         # Complete work
bd sync               # Sync with git
```

**Critical**: Work sessions must end with `git push` succeeding.
