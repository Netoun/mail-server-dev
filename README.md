# mail-server-dev

![Build Status](https://img.shields.io/github/actions/workflow/status/netoun/mail-server-dev/ci.yml?branch=main&style=flat-square)
![Docker Image](https://img.shields.io/docker/v/netoun/mail-server-dev?style=flat-square)
![Docker Pulls](https://img.shields.io/docker/pulls/netoun/mail-server-dev?style=flat-square)

A modern, developer-friendly local mail server and inbox for testing and development.

---

> **Run locally with Docker in seconds. Instantly receive, browse, and debug emails in a beautiful web UI.**

---

## Features

- Receive emails locally via SMTP (for dev/testing)
- Browse and search emails in a fast, modern web UI
- View email details (HTML, text, headers)
- Delete emails from the inbox
- Real-time updates (SSE)
- Theming (light/dark mode)
- Docker support for easy setup

---

## Getting Started

### With Docker (recommended)

#### Utiliser l'image Docker pré-construite

```bash
docker pull netoun/mail-server-dev:latest
docker run -p 1080:1080 -p 1025:1025 netoun/mail-server-dev
```

#### Construire l'image localement

```bash
docker build -t mail-server-dev .
docker run -p 1080:1080 -p 1025:1025 mail-server-dev
```

Ou avec docker-compose :

```bash
docker-compose up --build
```

- Web UI: [http://localhost:1080](http://localhost:1080)
- SMTP server: **localhost:1025**

### Local Development (optional)

```bash
bun install
bun run dev
```

---

## Usage

Configure your app or tool to send emails to:

- **SMTP Host:** `localhost`
- **SMTP Port:** `1025`

You can use any tool or script to send test emails. Example with `swaks`:

```bash
swaks --to test@example.com --server localhost:1025
```

---

## Project Structure

- `packages/server/` — Rust backend (SMTP, REST API, DB)
- `packages/web/` — Preact frontend (UI)

---

## Contributing

PRs and issues welcome!

---

## Docker Image

L'image Docker est disponible sur :

- **Docker Hub**: `netoun/mail-server-dev:latest`
- **GitHub Container Registry**: `ghcr.io/netoun/mail-server-dev:latest`

### Tags disponibles

- `latest` - Dernière version
- `main` - Version de la branche main
- `v1.x.x` - Versions taguées

## License
MIT