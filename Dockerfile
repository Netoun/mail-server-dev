# ---- Build frontend ----
FROM oven/bun:1.0 as web-builder
WORKDIR /web
COPY packages/web/ .
RUN bun install && bun run build

# ---- Build backend ----
FROM alpine:3.19 as builder
WORKDIR /app
RUN apk add --no-cache build-base openssl-dev sqlite-dev curl && \
    curl https://sh.rustup.rs -sSf | sh -s -- -y --default-toolchain nightly --profile minimal && \
    . "$HOME/.cargo/env" && \
    rustup target add x86_64-unknown-linux-musl
ENV PATH="/root/.cargo/bin:${PATH}"
COPY packages/server/ .
RUN cargo build --release --target x86_64-unknown-linux-musl && \
    strip target/x86_64-unknown-linux-musl/release/server

# ---- Runtime stage ultra-minimal ----
FROM scratch
WORKDIR /app
COPY --from=builder /app/target/x86_64-unknown-linux-musl/release/server /app/server
COPY --from=web-builder /web/dist /app/public
ENV STATIC_DIR=/app/public
EXPOSE 1080 1025
CMD ["/app/server"] 