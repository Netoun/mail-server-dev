# ---- Build frontend ----
FROM oven/bun:1.3 AS web-builder
WORKDIR /app

# Copy all package.json files from workspace packages (required for frozen lockfile)
COPY packages/web/ ./packages/web/
COPY packages/server/package.json ./packages/server/
COPY packages/react-email/package.json ./packages/react-email/

# Copy workspace files for dependency resolution
COPY bun.lock package.json ./

# Install dependencies (cached unless package files change)
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Copy source code (invalidates cache when source changes)

# Build
WORKDIR /app/packages/web
RUN bun run build

# ---- Build backend ----
FROM alpine:3.19 AS builder
WORKDIR /app

# Install system dependencies (cached unless dependencies change)
RUN apk add --no-cache build-base openssl-dev sqlite-dev curl musl-dev gcc

# Install Rust (cached unless Rust version changes)
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y --default-toolchain nightly --profile minimal
ENV PATH="/root/.cargo/bin:${PATH}"
RUN rustup target add x86_64-unknown-linux-musl aarch64-unknown-linux-musl

# Setup Cargo config (cached)
RUN mkdir -p /root/.cargo && \
    echo '[target.x86_64-unknown-linux-musl]' > /root/.cargo/config.toml && \
    echo 'linker = "gcc"' >> /root/.cargo/config.toml && \
    echo '[target.aarch64-unknown-linux-musl]' >> /root/.cargo/config.toml && \
    echo 'linker = "gcc"' >> /root/.cargo/config.toml

# Copy dependency files first for better caching
COPY packages/server/Cargo.toml packages/server/Cargo.lock* ./

# Copy source code
COPY packages/server/src ./src

# Build with BuildKit cache mount for Cargo dependencies
ARG TARGETPLATFORM
ARG BUILDPLATFORM
RUN --mount=type=cache,target=/root/.cargo/registry \
    --mount=type=cache,target=/root/.cargo/git \
    --mount=type=cache,target=/app/target \
    if [ "$TARGETPLATFORM" = "linux/amd64" ]; then \
        TARGET=x86_64-unknown-linux-musl; \
    elif [ "$TARGETPLATFORM" = "linux/arm64" ]; then \
        TARGET=aarch64-unknown-linux-musl; \
    else \
        TARGET=x86_64-unknown-linux-musl; \
    fi && \
    cargo build --release --target $TARGET && \
    strip target/$TARGET/release/server && \
    cp target/$TARGET/release/server /app/server-binary

# ---- Runtime stage ultra-minimal ----
FROM scratch
WORKDIR /app
# Copy the binary from the fixed location in builder stage
COPY --from=builder /app/server-binary /app/server
COPY --from=web-builder /app/packages/web/dist /app/public
ENV STATIC_DIR=/app/public
ENV API_PORT=1080
EXPOSE 1080 1025
CMD ["/app/server"] 