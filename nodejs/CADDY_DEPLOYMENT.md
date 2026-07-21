# Caddy Deployment Guide for PGD Majšperk-Breg

This directory includes native **Caddy** web server support for automatic HTTPS, HTTP/2, reverse proxying, and production security headers.

---

## Quick Deployment Steps with Caddy

### Option A: Running Caddy Directly on the Server

1. **Install Caddy on your Ubuntu/Debian server**:
   ```bash
   sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
   sudo apt update
   sudo apt install caddy
   ```

2. **Start your Node.js application (using Docker or Systemd)**:
   ```bash
   cd nodejs
   docker compose up -d --build
   ```

3. **Copy `Caddyfile` to Caddy directory**:
   ```bash
   sudo cp Caddyfile /etc/caddy/Caddyfile
   # Replace pgd-majsperk-breg.si in /etc/caddy/Caddyfile with your actual domain name
   sudo systemctl reload caddy
   ```

---

## Features Provided by Caddy

- 🔒 **Automatic SSL/TLS Certificates**: Zero configuration SSL via Let's Encrypt / ZeroSSL.
- ⚡ **HTTP/2 & HTTP/3 Support**: Ultra-fast site loads for Google Search ranking.
- 🗜 **Zstd & Gzip Compression**: Automatic asset compression.
- 🛡 **Security Headers**: Includes HSTS, XSS protection, and frame options.
