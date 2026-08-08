# Reverse-Engineering Platform

## Purpose

The reverse-engineering factory owns the optional local Neo4j platform used for graph-assisted analysis.

Use it when you want to support `graph-architect-analyst` or jQAssistant/Cypher-driven reverse-engineering workflows.

## Included assets

| File | Purpose |
| :--- | :------ |
| `start-platform-neo4j.sh` | Starts the local Neo4j stack. |
| `docker-compose-neo4j.yml` | Defines the Neo4j container, ports, and volumes. |

## How to start

From `.github/skills/rvng-jqassistant-analysis/optional/docker/` run:

```sh
./start-platform-neo4j.sh
```

Default access:

- URL: `http://localhost:7474`
- User: `neo4j`
- Password: `password`

## How to stop

```sh
docker compose -f ./docker-compose-neo4j.yml down
```

## Notes

- This platform is optional.
- `ai-agent-doc-ops-factory` can consume the analysis results but does not own this platform anymore.
- Review Docker and credential hardening before any non-local usage.
