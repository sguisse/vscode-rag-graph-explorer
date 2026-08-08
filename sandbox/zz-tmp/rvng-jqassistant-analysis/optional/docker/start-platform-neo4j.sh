#!/bin/bash

# ANSI color codes
RESET="\033[0m"
BLUE="\033[34m"
GREEN="\033[32m"
RED="\033[31m"
YELLOW="\033[33m"
MAGENTA="\033[35m"

export NEO4J_PORT=7474
export NEO4J_BOLT_PORT=7687
export NEO4J_USER=neo4j
export NEO4J_PASSWORD=password

docker network create ai-agents-rev-eng-network

echo "🚀 Starting Reverse-Engineering Neo4j Platform..."
docker compose -f docker-compose-neo4j.yml up -d

echo "⏳ Waiting for Neo4j to be ready..."
until curl -s http://localhost:$NEO4J_PORT > /dev/null; do
  sleep 2
  echo "..."
done

echo ""
echo "--> Recent logs (last 50 lines) for configured containers:"
printf "%b%s%b\n" "$MAGENTA" "------------------------------------------------------------------------------------------------------" "$RESET"
printf "%b%s%b\n" "$BLUE" "--- ctn-ai-agent-rev-eng-neo4j ---" "$RESET"
printf "%b%s%b\n" "$MAGENTA" "------------------------------------------------------------------------------------------------------" "$RESET"
docker logs ctn-ai-agent-rev-eng-neo4j --tail 50 || true

echo "|"
echo "|"
echo "--> If a container is not healthy yet, check full logs with 'docker logs <container-name> --follow'"
echo "|"
echo "|"

printf "%b%s%b\n" "$YELLOW" "------------------------------------------------------------------------------------------------------" "$RESET"
printf "%b%s%b %b%s%b  %b(%s / %s)%b\n" "$RESET" "--> You can access Neo4j Browser :" "$RESET" "$BLUE" "http://localhost:$NEO4J_PORT" "$RESET" "$RED" "$NEO4J_USER" "$NEO4J_PASSWORD" "$RESET"
printf "%b%s%b\n" "$YELLOW" "------------------------------------------------------------------------------------------------------" "$RESET"

echo "✅ Platform is ready!"
