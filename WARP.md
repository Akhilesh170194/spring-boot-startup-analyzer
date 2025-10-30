# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Spring Boot Startup Analyzer is a client-side web application that visualizes and analyzes Spring Boot application
startup performance from the `/actuator/startup` endpoint. It requires no backend server and processes all data locally
in the browser.

## Commands

**Serving the application locally:**

```bash
# Windows (PowerShell)
python -m http.server 8000

# Then open: http://localhost:8000
```

**No build, lint, or test commands** - this is a pure static HTML/CSS/JS project with no dependencies or build process.

## Architecture

### File Structure

- `index.html` - Main entry point with UI layout
- `js/app/AppController.js` - ES module entry point for the dashboard
- `js/app/*` - Modularized code (state, data processor, renderer, services)
- `js/ui/LlmSettingsController.js` - LLM Settings modal controller
- `js/llm/*` - LLM client, manager, presets, adapters, prompt builder
- `css/styles.css` - Complete styling including dark/light themes
- `docs/USER_MANUAL.md` - Comprehensive usage and Spring Boot configuration guide

### Core JavaScript Architecture (ES Modules)

The application uses a modular, namespace-based architecture with distinct responsibilities:

**AppState**: Central state management

- Maintains `startupData`, DOM element references, and `allSteps` array
- Handles initialization and event binding
- Single source of truth for application state

**StepUtils**: Data transformation utilities

- Parses ISO 8601 durations (`PT1.234S`) to milliseconds
- Calculates severity levels based on average duration thresholds:
    - Critical: > 3x average
    - Slow: > 2x average
    - Normal: > 1000ms
    - Fast: < average
- Maps step names to human-readable descriptions

**DataProcessor**: Metrics calculation

- Computes total duration from first start time to last end time
- Calculates average duration across all steps
- Counts slow and critical steps

**TimelineRenderer**: DOM rendering

- Builds parent-child relationship maps for hierarchical display
- Uses document fragments for batch DOM operations (performance)
- Implements dual-click handlers:
    - Single click: Toggle step details
    - Double click: Toggle child steps (for parent items)
- Applies indentation based on nesting level (20px per level)

**FilterManager**: Filter state and application

- Tracks current filter: 'all', 'slow', or 'critical'
- Shows/hides timeline items via CSS classes
- Updates active card styling

**UIManager**: View state transitions

- Manages visibility of loading, empty, and results sections
- Handles error display

**FileAndPasteManager**: JSON input handling

- Reads JSON files and populates editor for preview/editing
- User summarizes via "Summarize JSON" button

### Data Flow

1. User triggers analysis via URL (fetch from endpoint) or JSON editor (local parsing)
2. `analyzeStartup()` or `parsePastedJson()` acquires data
3. `processAndDisplay()` orchestrates:
    - `DataProcessor.calculateMetrics()` computes summary stats
    - `DataProcessor.updateSummary()` updates metric cards
    - `TimelineRenderer.render()` creates timeline DOM
4. User interactions (filter clicks, expand/collapse) update view state

### Theme System

- Auto-detects system preference (`prefers-color-scheme`)
- Persists user choice in localStorage
- CSS custom properties (`--color-*`) drive all colors
- Toggle updates `data-theme` attribute on `<html>`

## Key Design Patterns

- **Namespacing**: Avoids global pollution; all logic grouped in objects
- **Fragment-based rendering**: Minimizes reflows during timeline creation
- **CSS class-based state**: Uses `.hidden`, `.expanded`, `.show` classes instead of inline styles
- **Unified editor**: File selection populates textarea for preview/editing before loading
- **Severity thresholds**: Relative to average duration, not absolute values

## Spring Boot Integration

When advising on Spring Boot configuration for this tool:

- Requires `spring-boot-starter-actuator` dependency
- Must enable `BufferingApplicationStartup` with buffer size (recommended: 2048)
- Endpoint: `management.endpoint.startup.enabled=true`
- CORS configuration may be needed for local development
- See `docs/USER_MANUAL.md` for complete Spring Boot setup examples (Maven/Gradle, properties/YAML, Java config)

## Constraints

- No external dependencies (no npm, no bundler, no frameworks)
- Pure browser JavaScript (ES6+)
- Minimum browser support: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- All data processing is client-side; no server communication except initial fetch
