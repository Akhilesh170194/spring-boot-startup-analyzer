# Production image for Spring Boot Startup Analyzer (static UI)
# Serves the site via nginx:alpine

FROM nginx:alpine

# Metadata (OCI labels)
LABEL org.opencontainers.image.title="Spring Boot Startup Analyzer UI" \
      org.opencontainers.image.description="A static web UI to visualize Spring Boot startup performance from /actuator/startup." \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.url="https://example.com/spring-boot-startup-analyzer" \
      org.opencontainers.image.source="https://github.com/Akhilesh170194/spring-boot-startup-analyzer.git"

# Copy the static site into nginx html directory
# Only copy the files needed to serve the UI to keep the image small
COPY index.html /usr/share/nginx/html/index.html
COPY spring-boot-startup-analyzer.html /usr/share/nginx/html/spring-boot-startup-analyzer.html
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
COPY LICENSE /usr/share/nginx/html/LICENSE
COPY COPYRIGHT /usr/share/nginx/html/COPYRIGHT

# Expose port 80 (nginx default)
EXPOSE 80

# Healthcheck: ensure nginx is responding
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

# Use default nginx command
CMD ["nginx", "-g", "daemon off;"]
