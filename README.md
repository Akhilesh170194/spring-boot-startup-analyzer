# Spring Boot Startup Analyzer

A lightweight web UI to visualize and analyze Spring Boot startup performance from the `/actuator/startup` endpoint.

![Spring Boot Startup Analyzer](https://img.shields.io/badge/Spring%20Boot-Startup%20Analyzer-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## Overview

- Interactive timeline with parent/child steps
- Summary metrics and severity indicators (fast/normal/slow/critical)
- Dark/light theme with system auto-detect and manual toggle
- Fully client-side (no server required)

For the complete user guide, configuration, and troubleshooting, see the User Manual:

- docs/USER_MANUAL.md

## Quick Start

1. Download the project and open `index.html` in a modern browser.
2. Option A — From URL: Enter your Spring Boot Actuator startup endpoint, e.g. `http://localhost:8080/actuator/startup`,
   then click Load from URL to populate the editor, and click "Summarize JSON" to render the analysis.
3. Option B — From file or paste: Choose a JSON file exported from `/actuator/startup` — its content will appear in the
   editor — or paste the JSON directly in the editor, then click "Summarize JSON".

Tip: To avoid CORS in some setups when using the URL option, serve the files via a simple local web server (e.g.,
`python -m http.server 8000`).

## Run with Docker Compose

The UI is a static site. You can serve it locally with Docker in seconds.

Prerequisites:

- Docker Desktop (includes Docker Compose)

Steps:

1. From the repository root, run:
    - `docker compose up -d`
2. Open http://localhost:8000 in your browser (default).
3. When finished, stop and remove the container:
    - `docker compose down`

Customize the host port (optional):

- The container exposes port 80 (nginx default). The compose file publishes it to your host port using an environment
  variable `UI_PORT` with a default of `8000`.
- Examples:
    - PowerShell: `$env:UI_PORT=9000; docker compose up -d` then open http://localhost:9000
    - Bash: `UI_PORT=9000 docker compose up -d` then open http://localhost:9000

Notes:

- The compose file pulls and runs the prebuilt image `akhileshsingh170194/spring-boot-startup-analyzer:1.0.0`.
- If you use the Load from URL option, ensure your Spring Boot app allows CORS from
  `http://localhost:${UI_PORT:-8000}` (see docs/USER_MANUAL.md for examples).

## Features

- Visual timeline with expand/collapse and progress bars
- Clickable metric cards to filter by All/Slow/Critical
- Step details: description, timestamps, tags, severity warnings
- Responsive design
- One-click Clear button to reset inputs and results

## Project Structure

```
spring-boot-startup-analyzer/
├── index.html
├── spring-boot-startup-analyzer.html
├── css/
│   └── styles.css
├── js/
│   ├── app/
│   │   ├── AppController.js         # ES module entry for the dashboard
│   │   ├── Utils.js                 # StartupStepUtils helpers
│   │   ├── state/AppStateStore.js   # Central state + DOM refs
│   │   ├── data/StartupDataProcessor.js
│   │   ├── ui/TimelineRenderer.js
│   │   ├── ui/FilterManager.js
│   │   └── services/{FileAndEventService,ThemeService}.js
│   ├── ui
│   │   ├── LlmSettingsController.js  # LLM Settings modal controller
│   ├── llm
│   │   ├── ProviderPresets.js
│   │   ├── ProfileStore.js
│   │   ├── LLMManager.js
│   │   ├── LLMClient.js
│   │   ├── Adapters.js
│   │   ├── PromptBuilder.js
├── docs/
│   └── USER_MANUAL.md
├── LICENSE
└── COPYRIGHT
```

## Requirements

- Browser: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Spring Boot 2.4+ with Actuator and BufferingApplicationStartup enabled

For full Spring Boot configuration examples (Maven/Gradle, properties/YAML, CORS, security), see docs/USER_MANUAL.md.

## Contributing

Contributions are welcome! Please:

- Fork the repo and create a feature branch
- Make changes with minimal scope and clear commit messages
- Test locally and open a PR

## License

MIT License — see LICENSE.

## Support

- See docs/USER_MANUAL.md for detailed instructions and FAQs
- Open an issue for bugs or feature requests

## Security & Privacy

- All data is processed locally in your browser; no information is sent to external servers.
- When using the URL option, your browser fetches the JSON directly from your Spring Boot app.
- If your actuator endpoints require authentication or are internal-only, use this tool in development or a secure
  environment.

## Project Status and Compatibility

- Status: Stable and maintained.
- Designed for Spring Boot 2.4+ with the `/actuator/startup` endpoint and BufferingApplicationStartup enabled.
- This is a static web app (no backend). It should work from a local file or any static web server.

## Accessibility and Browser Support

- Keyboard navigation, focus-visible styles, and high-contrast themes are supported.
- Tested on recent versions of Chrome, Firefox, Safari, and Edge (see Requirements for minimum versions).

## Run with Docker (prebuilt image)

If you just want to run the UI using the published public image (no cloning or building required):

- Start the container on port 8001 as requested:

```
docker run -d -p 8001:80 --name spring-boot-startup-analyzer \
  akhileshsingh170194/spring-boot-startup-analyzer:1.0.0
```

- Open the UI at: http://localhost:8001
- Stop and remove the container when done:

```
docker stop spring-boot-startup-analyzer && docker rm spring-boot-startup-analyzer
```

Notes:

- The container exposes port 80; map to any host port as needed (e.g., -p 9000:80 → http://localhost:9000).
- If you use the Load from URL option, ensure your Spring Boot app allows CORS from the host where this UI runs (
  e.g., http://localhost:8001).

## Build and Publish a Docker Image

You can package the static UI into a small Docker image and push it to a public registry (e.g., Docker Hub).

Prerequisites:

- A Docker Hub account (or any container registry account)
- Docker Desktop / CLI installed and logged in (`docker login`)

Build the image (replace YOUR_DOCKERHUB_USERNAME as needed):

```
# From the repository root
docker build -t YOUR_DOCKERHUB_USERNAME/startup-analyzer-ui:latest .
```

Test locally:

```
docker run --rm -p 8000:80 YOUR_DOCKERHUB_USERNAME/startup-analyzer-ui:latest
# Open http://localhost:8000
```

Version/tag recommendations:

- Use semantic tags when you make visible changes (e.g., `v1.0.0`, `v1.0.1`).
- Keep `:latest` updated to the newest stable release.

Push to Docker Hub:

```
# If not already authenticated
docker login

# Push your tag(s)
docker push YOUR_DOCKERHUB_USERNAME/startup-analyzer-ui:latest
# Optionally push a versioned tag
# docker tag YOUR_DOCKERHUB_USERNAME/startup-analyzer-ui:latest YOUR_DOCKERHUB_USERNAME/startup-analyzer-ui:v1.0.0
# docker push YOUR_DOCKERHUB_USERNAME/startup-analyzer-ui:v1.0.0
```

Notes:

- This is a static app served by nginx; no server-side code runs. The container simply serves the HTML/CSS/JS.
- When using the Analyze (URL) option, ensure your Spring Boot app allows CORS from the host where this container is
  running (e.g., `http://localhost:8000` or your public domain). See docs/USER_MANUAL.md for configuration examples.
- To host publicly, push to a public repository on Docker Hub and reference the image in your deployment platform (
  Kubernetes, ECS, ACI, Fly.io, etc.).

Alternative: GitHub Container Registry (GHCR):

```
# Login (uses GitHub token with `write:packages` scope)
docker login ghcr.io -u YOUR_GITHUB_USERNAME -p YOUR_GITHUB_TOKEN

# Tag and push
docker tag YOUR_DOCKERHUB_USERNAME/startup-analyzer-ui:latest ghcr.io/YOUR_GITHUB_USERNAME/startup-analyzer-ui:latest
docker push ghcr.io/YOUR_GITHUB_USERNAME/startup-analyzer-ui:latest
```

## AI-assisted analysis (LLM)

This project includes optional AI assistance to summarize and highlight bottlenecks in your `/actuator/startup` data.

- Button: Analyze with LLM (appears below the JSON editor once you paste or load JSON)
- Settings: Open the header menu → LLM Settings to configure a provider and API key
- Providers: OpenRouter (default), OpenAI, Anthropic, DeepSeek, or an OpenAI Compatible endpoint (requires explicit
  model)
- Privacy: Your API key is stored locally in your browser (localStorage). For production use, consider a secure
  server-side proxy.

How to use

- Load your JSON (Load from URL, file, or paste → Summarize JSON) → then click Analyze with LLM
- Optional: Toggle “Send full JSON” to control how much data is sent to the model
- You can cancel an in-flight request using the Cancel button shown near the results

Send full JSON toggle

- Off (default): The app builds a compact prompt with a computed summary (counts, durations, top slow steps) and
  includes a truncated snippet of the JSON. This minimizes tokens and reduces rate-limit risk.
- On: The app sends the full `/actuator/startup` JSON along with an analysis task. This may be slower and can hit token
  limits depending on the provider/model.

Exact prompts used

When Send full JSON is OFF (compact prompt)

- System:
  "You are an expert Spring Boot performance engineer. Provide a concise analysis with a brief summary, the top
  bottlenecks, and actionable optimization steps."
- User:
  "Summary and top slow steps are precomputed, followed by a truncated JSON excerpt. Return only plain text, no markdown
  tables."
  Note: The app composes this using an internal PromptBuilder, which includes:
    - A summary block (total steps, total duration, average duration, counts of slow/critical steps)
    - Top N slowest/critical steps
    - A truncated JSON excerpt (default cap ~100 KB)
    - A closing instruction: "Return only plain text, no markdown tables."

When Send full JSON is ON (full JSON prompt)

- System:
  "You are an expert Spring Boot performance engineer. Analyze startup timeline JSON and provide: 1) a brief summary, 2)
  the top bottlenecks (slow/critical), and 3) actionable optimization suggestions. Keep it concise."
- User:
  "Here is the /actuator/startup JSON to analyze: <entire JSON>.\n\nReturn only plain text, no markdown tables."

Troubleshooting

- CORS: If you fetch from a URL and see CORS errors, serve this UI from a local web server or use a proxy.
- 401/403: Check API keys and model names in LLM Settings.
- 429 (rate limit): Try again later, select a lighter model, or enable the compact prompt (toggle off Full JSON). The
  client retries with backoff and may auto-fallback to a smaller model for OpenAI-compatible providers.
