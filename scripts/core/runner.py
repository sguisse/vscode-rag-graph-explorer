import os
import sys
import subprocess
import time
import fcntl
import importlib
import site

# Configuration dynamique du chemin vers le module unifié de logs
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
VENDOR_DIR = os.path.join(ROOT_DIR, ".python_packages")

if VENDOR_DIR not in sys.path:
    sys.path.insert(0, VENDOR_DIR)
    site.addsitedir(VENDOR_DIR)

# Importation déterministe après résolution des chemins d'exécution
from utils import debug, info, warn, error, success

def bootstrap():
    try:
        import networkx
        import pandas
    except ImportError:
        lock_file = os.path.join(ROOT_DIR, ".bootstrap.lock")
        try:
            with open(lock_file, 'w') as f:
                # Verrou exclusif non-bloquant pour parer la concurrence multi-processus de VS Code
                fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB)
                warn("Dépendances manquantes. Installation isolée en cours...", component="Bootstrapper")
                os.makedirs(VENDOR_DIR, exist_ok=True)
                try:
                    subprocess.check_call([
                        sys.executable, "-m", "pip", "install",
                        "networkx>=3.1", "pandas>=2.0.0", "tree-sitter-language-pack",
                        "--target", VENDOR_DIR, "--upgrade"
                    ])
                    success("Dépendances installées avec succès.", component="Bootstrapper")

                    # Invalidation impérative des caches d'importation de Python
                    importlib.invalidate_caches()
                except subprocess.CalledProcessError as e:
                    error(f"Échec critique de l'installation: {e}", component="Bootstrapper")
                    sys.exit(1)
                finally:
                    fcntl.flock(f, fcntl.LOCK_UN)
                    try:
                        os.remove(lock_file)
                    except OSError:
                        pass
        except BlockingIOError:
            info("Installation déjà en cours par un autre processus. Attente de libération...", component="Bootstrapper")
            while os.path.exists(lock_file):
                time.sleep(0.5)

            # Invalidation du cache pour le processus spectateur mis en attente
            importlib.invalidate_caches()
            success("Attente terminée. L'environnement isolé est synchronisé.", component="Bootstrapper")

if __name__ == "__main__":
    bootstrap()
    if "--file" in sys.argv:
        import git_delta
        git_delta.main()
    else:
        import main
        main.main()
