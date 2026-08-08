import os
import sys
from datetime import datetime

def _configure_console_stream(stream):
    if hasattr(stream, "reconfigure"):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

for _stream in (sys.stdout, sys.stderr):
    _configure_console_stream(_stream)

# Variables d'état globales pour la redirection et la rotation
LOG_ENABLED = True
MAX_SIZE_MB = 5
MAX_RETENTION = 5
WORKSPACE_ROOT = None
CURRENT_FILE_INDEX = 1

def configure_logger(workspace_root: str, enabled: bool, max_size: int, retention: int):
    """
    Configure dynamiquement les paramètres de persistance des logs.
    Scanne le disque pour reprendre sur le fichier actif existant.
    """
    global LOG_ENABLED, MAX_SIZE_MB, MAX_RETENTION, WORKSPACE_ROOT, CURRENT_FILE_INDEX
    WORKSPACE_ROOT = workspace_root
    LOG_ENABLED = enabled
    MAX_SIZE_MB = max_size
    MAX_RETENTION = retention

    if LOG_ENABLED and WORKSPACE_ROOT:
        logs_dir = os.path.join(WORKSPACE_ROOT, ".graph-rag-explorer", "logs")
        os.makedirs(logs_dir, exist_ok=True)

        # Identification de l'index actif existant sur le disque
        active_idx = 1
        for i in range(1, 100):
            if os.path.exists(os.path.join(logs_dir, f"graph-rag-explorer-{i:02d}.log")):
                active_idx = i
        CURRENT_FILE_INDEX = active_idx

def _log(level: str, component: str, message: str, flush: bool = True):
    """
    Méthode interne de formatage avec patron d'horodatage YYYY/MM/DD-HH-mm-ss-sss
    Gère la redirection concurrente sécurisée et la rotation cyclique de 01 à 99.
    """
    global CURRENT_FILE_INDEX

    # Génération du format strict demandé : YYYY/MM/DD-HH-mm-ss-sss
    now = datetime.now()
    timestamp = now.strftime("%Y/%m/%d-%H:%M:%S.%f")[:-3]
    full_message = f"[{timestamp}] {level} [{component}] {message}"

    # Émission immédiate sur la sortie standard de contrôle (interceptée par VS Code)
    target_stream = sys.stderr if "ERROR" in level or "WARN" in level else sys.stdout
    try:
        print(full_message, file=target_stream, flush=flush)
    except UnicodeEncodeError:
        encoding = getattr(target_stream, "encoding", None) or "utf-8"
        safe_message = full_message.encode(encoding, errors="replace").decode(encoding, errors="replace")
        print(safe_message, file=target_stream, flush=flush)

    # Redirection vers fichier rotatif local si activé
    if LOG_ENABLED and WORKSPACE_ROOT:
        try:
            logs_dir = os.path.join(WORKSPACE_ROOT, ".graph-rag-explorer", "logs")
            log_file_path = os.path.join(logs_dir, f"graph-rag-explorer-{CURRENT_FILE_INDEX:02d}.log")

            # Vérification de la contrainte de taille (Mo -> Octets)
            if os.path.exists(log_file_path) and os.path.getsize(log_file_path) >= (MAX_SIZE_MB * 1024 * 1024):
                CURRENT_FILE_INDEX += 1

                # Gestion des bornes d'arrêt : retour cyclique à 01 si dépassement de la rétention ou de 99
                if CURRENT_FILE_INDEX > MAX_RETENTION or CURRENT_FILE_INDEX > 99:
                    CURRENT_FILE_INDEX = 1

                log_file_path = os.path.join(logs_dir, f"graph-rag-explorer-{CURRENT_FILE_INDEX:02d}.log")
                if os.path.exists(log_file_path):
                    os.remove(log_file_path) # Écrase le fichier recyclé pour démarrer une nouvelle rotation

            with open(log_file_path, "a", encoding="utf-8") as lf:
                lf.write(full_message + "\n")
        except Exception:
            pass

def _format_args(*args) -> str:
    return " ".join(str(arg) for arg in args)

def debug(*args, component: str = "Backend", flush: bool = True):
    _log("🪲 [DEBUG]", component, _format_args(*args), flush=flush)

def info(*args, component: str = "Backend", flush: bool = True):
    _log("ℹ️ [INFO]", component, _format_args(*args), flush=flush)

def warn(*args, component: str = "Backend", flush: bool = True):
    _log("⚠️ [WARN]", component, _format_args(*args), flush=flush)

def error(*args, component: str = "Backend", flush: bool = True):
    _log("❌ [ERROR]", component, _format_args(*args), flush=flush)

def success(*args, component: str = "Backend", flush: bool = True):
    _log("✅ [SUCCESS]", component, _format_args(*args), flush=flush)
