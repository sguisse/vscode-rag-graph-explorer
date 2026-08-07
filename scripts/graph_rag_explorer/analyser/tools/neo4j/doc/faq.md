## ❓ To answer this question: "Which business components and tests are impacted by removing a 'timeout' property" ?
You must write a Cypher query that traverses the concepts you have just defined in your XML file.
```
// 1. Identify the field injected by Spring that listens to the target property
MATCH (configClass:Class)-[:DECLARES]->(propField:Field)
WHERE propField.usesProperty CONTAINS 'timeout'

// 2. Find the business components that depend on this class
//(The *0..2 allows you to search for the class itself, or the classes that call it indirectly)
MATCH (businessClass:Class)-[:DEPENDS_ON*0..2]->(configClass)

// Filter to keep only the "Business" concepts defined in your rules
WHERE businessClass:Service
   OR businessClass:UseCaseService
   OR businessClass:DomainObject
   OR businessClass:Adapter

// 3. Retrieve the tests that target these impacted business components
OPTIONAL MATCH (testClass:Class)-[:TESTS]->(businessClass)

// 4. Aggregate and display the result clearly
RETURN propField.usesProperty AS RemovedProperty,
       businessClass.name AS ImpactedBusinessComponent,
       labels(businessClass) AS ArchitectureTags,
       collect(DISTINCT testClass.name) AS TestsToUpdate
ORDER BY ImpactedBusinessComponent

```
### Decryption of how the query works
This query directly uses the semantic enrichment that you have configured:
 * **The entry point**(`propField.usesProperty`): We use the property extracted by your rule `LinkSpringValueProperties`. This allows you to directly target the raw configuration key (eg: `my.api.timeout`).
 * **The propagation of the impact**(`[:DEPENDS_ON]`): Neo4j (the engine under jQAssistant) will go through the graph to find all the classes which invoke or depend on the class having the @Value deleted.
 * **Semantic filtering**(`WHERE businessClass:Service...`): Instead of retrieving hundreds of impacted technical classes, we use your tags (like `MarkSpringService` or `MarkServiceAsUseCases`) to isolate only the "Business" layer that interests us.
 * **The link with the tests**(`[:TESTS]`): Thanks to your `LinkTestsToCode` rule, the `OPTIONAL MATCH` clause will automatically link the production component in danger to its test classes (Unit or Integration) which are likely to fail. Using `OPTIONAL` ensures that if a component does not have a test, it will still appear in the results (with an empty test list).
