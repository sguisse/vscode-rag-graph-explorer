# 1. TypeScript

## 1.1 To Finds .ts / .tsx files that have direct incoming and outgoing relationships (DEPENDS_ON, IMPORTS, REQUIRES, USES, CALLS):
```cypher
MATCH (f:File)
WHERE f:TS
   OR f.fileName ENDS WITH '.ts'
   OR f.fileName ENDS WITH '.tsx'
   OR f.absoluteFileName ENDS WITH '.ts'
   OR f.absoluteFileName ENDS WITH '.tsx'

// Pattern comprehensions evaluate to empty lists [] instead of nulls when no matches exist
WITH f,
     [(f)<-[rIn]-(upstream)
       WHERE NOT type(rIn) IN ['CONTAINS', 'DECLARES', 'EXPORTS', 'HAS_SOURCE_FILE', 'WITH_SOURCE', 'ANNOTATED_BY', 'OF_TYPE']
       | {node: upstream, relType: type(rIn)}] AS incomingData,
     [(f)-[rOut]->(downstream)
       WHERE NOT type(rOut) IN ['CONTAINS', 'DECLARES', 'EXPORTS', 'HAS_SOURCE_FILE', 'WITH_SOURCE', 'ANNOTATED_BY', 'OF_TYPE']
       | {node: downstream, relType: type(rOut)}] AS outgoingData

WITH f,
     apoc.coll.toSet([item IN incomingData | item.node]) AS upstreams,
     apoc.coll.toSet([item IN outgoingData | item.node]) AS downstreams,
     apoc.coll.toSet([item IN incomingData | item.relType]) AS incomingRels,
     apoc.coll.toSet([item IN outgoingData | item.relType]) AS outgoingRels

WHERE size(upstreams) > 0 OR size(downstreams) > 0

RETURN coalesce(f.absolute_path, f.absoluteFileName, f.fileName) AS targetPath,
       f.fileName AS fileName,
       size(upstreams) AS upstreamCount,
       size(downstreams) AS downstreamCount,
       incomingRels,
       outgoingRels
ORDER BY (size(upstreams) + size(downstreams)) DESC
LIMIT 10
```

## 1.2  .ts / .tsx files Deep Search (Includes Function & Component Level Dependencies)
Finds TypeScript files where relationships are attached either directly to the file or to its declared/exported functions, components, or classes:
```cypher
MATCH (f:File)
WHERE f:TS
   OR f.fileName ENDS WITH '.ts'
   OR f.fileName ENDS WITH '.tsx'
   OR f.absoluteFileName ENDS WITH '.ts'
   OR f.absoluteFileName ENDS WITH '.tsx'

// 1. Gather declared/exported children
WITH f, [(f)-[:DECLARES|EXPORTS]->(child) | child] AS children
WITH f, [f] + children AS nodesToCheck

// 2. Extract incoming and outgoing non-structural edges for file + children
WITH f, nodesToCheck,
     apoc.coll.flatten([n IN nodesToCheck |
       [(n)-[rOut]->(downstream)
         WHERE NOT downstream IN nodesToCheck
           AND NOT type(rOut) IN ['CONTAINS', 'DECLARES', 'EXPORTS', 'HAS_SOURCE_FILE', 'WITH_SOURCE', 'ANNOTATED_BY', 'OF_TYPE']
         | {node: downstream, relType: type(rOut)}]
     ]) AS outgoingData,
     apoc.coll.flatten([n IN nodesToCheck |
       [(n)<-[rIn]-(upstream)
         WHERE NOT upstream IN nodesToCheck
           AND NOT type(rIn) IN ['CONTAINS', 'DECLARES', 'EXPORTS', 'HAS_SOURCE_FILE', 'WITH_SOURCE', 'ANNOTATED_BY', 'OF_TYPE']
         | {node: upstream, relType: type(rIn)}]
     ]) AS incomingData

// 3. Deduplicate sets
WITH f,
     apoc.coll.toSet([item IN incomingData | item.node]) AS upstreams,
     apoc.coll.toSet([item IN outgoingData | item.node]) AS downstreams,
     apoc.coll.toSet([item IN incomingData | item.relType]) AS incomingRels,
     apoc.coll.toSet([item IN outgoingData | item.relType]) AS outgoingRels

WHERE size(upstreams) > 0 AND size(downstreams) > 0

RETURN coalesce(f.absolute_path, f.absoluteFileName, f.fileName) AS targetPath,
       f.fileName AS fileName,
       size(upstreams) AS upstreamCount,
       size(downstreams) AS downstreamCount,
       incomingRels,
       outgoingRels
ORDER BY (size(upstreams) + size(downstreams)) DESC
LIMIT 10
```

### Why the first request return 68 records and the second 60 ???
The primary reason for the difference in record counts is the **boolean logic operator** used in the filtering condition at the end of each query:

* **Query 1 (`68 records`) uses `OR**`:
`WHERE size(upstreams) > 0 OR size(downstreams) > 0`
This includes "leaf" files (files that import dependencies but are never imported by anything else) and "root entry points" (files that are imported by other files but import nothing themselves).
* **Query 2 (`60 records`) uses `AND**`:
`WHERE size(upstreams) > 0 AND size(downstreams) > 0`
This strictly requires a file (or its declared components/functions) to be an **intermediate node**—meaning it must have *both* at least one incoming dependent and at least one outgoing dependency at the same time.

---

#### Secondary Factor: Intra-File Relationship Exclusions

Query 2 includes an explicit safety check to prevent a file's exported functions from counting as dependencies of the file itself:

* **Query 2**: `WHERE NOT downstream IN nodesToCheck` prevents edges between a parent file and its own declared functions/components (or between two functions inside the same file) from inflating the dependency count.
* **Query 1**: Only inspects edges directly touching `(f:File)`, ignoring relationships attached to internal `:Function` or `:Class` sub-nodes.

If you change Query 1's filter to `WHERE size(upstreams) > 0 AND size(downstreams) > 0`, its count will drop below 60 because it doesn't inspect child function edges.

---
