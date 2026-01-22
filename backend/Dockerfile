# Build stage
FROM rust:bookworm AS chef
WORKDIR /app
RUN apt-get update && apt-get install -y mold curl tar && rm -rf /var/lib/apt/lists/*
RUN curl -L https://github.com/cargo-bins/cargo-binstall/releases/download/v1.16.7/cargo-binstall-aarch64-unknown-linux-gnu.full.tgz | tar xz -C /usr/local/bin
RUN cargo binstall cargo-chef sccache --no-confirm

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
ENV RUSTC_WRAPPER="sccache"

RUN cargo chef cook --release --recipe-path recipe.json

COPY . .
RUN cargo build --release

# Runtime stage
FROM alpine:3.20

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache ca-certificates

# Copy binary from builder
COPY --from=builder /app/target/release/backend ./backend

# Expose port (Rocket default is 8000)
EXPOSE 8000

# Set environment variables for Rocket
ENV ROCKET_ADDRESS=0.0.0.0
ENV ROCKET_PORT=8000

# Run the binary
CMD ["./backend"]
