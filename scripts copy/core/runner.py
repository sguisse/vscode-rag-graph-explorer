import os
import sys
import subprocess
import time
import errno
import importlib
import site

try:
    import fcntl
except ImportError:
    fcntl = None

try:
    import msvcrt
except ImportError:
    msvcrt = None

# Configuration dynamique du chemin vers le module unifié de logs
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
VENDOR_DIR = os.path.join(ROOT_DIR, ".python_packages")
PYTHON_DEPENDENCIES = (
    ("networkx", "networkx>=3.1"),
    ("pandas", "pandas>=2.0.0"),
    ("tree_sitter_language_pack", "tree-sitter-language-pack"),
)

def ensure_vendor_path():
    if VENDOR_DIR not in sys.path:
        sys.path.insert(0, VENDOR_DIR)
    site.addsitedir(VENDOR_DIR)


def verify_python_dependencies():
    ensure_vendor_path()
    importlib.invalidate_caches()
    for module_name, _ in PYTHON_DEPENDENCIES:
        importlib.import_module(module_name)


ensure_vendor_path()

# Importation déterministe après résolution des chemins d'exécution
from utils import debug, info, warn, error, success


class FileLockUnavailable(Exception):
    pass


def acquire_file_lock(handle):
    if fcntl is not None:
        try:
            fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError as exc:
            if exc.errno in (errno.EACCES, errno.EAGAIN):
                raise FileLockUnavailable from exc
            raise
        return

    if msvcrt is not None:
        try:
            handle.seek(0, os.SEEK_END)
            if handle.tell() == 0:
                handle.write("0")
                handle.flush()
            handle.seek(0)
            msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
        except OSError as exc:
            raise FileLockUnavailable from exc
        return

    raise RuntimeError("No supported file locking module found.")


def release_file_lock(handle):
    if fcntl is not None:
        fcntl.flock(handle, fcntl.LOCK_UN)
        return

    if msvcrt is not None:
        handle.seek(0)
        msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
        return

    raise RuntimeError("No supported file locking module found.")


def bootstrap():
    try:
        verify_python_dependencies()
    except ImportError:
        lock_file = os.path.join(ROOT_DIR, ".bootstrap.lock")
        try:
            with open(lock_file, 'a+') as f:
                # Verrou exclusif non-bloquant pour parer la concurrence multi-processus de VS Code
                acquire_file_lock(f)
                warn("Dépendances manquantes. Installation isolée en cours...", component="Bootstrapper")
                os.makedirs(VENDOR_DIR, exist_ok=True)
                try:
                    subprocess.check_call([
                        sys.executable, "-m", "pip", "install",
                        *[dependency_spec for _, dependency_spec in PYTHON_DEPENDENCIES],
                        "--target", VENDOR_DIR, "--upgrade"
                    ])
                    verify_python_dependencies()
                    success("Dépendances installées avec succès.", component="Bootstrapper")
                except subprocess.CalledProcessError as e:
                    error(f"Échec critique de l'installation: {e}", component="Bootstrapper")
                    sys.exit(1)
                except ImportError as e:
                    error(f"Dépendances installées mais indisponibles: {e}", component="Bootstrapper")
                    sys.exit(1)
                finally:
                    release_file_lock(f)
                    try:
                        os.remove(lock_file)
                    except OSError:
                        pass
        except FileLockUnavailable:
            info("Installation déjà en cours par un autre processus. Attente de libération...", component="Bootstrapper")
            while os.path.exists(lock_file):
                time.sleep(0.5)

            # Invalidation du cache pour le processus spectateur mis en attente
            try:
                verify_python_dependencies()
            except ImportError as e:
                error(f"Dépendances indisponibles après attente: {e}", component="Bootstrapper")
                sys.exit(1)
            success("Attente terminée. L'environnement isolé est synchronisé.", component="Bootstrapper")

if __name__ == "__main__":
    bootstrap()
    if "--file" in sys.argv:
        import git_delta
        git_delta.main()
    else:
        import main
        main.main()
