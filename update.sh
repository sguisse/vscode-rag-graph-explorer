#!/usr/bin/env bash
set -e

npx skills add pluginagentmarketplace/custom-plugin-java@java-spring-boot -y
npx skills add jabrena/plinth@314-frameworks-spring-kafka -y
npx skills add georgekhananaev/claude-skills-vault@system-architect -y
npx skills add amritmalla/claude-full-stack-2.0@spring-boot-performance-and-resilience -y

echo "✅ Successfully written shared models, backend mapper, and webview component."
