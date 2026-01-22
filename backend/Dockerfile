# Build stage
ARG TARGETARCH
FROM rust:bookworm AS chef
ARG TARGETARCH
ENV TARGETARCH=${TARGETARCH}
WORKDIR /app
RUN apt-get update && apt-get install -y mold curl tar && rm -rf /var/lib/apt/lists/*
RUN echo "TARGETARCH is: ${TARGETARCH}"
RUN if [ "${TARGETARCH}" = "arm64" ]; then \
    curl -L https://github.com/cargo-bins/cargo-binstall/releases/download/v1.16.7/cargo-binstall-aarch64-unknown-linux-gnu.full.tgz | tar xz -C /usr/local/bin; \
    elif [ "${TARGETARCH}" = "amd64" ]; then \
    curl -L https://github.com/cargo-bins/cargo-binstall/releases/download/v1.16.7/cargo-binstall-x86_64-unknown-linux-gnu.full.tgz | tar xz -C /usr/local/bin; \
    else \
    echo "Unsupported TARGETARCH: ${TARGETARCH}"; exit 1; \
    fi
RUN cargo binstall cargo-chef sccache --no-confirm

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder

# sccache environment variables (passed from GitHub Actions)
ARG ACTIONS_CACHE_URL
ARG ACTIONS_RUNTIME_TOKEN
ENV SCCACHE_GHA_ENABLED=on
ENV ACTIONS_CACHE_URL=${ACTIONS_CACHE_URL}
ENV ACTIONS_RUNTIME_TOKEN=${ACTIONS_RUNTIME_TOKEN}
ENV RUSTC_WRAPPER=/root/.cargo/bin/sccache

COPY --from=planner /app/recipe.json recipe.json

# Build dependencies with cargo-chef (cached by sccache)
RUN --mount=type=cache,target=/root/.cache/sccache \
    cargo chef cook --release --recipe-path recipe.json && \
    sccache --show-stats

COPY . .

# Build the application (also cached by sccache)
RUN --mount=type=cache,target=/root/.cache/sccache \
    cargo build --release && \
    sccache --show-stats

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
