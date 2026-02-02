# Infrastructure Security: Postgres Memory Layer

## Image Strategy
We use a custom `Dockerfile` based on the official `postgis/postgis:16-3.4` (Debian-based) to install the `postgresql-16-pgvector` extension.

### Rationale
- **Isolation**: Prevents dependency on unofficial/private GHCR images (e.g., `tensorchord/pgvector-postgis` which returned 403 denied).
- **Stability**: Pinning to PostgreSQL 16 and PostGIS 3.4 ensures a consistent environment for vector operations and geospatial data.
- **Auditability**: The build process is transparent and tracked in the repository.

### Vulnerability Management
- Base image should be periodically updated to the latest minor version of `16-3.4`.
- `apt-get clean` and removal of `/var/lib/apt/lists/*` is implemented to minimize attack surface.

## Extensions Lock
- **pgvector**: 0.7.x (via apt package `postgresql-16-pgvector`)
- **postgis**: 3.4.x (via base image)
