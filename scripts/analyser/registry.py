import os
import sys
import importlib.util
from typing import List, Type
from analyser.base import BaseAnalyser

class AnalyserRegistry:
    _analysers: List[Type[BaseAnalyser]] = []

    @classmethod
    def register(cls, analyser_cls: Type[BaseAnalyser]):
        cls._analysers.append(analyser_cls)
        return analyser_cls

    @classmethod
    def get_all_analysers(cls) -> List[Type[BaseAnalyser]]:
        return cls._analysers

    @classmethod
    def discover_and_load_workers(cls, analyser_root_dir: str):
        cls._analysers.clear()
        for root, _, files in os.walk(analyser_root_dir):
            if "worker.py" in files:
                file_path = os.path.join(root, "worker.py")
                rel_path = os.path.relpath(file_path, analyser_root_dir)
                module_name = "analyser." + rel_path.replace(os.sep, ".").rstrip(".py")

                spec = importlib.util.spec_from_file_location(module_name, file_path)
                if spec and spec.loader:
                    module = importlib.util.module_from_spec(spec)
                    sys.modules[module_name] = module
                    try:
                        spec.loader.exec_module(module)
                    except Exception as e:
                        sys.stderr.write(f"[-] Execution failure during multi-threaded crawling on worker node {file_path}: {e}\n")
