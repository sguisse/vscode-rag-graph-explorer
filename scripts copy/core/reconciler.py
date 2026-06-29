import re
from graph_engine import GraphEngine
from utils import debug, info, warn, error, success

class PolyglotReconciler:
    @staticmethod
    def reconcile_api_routes(graph_engine: GraphEngine):
        info("Analyse de réconciliation des points de contact d'API (Cross-Language Bridging)...", component="Reconciler")
        nodes = list(graph_engine.graph.nodes(data=True))
        backend_endpoints, frontend_calls = [], []

        for node_id, data in nodes:
            group, label = data.get("group", ""), data.get("label", "")
            if group == "method" and ("@GetMapping" in label or "@PostMapping" in label or "@RequestMapping" in label):
                route_match = re.search(r'\"([^\"]+)\"', label)
                if route_match:
                    backend_endpoints.append((node_id, route_match.group(1)))
                    debug(f"Endpoint Backend localisé : Nœud [{node_id}] -> Route: '{route_match.group(1)}'", component="Reconciler")
            elif group == "method" or group == "file":
                if "fetch(" in label or "http.get" in label or "axios." in label:
                    route_match = re.search(r'\'([^\']+)\'|\"([^\"]+)\"', label)
                    if route_match:
                        clean_route = route_match.group(1) or route_match.group(2)
                        if clean_route and clean_route.startswith("/"):
                            frontend_calls.append((node_id, clean_route))
                            debug(f"Requête Frontend localisée : Nœud [{node_id}] -> Target: '{clean_route}'", component="Reconciler")

        info(f"Mise en correspondance matricielle : {len(frontend_calls)} front-calls vs {len(backend_endpoints)} back-endpoints.", component="Reconciler")
        reconciled_links = 0
        for fe_node, fe_route in frontend_calls:
            fe_norm = re.sub(r'\/:[a-zA-Z0-9_]+', '/{}', fe_route)
            for be_node, be_route in backend_endpoints:
                be_norm = re.sub(r'\/\{[a-zA-Z0-9_]+\}', '/{}', be_route)
                if fe_norm == be_norm or fe_route in be_route:
                    graph_engine.add_relation(fe_node, be_node, "CALLS_API")
                    reconciled_links += 1
                    success(f"API LINK STITCHED : [{fe_node}] --(CALLS_API)--> [{be_node}]", component="Reconciler")
        info(f"Phase de réconciliation terminée. {reconciled_links} arc(s) cross-language injecté(s).", component="Reconciler")
