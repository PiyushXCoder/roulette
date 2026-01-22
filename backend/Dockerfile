# Build stage
ARG TARGETARCH
FROM rust:bookworm AS chef
ARG TARGETARCH
ENV TARGETARCH=${TARGETARCH}
WORKDIR /app
RUN apt-get update && apt-get install -y mold curl tar && rm -rf /var/lib/apt/lists/*
RUN echo "TARGETARCH is: ${TARGETARCH}"
# Install cargo-binstall and sccache
RUN if [ "${TARGETARCH}" = "arm64" ]; then \
    curl -L https://github.com/cargo-bins/cargo-binstall/releases/download/v1.16.7/cargo-binstall-aarch64-unknown-linux-gnu.full.tgz | tar xz -C /usr/local/bin && \
    curl -L https://github.com/mozilla/sccache/releases/download/v0.10.0/sccache-v0.10.0-aarch64-unknown-linux-musl.tar.gz | tar xz -C /tmp && \
    mv /tmp/sccache-v0.10.0-aarch64-unknown-linux-musl/sccache /usr/local/bin/; \
    elif [ "${TARGETARCH}" = "amd64" ]; then \
    curl -L https://github.com/cargo-bins/cargo-binstall/releases/download/v1.16.7/cargo-binstall-x86_64-unknown-linux-gnu.full.tgz | tar xz -C /usr/local/bin && \
    curl -L https://github.com/mozilla/sccache/releases/download/v0.10.0/sccache-v0.10.0-x86_64-unknown-linux-musl.tar.gz | tar xz -C /tmp && \
    mv /tmp/sccache-v0.10.0-x86_64-unknown-linux-musl/sccache /usr/local/bin/; \
    else \
    echo "Unsupported TARGETARCH: ${TARGETARCH}"; exit 1; \
    fi
RUN cargo binstall cargo-chef --no-confirm

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder

# Use mold linker for faster linking
ENV RUSTFLAGS="-C link-arg=-fuse-ld=mold"

COPY --from=planner /app/recipe.json recipe.json

# Build dependencies with cargo-chef (uses local sccache cache)
RUN --mount=type=cache,target=/root/.cache/sccache \
    --mount=type=cache,target=/root/.cargo/registry \
    --mount=type=cache,target=/root/.cargo/git \
    --mount=type=secret,id=ACTIONS_CACHE_URL \
    --mount=type=secret,id=ACTIONS_RUNTIME_TOKEN \
    export ACTIONS_CACHE_URL=$(cat /run/secrets/ACTIONS_CACHE_URL 2>/dev/null || echo "") && \
    export ACTIONS_RUNTIME_TOKEN=$(cat /run/secrets/ACTIONS_RUNTIME_TOKEN 2>/dev/null || echo "") && \
    if [ -n "$ACTIONS_CACHE_URL" ]; then \
        export SCCACHE_GHA_ENABLED=on RUSTC_WRAPPER=sccache; \
    fi && \
    cargo chef cook --release --recipe-path recipe.json && \
    (sccache --show-stats 2>/dev/null || true)

COPY . .

# Build the application
RUN --mount=type=cache,target=/root/.cache/sccache \
    --mount=type=cache,target=/root/.cargo/registry \
    --mount=type=cache,target=/root/.cargo/git \
    --mount=type=secret,id=ACTIONS_CACHE_URL \
    --mount=type=secret,id=ACTIONS_RUNTIME_TOKEN \
    export ACTIONS_CACHE_URL=$(cat /run/secrets/ACTIONS_CACHE_URL 2>/dev/null || echo "") && \
    export ACTIONS_RUNTIME_TOKEN=$(cat /run/secrets/ACTIONS_RUNTIME_TOKEN 2>/dev/null || echo "") && \
    if [ -n "$ACTIONS_CACHE_URL" ]; then \
        export SCCACHE_GHA_ENABLED=on RUSTC_WRAPPER=sccache; \
    fi && \
    cargo build --release && \
    (sccache --show-stats 2>/dev/null || true)

# Runtime stage
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy binary from builder
COPY --from=builder /app/target/release/backend ./backend

# Expose port (Rocket default is 8000)
EXPOSE 8000

# Set environment variables for Rocket
ENV ROCKET_ADDRESS=0.0.0.0
ENV ROCKET_PORT=8000

# Run the binary
CMD ["./backend"]
