## NEO4J Clean ALL
```cypher
// 1. Drop all Schema Constraints & Indexes
CALL apoc.schema.assert({}, {}, true);

// 2. Batched-delete all Nodes and Relationships
CALL apoc.periodic.iterate(
  "MATCH (n) RETURN n",
  "DETACH DELETE n",
  { batchSize: 10000, parallel: false }
);
```

## NEO4J JSON schema call
```cypher
CALL apoc.meta.schema() YIELD value
RETURN value
```

## FIXING NEO4J JSON FORMAT ISSUES
When working with Neo4j, you may encounter issues with JSON formatting, particularly when keys are not properly quoted. This can lead to errors when parsing or processing the JSON data.

* To fix the issue with Neo4j JSON formatting, you can use the following regex pattern to find and replace unquoted keys in your JSON data from vscode editor.
  * In Find : `^(\s*)([a-zA-Z0-9_$]+):`
  * In Replace : `$1"$2":`


:param {
  paths: [
    "/Users/mac-SGUISS21/01-work/01-projects/01-java/china-smart-assessment/smart-assessment-microservices-assessment/src/main/java/com/dkt/smartassessment/assessmentservice/domain/assessment/manager/PdfGeneratedFileManager.java"
  ],
  maxDepthCallees: 3,
  maxDepthCallers: 5,
  targetId: "com.dkt.smartassessment.assessmentservice.domain.assessment.manager.CapBucketManager"
}
