import { CodebaseData } from "../../../../../shared/services/graph-rag-explorer";

export const JSON_SCHEMA_SPEC = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "PolyglotDependencyUmlSchema",
  "description": "Structure de données définissant un écosystème polyglotte avec ses relations UML multi-niveaux",
  "type": "object",
  "required": ["files", "dependencies"],
  "properties": {
    "files": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "type", "path", "language"],
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "type": { "type": "string", "enum": ["class", "interface", "component", "module", "config"] },
          "path": { "type": "string" },
          "language": { "type": "string" },
          "size": { "type": "number" },
          "complexity": { "type": "number" },
          "attributes": {
            "type": "array",
            "items": { "type": "object", "properties": { "name": { "type": "string" }, "visibility": { "type": "string" } } }
          },
          "methods": {
            "type": "array",
            "items": { "type": "object", "properties": { "id": { "type": "string" }, "name": { "type": "string" }, "description": { "type": "string" } } }
          },
          "configProperties": {
            "type": "array",
            "items": { "type": "object", "properties": { "key": { "type": "string" }, "value": { "type": "string" } } }
          }
        }
      }
    },
    "dependencies": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "source", "target", "relation"],
        "properties": {
          "id": { "type": "string" },
          "source": { "type": "string" },
          "target": { "type": "string" },
          "relation": { "type": "string" },
          "label": { "type": "string" }
        }
      }
    }
  }
};

export const initialCodebase: CodebaseData = {
  files: [
    {
      id: 'OrderButton.tsx', name: 'OrderButton.tsx', type: 'component', path: 'frontend/components/OrderButton.tsx', language: 'TypeScript (React)', size: 145, complexity: 4,
      attributes: [{ name: 'disabled: boolean', visibility: 'private' }, { name: 'cartTotal: number', visibility: 'public' }],
      methods: [{ id: 'onClick', name: 'onClick()', description: "Intercepts UI click events and triggers API client methods sequentially." }, { id: 'render', name: 'render()', description: "Computes component visual tree using current reactive hook updates." }]
    },
    {
      id: 'orderApi.ts', name: 'orderApi.ts', type: 'module', path: 'frontend/services/orderApi.ts', language: 'TypeScript', size: 90, complexity: 2,
      attributes: [{ name: 'BASE_URL: string', visibility: 'private' }],
      methods: [{ id: 'placeOrder', name: 'placeOrder(items)', description: "Assembles fetch payloads and opens connections to backend proxy controller mapping paths." }]
    },
    {
      id: 'OrderController.java', name: 'OrderController.java', type: 'class', path: 'backend/controllers/OrderController.java', language: 'Java', size: 210, complexity: 5,
      attributes: [{ name: 'orderRepo: OrderRepository', visibility: 'private' }],
      methods: [{ id: 'createOrder', name: 'createOrder(dto)', description: "Deserializes data context structures, verifies authentication parameters, and applies updates." }]
    },
    {
      id: 'Order.java', name: 'Order.java', type: 'class', path: 'backend/models/Order.java', language: 'Java', size: 320, complexity: 9,
      attributes: [{ name: 'id: UUID', visibility: 'private' }, { name: 'items: List<Item>', visibility: 'private' }, { name: 'totalPrice: BigDecimal', visibility: 'private' }],
      methods: [{ id: 'addItem', name: 'addItem(item)', description: "Appends target item structures onto internal sequence and forces sum evaluation." }, { id: 'calculateTotal', name: 'calculateTotal()', description: "Processes array streams using precise bigdecimal scale resolution configurations." }]
    },
    {
      id: 'OrderRepository.java', name: 'OrderRepository.java', type: 'interface', path: 'backend/repositories/OrderRepository.java', language: 'Java', size: 55, complexity: 1,
      attributes: [], methods: [{ id: 'save', name: 'save(order)', description: "Declarative persistence specifications handled via ORM schema configurations." }]
    },
    {
      id: 'JpaOrderRepository.java', name: 'JpaOrderRepository.java', type: 'class', path: 'backend/repositories/JpaOrderRepository.java', language: 'Java', size: 130, complexity: 3,
      attributes: [{ name: 'entityManager: EntityManager', visibility: 'private' }],
      methods: [{ id: 'save', name: 'save(order)', description: "Resolves transaction states and commits object properties directly down to database stacks." }]
    },
    {
      id: 'application.yml', name: 'application.yml', type: 'config', path: 'config/application.yml', language: 'YAML', size: 40, complexity: 1,
      configProperties: [{ key: 'spring.datasource.url', value: 'jdbc:postgresql://localhost:5432/orders_db' }, { key: 'spring.datasource.username', value: 'db_admin_prod' }, { key: 'spring.jpa.show-sql', value: 'true' }]
    }
  ],
  dependencies: [
    { id: 'e-button-api', sourceNode: 'OrderButton.tsx', sourceHandle: 'onClick', targetNode: 'orderApi.ts', targetHandle: 'placeOrder', relation: 'dependency', label: 'Imports & Calls' },
    { id: 'e-api-controller', sourceNode: 'orderApi.ts', sourceHandle: 'placeOrder', targetNode: 'OrderController.java', targetHandle: 'createOrder', relation: 'association', label: 'HTTP POST' },
    { id: 'e-controller-domain', sourceNode: 'OrderController.java', sourceHandle: 'createOrder', targetNode: 'Order.java', targetHandle: 'addItem', relation: 'aggregation', label: 'Invokes' },
    { id: 'e-controller-repo', sourceNode: 'OrderController.java', sourceHandle: 'createOrder', targetNode: 'OrderRepository.java', targetHandle: 'save', relation: 'association', label: 'Uses' },
    { id: 'e-repo-impl', sourceNode: 'JpaOrderRepository.java', sourceHandle: 'header', targetNode: 'OrderRepository.java', targetHandle: 'header', relation: 'implementation', label: 'Implements' },
    { id: 'e-jpa-repo-config', sourceNode: 'JpaOrderRepository.java', sourceHandle: 'save', targetNode: 'application.yml', targetHandle: 'spring.datasource.url', relation: 'dependency', label: 'Reads DB Config' }
  ]
};

export const FOLDER_POSITIONS: Record<string, { label: string }> = {
  'frontend': { label: '📂 Client Frontend (TSX/TS)' },
  'backend': { label: '📂 API Backend (Spring Boot / Java)' },
  'config': { label: '⚙️ Configurations d\'Écosystème' }
};
