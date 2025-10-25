# Spring Boot Startup Analyzer - User Manual

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [System Requirements](#system-requirements)
4. [Spring Boot Setup](#spring-boot-setup)
5. [Using the Application](#using-the-application)
6. [Understanding the Interface](#understanding-the-interface)
7. [Advanced Features](#advanced-features)
8. [Performance Analysis](#performance-analysis)
9. [FAQ](#faq)
10. [Keyboard Shortcuts](#keyboard-shortcuts)
11. [Data Privacy & Security](#data-privacy--security)
12. [Known Limitations](#known-limitations)
13. [Support](#support)

## Introduction

The Spring Boot Startup Analyzer is a web-based tool designed to help developers visualize and optimize their Spring Boot application startup times. It connects to your application's `/actuator/startup` endpoint and provides:

- Visual representation of startup timeline
- Performance bottleneck identification
- Detailed step-by-step analysis
- Interactive filtering and navigation

## Getting Started

### Installation

No installation is required! Simply:

1. Download or clone the project
2. Navigate to the folder
3. Open `index.html` in any modern web browser

### Quick Test

Before connecting to your own application, you can test with a sample endpoint:

```
http://your-spring-boot-app.com/actuator/startup
```

## Spring Boot Setup

### Complete Configuration Guide

#### 1. Add Dependencies

**Maven** (`pom.xml`):
```xml
<dependencies>
    <!-- Spring Boot Actuator -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
</dependencies>
```

**Gradle** (`build.gradle`):
```gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
}
```

#### 2. Configure Application Properties

**application.properties**:
```properties
# ====================================
# Actuator Configuration
# ====================================

# Enable startup endpoint
management.endpoint.startup.enabled=true
management.endpoints.web.exposure.include=startup,health,info

# Optional: Change base path
management.endpoints.web.base-path=/actuator

# Optional: Change server port for management endpoints
# management.server.port=9090

# ====================================
# CORS Configuration (Development)
# ====================================
management.endpoints.web.cors.allowed-origins=http://localhost:8000,http://localhost:3000,http://127.0.0.1:8000
management.endpoints.web.cors.allowed-methods=GET,POST,OPTIONS
management.endpoints.web.cors.allowed-headers=*
management.endpoints.web.cors.allow-credentials=true

# ====================================
# Security (if using Spring Security)
# ====================================
# Allow unauthenticated access to actuator endpoints (development only)
# spring.security.user.name=admin
# spring.security.user.password=admin
```

**application.yml**:
```yaml
management:
  endpoint:
    startup:
      enabled: true
  endpoints:
    web:
      base-path: /actuator
      exposure:
        include: startup,health,info
      cors:
        allowed-origins:
          - http://localhost:8000
          - http://localhost:3000
          - http://127.0.0.1:8000
        allowed-methods:
          - GET
          - POST
          - OPTIONS
        allowed-headers: '*'
        allow-credentials: true
```

#### 3. Enable Startup Tracking

**Option A: Configuration Class**

```java
package com.yourcompany.config;

import org.springframework.boot.context.metrics.buffering.BufferingApplicationStartup;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class StartupConfig {

    @Bean
    public BufferingApplicationStartup applicationStartup() {
        // Buffer size: number of startup steps to record
        // Recommended: 2048 for most applications
        return new BufferingApplicationStartup(2048);
    }
}
```

**Option B: Main Application Class**

```java
package com.yourcompany;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.metrics.buffering.BufferingApplicationStartup;

@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(Application.class);

        // Enable startup tracking
        app.setApplicationStartup(new BufferingApplicationStartup(2048));

        app.run(args);
    }
}
```

#### 4. CORS Configuration (if needed)

If you encounter CORS errors, add this configuration:

```java
package com.yourcompany.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfiguration implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/actuator/**")
                .allowedOrigins(
                    "http://localhost:8000",
                    "http://localhost:3000",
                    "http://127.0.0.1:8000"
                )
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

#### 5. Verify Configuration

After starting your application, test the endpoint:

**Using curl**:
```bash
curl http://localhost:8080/actuator/startup
```

**Using your browser**:
```
http://localhost:8080/actuator/startup
```

You should see JSON output containing `timeline` and `events`.

## Using the Application

### Step-by-Step Guide

#### 1. Open the Application

Open `index.html` in your browser. You'll see:
- Header with app title and theme toggle
- Input field with "Analyze" button
- "Expand All" checkbox
- Empty state message

#### 2. Enter Endpoint URL

In the input field, enter your Spring Boot application's startup endpoint:

**Examples**:
- `http://localhost:8080/actuator/startup`
- `http://localhost:7811/api/actuator/startup`
- `https://your-app.com/actuator/startup`

#### 3. Click "Analyze"

The application will:
1. Show a loading indicator
2. Fetch data from your endpoint
3. Process and analyze the timeline
4. Display results

#### Alternative: File or Paste JSON (unified editor)

If you have previously saved the JSON output from your application's `/actuator/startup` endpoint, or want to paste it directly:

1. Choose a `.json` file using the file selector — the file's content will appear in the editor below for preview/editing — or paste the JSON into the editor.
2. Click "Load JSON" to analyze it locally.
3. Use the "Clear" button at any time to reset the URL field, selected file, editor, and results back to the empty state.

Notes:
- Parsing is strict JSON (no comments or trailing commas)
- Data is processed entirely in your browser; nothing is uploaded anywhere
- If the JSON is malformed, an error message will be shown

#### 4. View Results

After successful analysis, you'll see:

**Summary Section**:
- Total startup duration
- Total number of steps
- Count of slow steps
- Count of critical issues

**Timeline Section**:
- Interactive tree view of all startup steps
- Color-coded performance indicators
- Progress bars showing relative duration

## Understanding the Interface

### Header

- **App Logo (⚡)**: Branding
- **Title**: "Spring Boot Startup Analyzer"
- **Theme Toggle (🌙/☀️)**: Switch between dark and light modes

### Input Section

- **URL Input**: Enter your actuator endpoint URL
- **Analyze Button**: Fetch and analyze startup data
- **Expand All**: Checkbox to expand all step details

### Summary Cards

#### Total Steps Card (Blue Border)
- Shows total number of startup steps
- Click to show all steps (removes filters)
- Active by default

#### Slow Steps Card (Yellow Border)
- Shows count of steps slower than 2x average
- Click to filter and show only slow steps
- Helps identify performance concerns

#### Critical Issues Card (Red Border)
- Shows count of steps slower than 3x average
- Click to filter and show only critical steps
- Identifies severe performance problems

### Timeline View

Each timeline item shows:

**Header**:
- Collapse icon (▶) for parent items
- Severity icon (if applicable)
- Step name
- Severity badge (CRITICAL/SLOW)
- Duration

**Progress Bar**:
- Visual representation of duration
- Color-coded by severity:
  - Green: Fast steps
  - Blue: Normal steps
  - Yellow: Slow steps
  - Red: Critical steps

**Details Section** (click to expand):
- Step description
- Step ID and parent ID
- Start and end timestamps
- Custom tags
- Performance warnings

### Severity Levels

| Severity | Color | Criteria | Meaning |
|----------|-------|----------|---------|
| **Fast** | 🟢 Green | < average | Performing well |
| **Normal** | 🔵 Blue | ~average | As expected |
| **Slow** | 🟡 Yellow | > 2x average | Needs attention |
| **Critical** | 🔴 Red | > 3x average | Performance issue |

## Advanced Features

### Tree Navigation

#### Single-Click Behavior
- Expands/collapses the **details** of a step
- Shows description, timestamps, and tags
- Works on all steps (parent and leaf)

#### Double-Click Behavior
- Expands/collapses **child steps** (only for parent items)
- Reveals nested startup phases
- Useful for exploring component initialization

#### Visual Indicators
- **▶ icon**: Collapsed children
- **▼ icon**: Expanded children (rotates 90° when expanded)

### Filtering

#### Filter by Card Click
1. Click **Total Steps**: Shows all steps
2. Click **Slow Steps**: Shows only yellow/slow steps
3. Click **Critical Issues**: Shows only red/critical steps

**Visual Feedback**:
- Active card has a colored border
- Inactive items are hidden
- Counts update dynamically

#### Using "Expand All"
- Check the box to expand details for all visible steps
- Uncheck to collapse all details
- Works with current filter

### Theme Management

#### Auto-Detection
- Detects your system's dark/light mode preference
- Applies matching theme on first load

#### Manual Toggle
- Click 🌙 icon to switch to dark mode
- Click ☀️ icon to switch to light mode
- Preference saved in browser's local storage

#### Theme Persistence
- Your choice is remembered across sessions
- Stored in `localStorage`
- Survives browser restarts

## Performance Analysis

### Identifying Bottlenecks

1. **Look for Critical Issues**
   - Click the "Critical Issues" card
   - Focus on red-colored items
   - These are 3x slower than average

2. **Check Slow Steps**
   - Click the "Slow Steps" card
   - Review yellow-colored items
   - These are 2x slower than average

3. **Analyze Total Duration**
   - Review the "Total Duration" metric
   - Compare with your performance targets
   - Industry standard: < 10 seconds for most apps

### Common Problem Areas

#### Database Connection Pooling
**Symptoms**:
- Long duration for database initialization steps
- Steps containing "DataSource" or "JPA"

**Solutions**:
- Tune connection pool settings
- Reduce initial pool size
- Use lazy initialization

#### Component Scanning
**Symptoms**:
- Steps containing "component-scan" or "base-packages.scan"
- Multiple slow bean instantiation steps

**Solutions**:
- Reduce package scan scope
- Use explicit component registration
- Enable lazy bean initialization

#### Auto-Configuration
**Symptoms**:
- Many slow steps in context loading phase
- Steps containing "auto-configuration"

**Solutions**:
- Exclude unused auto-configurations
- Use conditional beans
- Profile-specific configurations

### Optimization Workflow

1. **Baseline**: Record current startup time
2. **Identify**: Use analyzer to find bottlenecks
3. **Optimize**: Apply fixes to slow/critical steps
4. **Measure**: Re-run analyzer to verify improvements
5. **Iterate**: Repeat until target is met

## FAQ

### General Questions

**Q: Does this tool require internet access?**
A: No, it works entirely offline. Internet is only needed to fetch data from your Spring Boot app.

**Q: Is my startup data sent anywhere?**
A: No, all processing happens in your browser. No data is transmitted to external servers.

**Q: Can I use this in production?**
A: The analyzer can be used anywhere, but we recommend using the startup endpoint only in development/staging.

### Configuration Questions

**Q: Why is my endpoint returning 404?**
A: Ensure:
- Actuator dependency is added
- `management.endpoint.startup.enabled=true` is set
- Your app has been restarted after configuration

**Q: How do I secure the actuator endpoints?**
A: Use Spring Security to restrict access:

```java
@Configuration
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.authorizeRequests()
            .antMatchers("/actuator/**").hasRole("ADMIN")
            .and()
            .httpBasic();
    }
}
```

**Q: What is BufferingApplicationStartup?**
A: It's a Spring Boot feature that records startup events in memory, making them available through the actuator endpoint.

### Usage Questions

**Q: Why do I see CORS errors?**
A: Enable CORS in your Spring Boot app (see Spring Boot Setup section) or run the analyzer from a local web server.

**Q: Can I export the analysis?**
A: Currently, you can take screenshots or use browser developer tools to save the timeline data.

**Q: How often should I analyze startup performance?**
A: Run analysis:
- After adding new dependencies
- When startup time increases noticeably
- Before major releases
- As part of performance testing

## Keyboard Shortcuts

| Key                | Action                                       |
|--------------------|----------------------------------------------|
| `Ctrl/Cmd + Enter` | Trigger analysis (when URL field is focused) |
| `Space`            | Expand/collapse current step (when focused)  |
| `Escape`           | Close expanded details                       |

### Accessibility

- Full keyboard navigation support
- Screen reader compatible
- High contrast mode support
- Semantic HTML structure

## Tips and Best Practices

### For Best Results

1. **Use a local web server** to avoid CORS issues
2. **Restart your Spring Boot app** after configuration changes
3. **Run analysis multiple times** for consistent results
4. **Compare before/after** when making optimizations
5. **Focus on critical issues first** for maximum impact

---

**Need more help?** Check the [README.md](../README.md) or open an issue on GitHub.





## System Requirements

- Browser: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Java (for your Spring Boot app): 8+ (match your Spring Boot baseline)
- Spring Boot: 2.4+ with Actuator and BufferingApplicationStartup enabled
- Network: Access to your app’s `/actuator/startup` when using the URL option

## Data Privacy & Security

- Processing is entirely client-side; no backend is used by this tool.
- When analyzing from a URL, your browser requests the JSON directly from your app.
- If your actuator is protected, use credentials as configured in your environment; do not paste sensitive data into shared machines.
- Recommended practices:
  - Use the analyzer primarily in development or staging.
  - Limit actuator exposure and scope (`management.endpoints.web.exposure.include`).
  - Apply appropriate CORS and security policies (examples provided in this manual).

## Known Limitations

- The analyzer expects the standard `/actuator/startup` JSON shape (timeline/events).
- Very large timelines may impact browser performance on low-end devices.
- JSON must be valid (no comments/trailing commas).
- Double-click to expand/collapse children relies on rapid clicks; on touch devices it may feel different.
- No built-in export yet; use screenshots or browser tools to save data.

## Support

- For feature requests or bugs, open an issue in the repository.
- See the README for an overview and this User Manual for detailed usage and setup.
- Please include your Spring Boot version, a redacted sample of the startup JSON (if possible), and browser details when reporting issues.
