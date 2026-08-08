#!/usr/bin/env python3
import os
import json
from utils import info, success, error

def generate_final_install_status():
    """ Localise la racine .graph-rag-explorer et fusionne fidèlement tous les statuts d'installation """
    info("Génération du rapport récapitulatif final de l'infrastructure de déploiement...", component="InstallSummary")

    # Résolution dynamique du dossier racine réel .graph-rag-explorer/target/install_reports
    base_dir = os.path.dirname(os.path.abspath(__file__))
    current = os.path.abspath(base_dir)
    install_reports_base = None

    while current != os.path.dirname(current):
        if os.path.basename(current) == ".graph-rag-explorer":
            install_reports_base = os.path.join(current, "target", "install_reports")
            break
        current = os.path.dirname(current)

    if not install_reports_base:
        install_reports_base = os.path.abspath(os.path.join(base_dir, "../../target/install_reports"))

    final_status_path = os.path.join(install_reports_base, "final-status.json")

    # Alignement sur la hiérarchie de stockage réelle de target/install_reports/
    mappings = {
        "core": os.path.join(install_reports_base, "core", "after", "status.json"),
        "java_code_graph": os.path.join(install_reports_base, "java", "code_graph", "after", "status.json"),
        "java_graphify": os.path.join(install_reports_base, "java", "graphify", "after", "status.json"),
        "node_dependency_cruiser": os.path.join(install_reports_base, "node", "dependency_cruiser", "after", "status.json"),
        "node_swc": os.path.join(install_reports_base, "node", "swc", "after", "status.json"),
    }

    final_report = {}
    global_steps = 0
    global_ko = 0
    global_ok = 0
    has_warnings = False

    for key, file_path in mappings.items():
        if os.path.exists(file_path):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    sub_data = json.load(f)
                final_report[key] = sub_data

                sub_summary = sub_data.get("summary", {})
                global_steps += int(sub_summary.get("stepsCount", 0))
                global_ko += int(sub_summary.get("koCount", 0))
                global_ok += int(sub_summary.get("okCount", 0))

                if sub_summary.get("globalStatus") != "✅":
                    has_warnings = True
            except Exception as e:
                final_report[key] = {"status": "❌", "message": f"Malformed status file: {str(e)}"}
                has_warnings = True
        else:
            final_report[key] = {"status": "⚠️", "message": f"No validation history found at expected path: {file_path}"}
            has_warnings = True

    final_report["summary"] = {
        "globalStatus": "⚠️" if (has_warnings or global_ko > 0) else "✅",
        "stepsCount": str(global_steps),
        "koCount": global_ko,
        "okCount": global_ok
    }

    try:
        os.makedirs(os.path.dirname(final_status_path), exist_ok=True)
        with open(final_status_path, "w", encoding="utf-8") as out_f:
            json.dump(final_report, out_f, indent=2, ensure_ascii=False)
        success(f"🎉 Rapport final-status.json de l'infrastructure sauvegardé dans : {final_status_path}", component="InstallSummary")
    except Exception as e:
        error(f"Impossible d'écrire le manifeste final-status.json : {e}", component="InstallSummary")
