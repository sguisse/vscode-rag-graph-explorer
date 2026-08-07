// ==============================================================================
// CYPHER QUERY: JACOCO METRICS COVERAGE RADIAL GAP DISCOVERY
// ==============================================================================
MATCH (f:File) WHERE f.path CONTAINS $target_file
MATCH path = (impacted:Method)-[:INVOKES|CALLS_API*..3]->(m:Method)<-[:DECLARES*..2]-(f)
WHERE impacted.coveredInstructions = 0 AND impacted.missedInstructions > 0
RETURN impacted.name AS UncoveredTargetMethod,
       impacted.missedInstructions AS MissingInstructionCount,
       labels(impacted) as ClassContext
ORDER BY MissingInstructionCount DESC;
