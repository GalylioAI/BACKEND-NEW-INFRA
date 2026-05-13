# Deployment Guide

Use `docs/1111_PRODUCTION_DEPLOYMENT.md` for the production VPS deployment.

Production public traffic must enter through Nginx only:

- Frontend: `https://1111.tn`
- Backend gateway: `https://backend.1111.tn`
- Frontend upstream: `127.0.0.1:3000`
- Backend gateway upstream: `127.0.0.1:8080`
- Internal Go services, PostgreSQL, Redis, RabbitMQ, and PgBouncer: localhost or Docker/private networks only

Do not bind the backend gateway or internal service ports to public interfaces in production. Do not use wildcard CORS. The production CORS origin is exactly `https://1111.tn`.

The full deployment runbook covers Ubuntu package installation, deploy user setup, Docker, host PostgreSQL/Redis/RabbitMQ/PgBouncer scripts, secret materialization, Nginx, Certbot, GitHub Actions, validation commands, rollback, and the required browser credentialed refresh test.
