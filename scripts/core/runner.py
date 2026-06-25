import os
import sys
import subprocess
import time
import fcntl
import importlib
import site

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
VENDOR_DIR = os.path.join(ROOT_DIR, ".python_packages")

# 1. On injecte le dossier vendor avec site.addsitedir pour forcer la lecture des .pth s'il y en a
if VENDOR_DIR not in sys.path:
    sys.path.insert(0, VENDOR_DIR)
    site.addsitedir(VENDOR_DIR)

def bootstrap():
    try:
        import networkx
        import pandas
    except ImportError:
        lock_file = os.path.join(ROOT_DIR, ".bootstrap.lock")
        try:
            with open(lock_file, 'w') as f:
                # Verrou exclusif non-bloquant
                fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB)
                print("🟠 [Bootstrapper] Dépendances manquantes. Installation isolée en cours...")
                os.makedirs(VENDOR_DIR, exist_ok=True)
                try:
                    subprocess.check_call([
                        sys.executable, "-m", "pip", "install",
                        "networkx>=3.1", "pandas>=2.0.0", "tree-sitter-language-pack",
                        "--target", VENDOR_DIR, "--quiet", "--upgrade"
                    ])
                    print("✅ [Bootstrapper] Dépendances installées avec succès.")

                    # FIX CRITIQUE: Forcer Python à relire le disque dur maintenant que pip a terminé !
                    importlib.invalidate_caches()

                except subprocess.CalledProcessError as e:
                    print(f"❌ [Bootstrapper] Échec critique de l'installation: {e}")
                    sys.exit(1)
                finally:
                    fcntl.flock(f, fcntl.LOCK_UN)
                    try:
                        os.remove(lock_file)
                    except OSError:
                        pass
        except BlockingIOError:
            print("⏳ [Bootstrapper] Installation déjà en cours par un autre processus. Attente...")
            while os.path.exists(lock_file):
                time.sleep(0.5)

            # FIX CRITIQUE: Le process qui attendait doit aussi vider son cache !
            importlib.invalidate_caches()
            print("✅ [Bootstrapper] Attente terminée.")

if __name__ == "__main__":
    bootstrap()

    if "--file" in sys.argv:
        import git_delta
        git_delta.main()
    else:
        import main
        main.main()
