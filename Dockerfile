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
    rustup target add x86_64-unknown-linux-musl aarch64-unknown-linux-musl
ENV PATH="/root/.cargo/bin:${PATH}"
COPY packages/server/ .
ARG TARGETPLATFORM
ARG BUILDPLATFORM
RUN if [ "$TARGETPLATFORM" = "linux/amd64" ]; then \
        TARGET=x86_64-unknown-linux-musl; \
    elif [ "$TARGETPLATFORM" = "linux/arm64" ]; then \
        TARGET=aarch64-unknown-linux-musl; \
    else \
        TARGET=x86_64-unknown-linux-musl; \
    fi && \
    mkdir -p /root/.cargo && \
    echo "[target.$TARGET]" > /root/.cargo/config.toml && \
    echo 'linker = "gcc"' >> /root/.cargo/config.toml && \
    cargo build --release --target $TARGET && \
    strip target/$TARGET/release/server && \
    cp target/$TARGET/release/server /app/server-binary

# ---- Runtime stage ultra-minimal ----
FROM scratch
WORKDIR /app
# Copy the binary from the fixed location in builder stage
COPY --from=builder /app/server-binary /app/server
COPY --from=web-builder /web/dist /app/public
ENV STATIC_DIR=/app/public
ENV API_PORT=1080
EXPOSE 1080 1025
CMD ["/app/server"] 