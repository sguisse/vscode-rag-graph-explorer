#!/usr/bin/env python3
"""Module responsible for extracting maturity matrix assessments and generating reports."""

import json
import logging
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    from scripts.architecture.maturity_matrix.assessments_extractor_model import (
        AssessmentCSV,
        AssessmentStatus,
        MaturityMatrixConfigCsvRow,
        MaturityMatrixEngine,
        PillarCSV,
        ProductCSV,
        ScoreLevelCSV,
        SkillCSV,
    )
except (ImportError, ModuleNotFoundError):
    from assessments_extractor_model import (
        AssessmentCSV,
        AssessmentStatus,
        MaturityMatrixConfigCsvRow,
        MaturityMatrixEngine,
        PillarCSV,
        ProductCSV,
        ScoreLevelCSV,
        SkillCSV,
    )

logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


class AssessmentsExtractorService:
    """Service executing the extraction workflow for product maturity matrix assessments."""

    def __init__(self, data_directory: Optional[Path] = None) -> None:
        self.script_dir = Path(__file__).parent.resolve()
        self.data_dir = data_directory if data_directory else self.script_dir / "data"

    def execute_extraction(self) -> Dict[str, Any]:
        """Executes the full extraction process based on configuration and returns the report dictionary."""
        extractor_config, config_dir = self._load_extractor_config()

        repo_location_str = extractor_config.get(
            "maturity-matrix-repo-location",
            "/Users/mac-SGUISS21/01-work/01-projects/10-tools/03-decath/maturity-matrix-front/public/data/assessments/",
        )
        repo_location = Path(repo_location_str)
        self._verify_repo_location_exists(repo_location)

        matrix_config_filename = extractor_config.get("maturity-matrix-config-file-name", "Y2026_Q1.csv")
        matrix_config_path = config_dir / matrix_config_filename
        MaturityMatrixEngine.initialize_maturity_matrix_config(matrix_config_path)

        products_by_code: Dict[str, ProductCSV] = {}
        products_code: List[str] = extractor_config.get("products-code", [])
        pillars_config: List[Dict[str, Any]] = extractor_config.get("pillars", [])

        for product_code in products_code:
            product_csv = self._process_product(product_code, repo_location, pillars_config)
            if product_csv is not None:
                products_by_code[product_code] = product_csv

        base_target_dir_str = extractor_config.get(
            "target-extracted-file-location",
            "/Users/mac-SGUISS21/01-work/01-projects/10-tools/01-plugins/01-vscode/vscode-rag-graph-explorer/sandbox/gen/archi/mm",
        )
        timestamp_folder = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        target_dir = Path(base_target_dir_str) / timestamp_folder

        json_filename = extractor_config.get("target-extracted-last-assessment-json-file-name", "last-assessments-extract.json")
        csv_filename = extractor_config.get("target-extracted-last-assessment-csv-file-name", "last-assessments-extract.csv")
        skills_csv_filename = extractor_config.get("target-extracted-last-skills-csv-file-name", "last-assessments-skills-extract.csv")

        report_data = self._save_extraction_outputs_and_report(
            products_by_code, target_dir, json_filename, csv_filename, skills_csv_filename
        )
        return report_data

    def _load_extractor_config(self) -> Tuple[Dict[str, Any], Path]:
        candidate_paths = [
            Path("/data/extractor-config.json"),
            self.data_dir / "extractor-config.json",
            Path("data/extractor-config.json"),
            Path(__file__).parent / "data" / "extractor-config.json",
        ]

        target_path: Optional[Path] = None
        for path in candidate_paths:
            if path and path.exists() and path.is_file():
                target_path = path
                break

        if not target_path:
            raise FileNotFoundError("Extractor config file 'extractor-config.json' not found in candidate locations.")

        with open(target_path, "r", encoding="utf-8") as file_handle:
            config_data = json.load(file_handle)
        return config_data, target_path.parent

    def _verify_repo_location_exists(self, repo_location: Path) -> None:
        if not repo_location.exists() or not repo_location.is_dir():
            logger.error(
                "Maturity matrix repo location does not exist, check repo location: '%s'",
                repo_location,
            )

    def _process_product(
        self, product_code: str, repo_location: Path, pillars_config: List[Dict[str, Any]]
    ) -> Optional[ProductCSV]:
        logger.debug("--> Processing product code: %s", product_code)
        product_assessment_location = repo_location / product_code
        if not product_assessment_location.exists() or not product_assessment_location.is_dir():
            logger.error(
                "Product assessment repo location does not exist for product code '%s' at: '%s'",
                product_code,
                product_assessment_location,
            )
            return None

        logger.info("Product assessment repo location: '%s'", product_assessment_location.resolve())
        assessment_files = list(product_assessment_location.glob("*.json"))

        product_csv = ProductCSV(code=product_code)
        for pillar_data in pillars_config:
            pillar_code = pillar_data.get("code", "")
            self._process_pillar(product_code, pillar_data, pillar_code, assessment_files, product_csv)

        logger.info("<-- Finished processing product code: %s", product_code)
        return product_csv

    def _process_pillar(
        self,
        product_code: str,
        pillar_data: Dict[str, Any],
        pillar_code: str,
        assessment_files: List[Path],
        product_csv: ProductCSV,
    ) -> None:
        prev_last_released = self._find_assessment(
            assessment_files, pillar_code, [AssessmentStatus.RELEASED.value], find_previous_last_released=True
        )
        last_released = self._find_assessment(
            assessment_files, pillar_code, [AssessmentStatus.RELEASED.value], find_previous_last_released=False
        )
        current_pending = self._find_assessment(
            assessment_files, pillar_code, [AssessmentStatus.PENDING.value], find_previous_last_released=False
        )

        pillar_csv = product_csv.pillar_by_code.get(pillar_code)
        if pillar_csv is None:
            logger.warning("No pillar found for code '%s', creating new one.", pillar_code)
            pillar_csv = PillarCSV(code=pillar_code)
            product_csv.pillar_by_code[pillar_code] = pillar_csv

        self._associate_released_results(
            pillar_data, prev_last_released, pillar_code, pillar_csv, PillarCSV.ASSESSMENT_RELEASED_PREVIOUS_LAST
        )
        self._associate_released_results(
            pillar_data, last_released, pillar_code, pillar_csv, PillarCSV.ASSESSMENT_RELEASED_LAST
        )
        self._associate_pending_results(
            pillar_data, current_pending, pillar_code, pillar_csv, PillarCSV.ASSESSMENT_PENDING_LAST_EXTRACT
        )
        self._associate_pending_results(
            pillar_data, None, pillar_code, pillar_csv, PillarCSV.ASSESSMENT_PENDING_PREVIOUS_LAST_EXTRACT
        )

        if current_pending is not None:
            logger.info("Current assessment found for pillar '%s': %s", pillar_code, current_pending)
        else:
            logger.warning("No current assessment found for pillar '%s'", pillar_code)

    def _find_assessment(
        self,
        assessment_files: List[Path],
        pillar_code: str,
        statuses_to_search: List[str],
        find_previous_last_released: bool,
    ) -> Optional[Dict[str, Any]]:
        sorted_files = sorted(assessment_files, key=lambda f: f.stat().st_mtime)

        date_max_found = date.min
        previous_last_found: Optional[Dict[str, Any]] = None
        last_found: Optional[Dict[str, Any]] = None

        for assessment_file in sorted_files:
            logger.debug("Found assessment file: %s", assessment_file.name)
            try:
                with open(assessment_file, "r", encoding="utf-8") as f:
                    repo_app_assessment = json.load(f)
            except Exception as err:
                logger.error("Failed to read JSON from '%s': %s", assessment_file, err)
                continue

            assessment_date = self._parse_assessment_date(repo_app_assessment)
            pillar = str(repo_app_assessment.get("pillar", ""))
            status = str(repo_app_assessment.get("status", ""))

            if pillar == pillar_code and status in statuses_to_search:
                if assessment_date > date_max_found:
                    date_max_found = assessment_date
                    previous_last_found = last_found
                    last_found = repo_app_assessment

        if find_previous_last_released:
            return previous_last_found
        return last_found

    def _parse_assessment_date(self, repo_app_assessment: Dict[str, Any]) -> date:
        raw_date = repo_app_assessment.get("date")
        if isinstance(raw_date, list) and len(raw_date) >= 3:
            return date(int(raw_date[0]), int(raw_date[1]), int(raw_date[2]))
        if isinstance(raw_date, str):
            try:
                return date.fromisoformat(raw_date)
            except ValueError:
                pass
        return date.min

    def _associate_released_results(
        self,
        pillar_data: Dict[str, Any],
        product_asmt: Optional[Dict[str, Any]],
        pillar_code: str,
        pillar_csv: PillarCSV,
        assessment_type: str,
    ) -> None:
        if product_asmt is not None:
            logger.info("Assessment type '%s' found for pillar '%s': %s", assessment_type, pillar_code, product_asmt)
            pillar_csv.status = str(product_asmt.get("status", ""))
            assessor = product_asmt.get("assessor")
            if not assessor or not isinstance(assessor, dict):
                logger.warning("No assessor found in assessment type '%s' for pillar '%s'", assessment_type, pillar_code)
                pillar_csv.last_assessor_name = "Unknown - ???"
            else:
                pillar_csv.last_assessor_name = str(assessor.get("name", "Unknown - ???"))

            assessment_infos = pillar_csv.assessments_info[assessment_type]
            parsed_date = self._parse_assessment_date(product_asmt)
            assessment_infos.date = parsed_date.isoformat() if parsed_date != date.min else None
            assessment_infos.status = str(product_asmt.get("status", ""))

            global_score = str(product_asmt.get("score", "0.0")).replace(".", ",")
            global_level = str(product_asmt.get("level", "0.0")).replace(".", ",")
            assessment_infos.add_capability_values(AssessmentCSV.CAPABILITY_GLOBAL_NAME, global_score, global_level)

            topics_scores = product_asmt.get("topicsScores") or {}
            topics_levels = product_asmt.get("topicsLevels") or {}

            for capability in pillar_data.get("capabilities", []):
                cap_score = "0,0"
                cap_level = "0,0"
                if capability in topics_scores:
                    cap_score = str(topics_scores.get(capability, "0.0")).replace(".", ",")
                    cap_level = str(topics_levels.get(capability, "0.0")).replace(".", ",")
                else:
                    logger.warning("Capability '%s' not found in topics scores for pillar '%s'", capability, pillar_code)
                assessment_infos.add_capability_values(capability, cap_score, cap_level)

            responses = product_asmt.get("responses") or []
            for resp in responses:
                if isinstance(resp, dict) and len(resp) > 1:
                    resp_id = str(resp.get("id", ""))
                    resp_level = str(resp.get("level", "")) if resp.get("level") is not None else ""
                    resp_cap = str(resp.get("topic", "")) if resp.get("topic") is not None else ""
                    resp_label = str(resp.get("label", "")) if resp.get("label") is not None else ""
                    resp_value = str(resp.get("value", "")) if resp.get("value") is not None else ""
                    resp_comment = str(resp.get("comment", "")) if resp.get("comment") is not None else ""

                    skill_csv = SkillCSV(resp_id, resp_level, resp_cap, resp_label, resp_comment, resp_value)
                    assessment_infos.add_skills_by_level(resp_level, skill_csv)
        else:
            logger.warning("No assessment type '%s' found for pillar '%s'", assessment_type, pillar_code)
            last_assessment_infos = pillar_csv.assessments_info[assessment_type]
            last_assessment_infos.add_capability_values(AssessmentCSV.CAPABILITY_GLOBAL_NAME, "0,0", "0,0")
            for capability in pillar_data.get("capabilities", []):
                last_assessment_infos.add_capability_values(capability, "0,0", "0,0")

    def _associate_pending_results(
        self,
        pillar_data: Dict[str, Any],
        product_asmt: Optional[Dict[str, Any]],
        pillar_code: str,
        pillar_csv: PillarCSV,
        assessment_type: str,
    ) -> None:
        if product_asmt is not None:
            logger.info("Assessment type '%s' found for pillar '%s': %s", assessment_type, pillar_code, product_asmt)
            pillar_csv.status = str(product_asmt.get("status", ""))
            assessor = product_asmt.get("assessor")
            if not assessor or not isinstance(assessor, dict):
                logger.warning("No assessor found in assessment type '%s' for pillar '%s'", assessment_type, pillar_code)
                pillar_csv.last_assessor_name = "Unknown - ???"
            else:
                pillar_csv.last_assessor_name = str(assessor.get("name", "Unknown - ???"))

            assessment_infos = pillar_csv.assessments_info[assessment_type]
            assessment_infos.date = date.today().isoformat()
            assessment_infos.status = str(product_asmt.get("status", ""))

            global_percentage = MaturityMatrixEngine.compute_responses_progress_for_pillar(product_asmt)
            assessment_infos.filled_percentage = global_percentage

            formatted_pct = f"{global_percentage:.2f}".replace(".", ",")
            assessment_infos.add_capability_values(AssessmentCSV.CAPABILITY_GLOBAL_NAME, formatted_pct, "N/A")

            for capability in pillar_data.get("capabilities", []):
                assessment_infos.add_capability_values(capability, "0", "0")
        else:
            logger.warning("No assessment type '%s' found for pillar '%s'", assessment_type, pillar_code)
            last_assessment_infos = pillar_csv.assessments_info[assessment_type]
            last_assessment_infos.add_capability_values(AssessmentCSV.CAPABILITY_GLOBAL_NAME, "0", "0")
            for capability in pillar_data.get("capabilities", []):
                last_assessment_infos.add_capability_values(capability, "0", "0")

    def _save_extraction_outputs_and_report(
        self,
        products_by_code: Dict[str, ProductCSV],
        target_dir: Path,
        json_filename: str,
        csv_filename: str,
        skills_csv_filename: str,
    ) -> Dict[str, Any]:
        target_dir.mkdir(parents=True, exist_ok=True)

        target_json_path = target_dir / json_filename
        logger.info("Saving extracted assessments state to file: %s", target_json_path)
        serialized_products = {code: prod.to_dict() for code, prod in products_by_code.items()}
        with open(target_json_path, "w", encoding="utf-8") as json_file:
            json.dump(serialized_products, json_file, indent=3)

        target_csv_path = target_dir / csv_filename
        logger.info("Saving extracted assessments state to CSV file: %s", target_csv_path)

        target_skills_csv_path = target_dir / skills_csv_filename
        logger.info("Saving extracted skills state to CSV file: %s", target_skills_csv_path)

        csv_assessments_content: List[str] = []
        csv_skills_content: List[str] = []

        for product in products_by_code.values():
            csv_assessments_content.append(product.to_assessments_extracts_csv())
            csv_skills_content.append(product.to_skills_to_improve_csv(MaturityMatrixEngine.maturity_matrix_config))

        with open(target_csv_path, "w", encoding="utf-8") as csv_file:
            csv_file.write("".join(csv_assessments_content))

        with open(target_skills_csv_path, "w", encoding="utf-8") as skills_file:
            skills_file.write("".join(csv_skills_content))

        assessment_datetime = datetime.now().isoformat()
        report_yaml_path = target_dir / "report-extract.yaml"
        yaml_content = f"""MMAssessmentsReport:
  assessment_datetime: "{assessment_datetime}"
  target_directory: "{target_dir.resolve()}"
  files:
    json_extract: "{target_json_path.resolve()}"
    csv_extract: "{target_csv_path.resolve()}"
    skills_csv_extract: "{target_skills_csv_path.resolve()}"

status: "SUCCESS"
message: "Assessments extraction completed successfully."
"""
        with open(report_yaml_path, "w", encoding="utf-8") as report_file:
            report_file.write(yaml_content)

        logger.info("Saved extraction report YAML to file: %s", report_yaml_path)

        return {
            "assessmentDatetime": assessment_datetime,
            "targetDirectory": str(target_dir.resolve()),
            "files": {
                "jsonExtract": str(target_json_path.resolve()),
                "csvExtract": str(target_csv_path.resolve()),
                "skillsCsvExtract": str(target_skills_csv_path.resolve()),
            },
            "reportPath": str(report_yaml_path.resolve()),
            "status": "SUCCESS",
            "message": "Assessments extraction completed successfully.",
        }


def extract_assessments() -> Dict[str, Any]:
    """Triggers the assessment extraction service execution and returns the MMAssessmentsReport dictionary."""
    service = AssessmentsExtractorService()
    report_data = service.execute_extraction()
    return report_data
