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
2. Option A — From URL: Enter your Spring Boot Actuator startup endpoint, e.g. `http://localhost:8080/actuator/startup`, then click Analyze.
3. Option B — From file or paste: Choose a JSON file exported from `/actuator/startup` — its content will appear in the editor — or paste the JSON directly in the editor, then click "Load JSON".

Tip: To avoid CORS in some setups when using the URL option, serve the files via a simple local web server (e.g., `python -m http.server 8000`).

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
│   └── app.js
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
- If your actuator endpoints require authentication or are internal-only, use this tool in development or a secure environment.

## Project Status and Compatibility

- Status: Stable and maintained.
- Designed for Spring Boot 2.4+ with the `/actuator/startup` endpoint and BufferingApplicationStartup enabled.
- This is a static web app (no backend). It should work from a local file or any static web server.

## Accessibility and Browser Support

- Keyboard navigation, focus-visible styles, and high-contrast themes are supported.
- Tested on recent versions of Chrome, Firefox, Safari, and Edge (see Requirements for minimum versions).



