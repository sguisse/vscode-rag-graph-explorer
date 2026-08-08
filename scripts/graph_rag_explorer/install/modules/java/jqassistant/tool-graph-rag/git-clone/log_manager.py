import logging
import sys
import multiprocessing as mp

def is_main_process():
    return mp.current_process().name == "MainProcess"

# --- 1. Custom Filter Classes ---

class DebugOnlyFilter(logging.Filter):
    """Passes ONLY messages with an exact level of DEBUG."""
    def filter(self, record):
        return record.levelno == logging.DEBUG


class InfoAndUpFilter(logging.Filter):
    """Passes ONLY messages with INFO and higher."""
    def filter(self, record):
        return record.levelno >= logging.INFO


# --- 2. Public initialization function ---

_initialized = False  # Prevent re-initializing when multiple modules import


def init_logging(log_file: str = "debug.log", console_level: str = "INFO"):
    """
    Initialize a single, idempotent logging configuration for the tool.

    This function is defensive: it removes existing stream handlers (which may
    have been created by other modules calling ``logging.basicConfig``) and
    installs exactly one console handler plus an optional file handler. Call
    this early in the program startup (main entrypoints already do), and it
    will avoid duplicated console output caused by multiple handlers.
    """
    global _initialized

    root_logger = logging.getLogger()

    # Remove any pre-existing StreamHandler instances to avoid duplicate
    # console output (common when libraries call logging.basicConfig()).
    for h in list(root_logger.handlers):
        if isinstance(h, logging.StreamHandler):
            root_logger.removeHandler(h)

    # Ensure we capture all messages at the root and let handlers filter
    root_logger.setLevel(logging.DEBUG)

    # Console handler: single, timestamped INFO+ output to stdout
    try:
        level_num = (
            getattr(logging, console_level.upper()) if isinstance(console_level, str) else console_level
        )
    except Exception:
        level_num = logging.INFO

    stdout_handler = logging.StreamHandler(sys.stdout)
    stdout_handler.setLevel(level_num)
    stdout_handler.setFormatter(logging.Formatter('%(asctime)s - [%(levelname)s] %(message)s'))
    # Attach the single console handler
    root_logger.addHandler(stdout_handler)

    # File handler (DEBUG) - only attach once in the main process
    if is_main_process():
        try:
            file_handler = logging.FileHandler(log_file, mode='w', encoding='utf-8')
            file_handler.setLevel(logging.DEBUG)
            file_handler.setFormatter(
                logging.Formatter('%(asctime)s - %(name)s - [%(levelname)s] %(message)s')
            )
            root_logger.addHandler(file_handler)
        except Exception as e:
            # Use the root logger's default error reporting in case file creation fails
            root_logger.error(f"Failed to initialize file logger at {log_file}: {e}")

    _initialized = True
