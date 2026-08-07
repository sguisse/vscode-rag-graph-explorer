// ==============================================================================
// CYPHER QUERY: APIS ENDPOINT ALIGNMENT STITCHER
// ==============================================================================
MATCH (fe:Method) WHERE fe.apiCallUrl IS NOT NULL
MATCH (be:Method) WHERE be.springRoute IS NOT NULL
WITH fe, be,
     apoc.text.replace(fe.apiCallUrl, '\/:[a-zA-Z0-9_]+', '/{}') AS feNorm,
     apoc.text.replace(be.springRoute, '\/\{[a-zA-Z0-9_]+\}', '/{}') AS beNorm
WHERE feNorm = beNorm
MERGE (fe)-[r:CALLS_API]->(be)
RETURN count(r) as StitchedLinksCount;
