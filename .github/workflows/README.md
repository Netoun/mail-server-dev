# GitHub Actions Workflows

This directory contains GitHub Actions workflows to automate building and deploying the mail-server application.

## Available Workflows

### 1. CI (`ci.yml`)
**Triggers:**
- Push to `main` or `develop`
- Pull Request to `main`

**Actions:**
- Test and build the application
- Build and push Docker image to Docker Hub
- Automatic tags based on branch

### 2. Release (`release.yml`)
**Triggers:**
- GitHub release creation
- Release publication

**Actions:**
- Build and push Docker image with semantic tags to Docker Hub
- Multi-architecture support (linux/amd64, linux/arm64)

## Generated Image Tags

### For releases:
- `v1.0.0` (exact version)
- `v1.0` (major.minor)
- `v1` (major)
- `latest` (if it's the default branch)

### For branches:
- `main` (for main branch)
- `develop` (for develop branch)
- `pr-123` (for pull requests)

## Usage

### To create a release:
1. Create a GitHub release with a semantic tag (e.g., `v1.0.0`)
2. The workflow triggers automatically
3. The image will be available at `your-username/mail-server:v1.0.0`

### To test locally:
```bash
# Pull the image
docker pull your-username/mail-server:latest

# Or for a specific version
docker pull your-username/mail-server:v1.0.0

# Run
docker run -p 1080:1080 -p 1025:1025 your-username/mail-server:latest
```

## Required Configuration

- Create a Docker Hub account if you don't have one
- Add these secrets in GitHub repository settings (Settings → Secrets and variables → Actions):
  - `DOCKER_USERNAME`: Your Docker Hub username
  - `DOCKER_PASSWORD`: Your Docker Hub password or access token (recommended)
