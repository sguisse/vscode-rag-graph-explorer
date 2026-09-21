#!/bin/bash
set -euo pipefail

PROJECT_PATH=/Users/mac-SGUISS21/90-temp/bom-manager
java -jar target/ai-architecture-auditor-1.0.0-SNAPSHOT.jar "$PROJECT_PATH" --fail-on=CRITICAL
