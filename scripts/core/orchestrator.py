import os
import re
import concurrent.futures
from typing import List, Dict
from graph_engine import GraphEngine
from utils import debug, info, warn, error, success

def parse_java_file(file_path: str) -> Dict[str, any]:
    entities, relations = [], []
    base_name = os.path.basename(file_path)
    file_id = file_path.replace("\\", "/")
    entities.append({"id": file_id, "label": base_name, "group": "file"})
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        class_match = re.search(r'(?:class|interface|enum)\s+([a-zA-Z0-9_]+)', content)
        if class_match:
            class_name = class_match.group(1)
            class_id = f"{file_id}::{class_name}"
            entities.append({"id": class_id, "label": class_name, "group": "class"})
            relations.append({"source": file_id, "target": class_id, "type": "contains"})
            if "@Autowired" in content or "@Inject" in content:
                fields = re.findall(r'(?:private|protected)\s+([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_]+);', content)
                for field_type, field_name in fields:
                    relations.append({"source": class_id, "target": f"virtual::{field_type}", "type": "INJECTS"})
            methods = re.findall(r'(@[a-zA-Z]+Mapping\([^)]*\))?\s*(?:public|private|protected)?\s+[a-zA-Z0-9_<>\s]+\s+([a-zA-Z0-9_]+)\s*\([^)]*\)', content)
            for annotation, method_name in methods:
                if method_name and method_name not in ["if", "for", "while", "switch", "catch"]:
                    method_id = f"{class_id}::{method_name}()"
                    label = f"{annotation} {method_name}()" if annotation else f"{method_name}()"
                    entities.append({"id": method_id, "label": label, "group": "method"})
                    relations.append({"source": class_id, "target": method_id, "type": "contains"})
    except Exception as e:
        warn(f"Échec de l'analyse syntaxique Java sur {base_name}:", e, component="Orchestrator")
    return {"entities": entities, "relations": relations}

def parse_ts_file(file_path: str) -> Dict[str, any]:
    entities, relations = [], []
    base_name = os.path.basename(file_path)
    file_id = file_path.replace("\\", "/")
    entities.append({"id": file_id, "label": base_name, "group": "file"})
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        imports = re.findall(r'import\s+.*\s+from\s+[\'"]([^\'\"]+)[\'"]', content)
        for imp in imports:
            relations.append({"source": file_id, "target": f"resolved::{imp}", "type": "imports"})
        functions = re.findall(r'(?:export\s+)?(?:const|function)\s+([a-zA-Z0-9_]+)\s*(?:=\s*\([^)]*\)\s*=>|\([^)]*\))', content)
        for func in functions:
            func_id = f"{file_id}::{func}"
            entities.append({"id": func_id, "label": func, "group": "method"})
            relations.append({"source": file_id, "target": func_id, "type": "contains"})
    except Exception as e:
        warn(f"Échec de l'analyse syntaxique TS sur {base_name}:", e, component="Orchestrator")
    return {"entities": entities, "relations": relations}

def parse_py_file(file_path: str) -> Dict[str, any]:
    entities, relations = [], []
    base_name = os.path.basename(file_path)
    file_id = file_path.replace("\\", "/")
    entities.append({"id": file_id, "label": base_name, "group": "file"})
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        classes = re.findall(r'class\s+([a-zA-Z0-9_]+)', content)
        for cls in classes:
            class_id = f"{file_id}::{cls}"
            entities.append({"id": class_id, "label": cls, "group": "class"})
            relations.append({"source": file_id, "target": class_id, "type": "contains"})
        functions = re.findall(r'def\s+([a-zA-Z0-9_]+)\s*\([^)]*\)', content)
        for func in functions:
            func_id = f"{file_id}::{func}"
            entities.append({"id": func_id, "label": f"{func}()", "group": "method"})
            relations.append({"source": file_id, "target": func_id, "type": "contains"})
    except Exception as e:
        warn(f"Échec de l'analyse syntaxique Python sur {base_name}:", e, component="Orchestrator")
    return {"entities": entities, "relations": relations}

class ParallelOrchestrator:
    def __init__(self, graph_engine: GraphEngine):
        self.graph_engine = graph_engine

    def execute_analysis_pool(self, partitions: Dict[str, List[str]]):
        info("Initialisation du pool d'exécution concurrent ProcessPoolExecutor.", component="Orchestrator")
        tasks = []
        with concurrent.futures.ProcessPoolExecutor() as executor:
            for file_path in partitions.get("JAVA", []): tasks.append(executor.submit(parse_java_file, file_path))
            for file_path in partitions.get("TS_JS", []): tasks.append(executor.submit(parse_ts_file, file_path))
            for file_path in partitions.get("PYTHON", []): tasks.append(executor.submit(parse_py_file, file_path))
            info(f"Pool démarré : {len(tasks)} fichiers soumis à l'analyse.", component="Orchestrator")
            processed_count = 0
            for future in concurrent.futures.as_completed(tasks):
                res = future.result()
                processed_count += 1
                for ent in res["entities"]:
                    self.graph_engine.add_entity(ent["id"], ent["label"], ent["group"], ent["id"].split("::")[0])
                for rel in res["relations"]:
                    self.graph_engine.add_relation(rel["source"], rel["target"], rel["type"])
                if processed_count % 10 == 0 or processed_count == len(tasks):
                    info(f"Progression de l'analyse parallèle : {processed_count}/{len(tasks)}", component="Orchestrator")
        success("Extraction syntaxique multi-langages terminée.", component="Orchestrator")
