# HiLiving Backend

Java 21 and Spring Boot backend for the HiLiving platform.

## Local startup

Start PostgreSQL from the repository root, load the ignored local environment, and run the backend:

```bash
docker compose up -d --wait postgres
cd backend
set -a
source ../.env
set +a
./mvnw spring-boot:run
```

The committed defaults are PostgreSQL 5432 and Spring Boot 8080. This workstation currently overrides PostgreSQL to 5433 in `.env`; use `SERVER_PORT=18080` when Jenkins occupies 8080.

## Verification

```bash
./mvnw --batch-mode --no-transfer-progress verify
```

GitHub Actions runs the complete backend suite on Temurin Java 21. To run the same Maven and Testcontainers verification locally on Docker Desktop without installing a second JDK, execute this from the repository root:

```bash
docker run --rm \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume "$PWD:/workspace" \
  --workdir /workspace/backend \
  --env TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal \
  eclipse-temurin:21-jdk \
  ./mvnw --batch-mode --no-transfer-progress clean verify
```

## Public catalog API

- `GET /api/v1/categories`
- `GET /api/v1/brands`
- `GET /api/v1/products`
- `GET /api/v1/products/{slug}`

Product listing is zero-based and supports `page`, `size`, `category`, `brand`, `search`, `featured`, and the controlled sort values `newest`, `price_asc`, `price_desc`, and `name_asc`.

Sample catalog data is created only when the `local` profile is active and the catalog is empty.
