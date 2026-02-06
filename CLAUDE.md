# CLAUDE.md

This file provides guidance to Claude Code when working on the BubbleBeats project.

## Project Overview

BubbleBeats is a visual script timing editor for video production. It provides a two-column layout (Voice | Visual) where bubble height represents duration, allowing users to visualize, pace, and edit voiceover scripts alongside visual descriptions.

Built as a companion tool for the Tailwind Video Explainer Remotion project.

## Commands

```bash
npm run dev       # Launch Vite dev server (HMR)
npm run build     # Production build
npm run lint      # ESLint check
npx tsc --noEmit  # TypeScript type check
```

## Architecture

**Tech Stack**: Vite 7 + React 19 + Tailwind CSS 4 + TypeScript (strict)

**File Structure**:
```
src/
├── App.tsx                    # Main app shell (Header + BubbleTimeline + Footer)
├── main.tsx                   # Entry point
├── index.css                  # Tailwind import + custom scrollbar styles
├── components/
│   ├── BubbleTimeline.tsx     # Two-column layout orchestrator, edit mode coordination
│   ├── Header.tsx             # Title, duration, zoom, hamburger menu (import/export/settings)
│   ├── TextBubble.tsx         # Voice bubble (text + filler modes) with edit mode
│   └── VisualBubble.tsx       # Visual description bubble (always editable)
├── hooks/
│   ├── useScript.ts           # Script state: CRUD, split, insert filler, commit text
│   └── useSettings.ts         # Theme, info mode, zoom — persisted in localStorage
├── utils/
│   ├── exportMarkdown.ts      # Export to Markdown + JSON, file download helper
│   ├── ids.ts                 # ID generator (b{timestamp}-{counter})
│   ├── parseMarkdown.ts       # Import from script markdown files
│   └── timing.ts              # WPM calculations (150 WPM), formatTime, countWords
└── types/
    └── script.ts              # Core types: Bubble, BubblePair, Script
```

**Core Types** (`types/script.ts`):
- `Bubble` — has `id`, `type` ('text' | 'filler'), `content`, `durationSeconds`, optional `manualDuration`
- `BubblePair` — pairs a `text` Bubble with a `visual` Bubble
- `Script` — `title`, `totalDurationSeconds`, array of `BubblePair`

**State Management**:
- `useScript` — all script mutations (split, insert filler, update text/visual, commit duration recalc)
- `useSettings` — theme/infoMode/zoom via React Context, persisted in `localStorage` as `bubblebeats-settings`

## Interactions

**Edit mode** (text bubbles only):
- Double-click → enter edit mode (blue inner glow, textarea focused)
- ESC or click outside → exit edit mode (duration recalculates from word count)
- Double-clicking another bubble exits the current one first
- Only one text bubble can be in edit mode at a time

**Splitting & fillers**:
- Ctrl+Click inside an editing text bubble → splits at cursor position (both columns)
- Click the + icon between bubbles → inserts a filler/pause bubble

**Resize**:
- Drag bottom edge of filler/pause bubbles to resize duration
- Text bubble duration is always derived from word count (no manual resize)

**Visual feedback**:
- Red border/glow on text bubbles when content exceeds allocated time
- Blue inner glow on the actively editing text bubble
- "Over by X:XX" banner when total exceeds target duration
- Proportional height scaling with zoom slider (100% → Fit)

## Import/Export

**Import**: Markdown files (`.md`, `.txt`) via hamburger menu. Parser expects:
- `# Title` heading → script title
- `[M:SS]` timecodes → bubble boundaries
- `*italic text*` → visual column
- Plain text → voice column

**Export**: Markdown (`.md`) or JSON (`.json`) via hamburger menu.

## Settings

Managed via hamburger menu in header:
- **Theme**: Light / Dark mode
- **Info mode**: Show/hide word counts, cumulative timecodes, duration estimates
- **Zoom**: Slider from 100% width (scrollable) to fit-height (no scroll)

All persisted in `localStorage`.

## Issue Tracking (Beads)

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd close <id>         # Complete work
bd sync               # Sync with git
```

**Critical**: Work sessions must end with `git push` succeeding.
