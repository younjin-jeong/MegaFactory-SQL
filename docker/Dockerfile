# Multi-stage build for MegaFactory-SQL
# Stage 1: Build WASM + server binary
FROM rust:nightly-bookworm AS builder

RUN rustup target add wasm32-unknown-unknown
RUN cargo install cargo-leptos

WORKDIR /app
COPY . .
RUN cargo leptos build --release

# Stage 2: Minimal runtime
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/megafactory-sql-server /usr/local/bin/
COPY --from=builder /app/target/site /app/site
COPY --from=builder /app/js /app/js

WORKDIR /app
ENV MEGAFACTORY_BIND=0.0.0.0:3000
EXPOSE 3000

CMD ["megafactory-sql-server"]
