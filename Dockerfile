# ---- Build frontend ----
FROM oven/bun:1.0 AS web-builder
WORKDIR /web
COPY bun.lock ./packages/web/
COPY packages/web/ .
RUN bun install
RUN bun run build

# ---- Build backend ----
FROM alpine:3.19 AS builder
WORKDIR /app
RUN apk add --no-cache build-base openssl-dev sqlite-dev curl musl-dev gcc && \
    curl https://sh.rustup.rs -sSf | sh -s -- -y --default-toolchain nightly --profile minimal && \
    . "$HOME/.cargo/env" && \
    rustup target add x86_64-unknown-linux-musl
ENV PATH="/root/.cargo/bin:${PATH}"
COPY packages/server/ .
RUN mkdir -p /root/.cargo && \
    echo '[target.x86_64-unknown-linux-musl]' >> /root/.cargo/config.toml && \
    echo 'linker = "gcc"' >> /root/.cargo/config.toml && \
    CC_x86_64_unknown_linux_musl=gcc \
    cargo build --release --target x86_64-unknown-linux-musl && \
    strip target/x86_64-unknown-linux-musl/release/server

# ---- Runtime stage ultra-minimal ----
FROM scratch
WORKDIR /app
COPY --from=builder /app/target/x86_64-unknown-linux-musl/release/server /app/server
COPY --from=web-builder /web/dist /app/public
ENV STATIC_DIR=/app/public
ENV API_PORT=1080
EXPOSE 1080 1025
CMD ["/app/server"] 