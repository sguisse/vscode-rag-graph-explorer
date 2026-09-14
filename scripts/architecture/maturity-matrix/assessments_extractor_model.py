#!/usr/bin/env python3
"""Data models, enumerations, and config structures for maturity matrix assessment extraction."""

import csv
import io
import logging
import sys
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

try:
    csv.field_size_limit(sys.maxsize)
except Exception:
    pass


class AssessmentStatus(str, Enum):
    """Enumeration representing assessment statuses."""
    RELEASED = "RELEASED"
    IN_ERROR = "IN_ERROR"
    PENDING = "PENDING"


class ScoreLevelCSV:
    """Represents a score and level pair for a capability."""

    def __init__(self, score: str = "0,0", level: str = "0,0") -> None:
        self.score: str = score
        self.level: str = level

    def to_dict(self) -> Dict[str, str]:
        return {"score": self.score, "level": self.level}


class SkillCSV:
    """Represents an individual skill entry to improve."""

    def __init__(
        self,
        skill_id: str,
        level: str,
        capability: str,
        label: str,
        comment: str,
        value: str,
    ) -> None:
        self.id: str = skill_id
        self.level: str = level
        self.capability: str = capability
        self.label: str = label
        self.comment: str = comment
        self.value: str = value

    def to_dict(self) -> Dict[str, str]:
        return {
            "id": self.id,
            "level": self.level,
            "capability": self.capability,
            "label": self.label,
            "comment": self.comment,
            "value": self.value,
        }


class AssessmentCSV:
    """Holds assessment values and associated skills for a specific snapshot."""

    CAPABILITY_GLOBAL_NAME = "Global"

    def __init__(self) -> None:
        self.date: Optional[str] = None
        self.status: str = ""
        self.filled_percentage: float = 0.0
        self.values_by_capabilities: Dict[str, ScoreLevelCSV] = {}
        self.skills: List[SkillCSV] = []

    def add_capability_values(self, capability_name: str, score: str, level: str) -> None:
        self.values_by_capabilities[capability_name] = ScoreLevelCSV(score, level)

    def add_skills_by_level(self, level: str, skill: SkillCSV) -> None:
        self.skills.append(skill)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "date": self.date,
            "status": self.status,
            "filledPercentage": self.filled_percentage,
            "valuesByCapabilities": {
                cap: val.to_dict() for cap, val in self.values_by_capabilities.items()
            },
            "skills": [skill.to_dict() for skill in self.skills],
        }


class PillarCSV:
    """Holds pillar details across all assessment snapshot types."""

    ASSESSMENT_RELEASED_PREVIOUS_LAST = "ASSESSMENT_RELEASED_PREVIOUS_LAST"
    ASSESSMENT_RELEASED_LAST = "ASSESSMENT_RELEASED_LAST"
    ASSESSMENT_PENDING_PREVIOUS_LAST_EXTRACT = "ASSESSMENT_PENDING_PREVIOUS_LAST_EXTRACT"
    ASSESSMENT_PENDING_LAST_EXTRACT = "ASSESSMENT_PENDING_LAST_EXTRACT"

    def __init__(self, code: str = "") -> None:
        self.code: str = code
        self.status: str = ""
        self.last_assessor_name: str = ""
        self.assessments_info: Dict[str, AssessmentCSV] = {
            self.ASSESSMENT_RELEASED_PREVIOUS_LAST: AssessmentCSV(),
            self.ASSESSMENT_RELEASED_LAST: AssessmentCSV(),
            self.ASSESSMENT_PENDING_PREVIOUS_LAST_EXTRACT: AssessmentCSV(),
            self.ASSESSMENT_PENDING_LAST_EXTRACT: AssessmentCSV(),
        }

    def get_assessment_previous_last_released(self) -> AssessmentCSV:
        return self.assessments_info[self.ASSESSMENT_RELEASED_PREVIOUS_LAST]

    def get_assessment_last_released(self) -> AssessmentCSV:
        return self.assessments_info[self.ASSESSMENT_RELEASED_LAST]

    def get_assessment_pending_previous_extract(self) -> AssessmentCSV:
        return self.assessments_info[self.ASSESSMENT_PENDING_PREVIOUS_LAST_EXTRACT]

    def get_assessment_pending_last_extract(self) -> AssessmentCSV:
        return self.assessments_info[self.ASSESSMENT_PENDING_LAST_EXTRACT]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "code": self.code,
            "status": self.status,
            "lastAssessorName": self.last_assessor_name,
            "assessmentsInfo": {
                key: asmt.to_dict() for key, asmt in self.assessments_info.items()
            },
        }


class MaturityMatrixConfigCsvRow:
    """Data model representing a row in the maturity matrix config CSV."""

    def __init__(self, row: Dict[str, str], question_id_column: str = "Question ID") -> None:
        self.pillar: str = row.get("Pillar", "")
        self.topic: str = row.get("Topic", "")
        self.level: str = row.get("Level", "")
        self.order: str = row.get("Order", "")
        self.question: str = row.get("Question", "")
        self.documentation_markdown: str = row.get("Documentation #Markdown", "")
        self.status: str = row.get("Status", "")
        self.question_id: str = row.get(question_id_column, row.get("Question ID", ""))
        self.backend: str = row.get("Backend", "")
        self.backend_3s: str = row.get("Backend_3S", "")
        self.mobile: str = row.get("Mobile", "")
        self.saas: str = row.get("SAAS", "")
        self.front: str = row.get("Front", "")
        self.front_3s: str = row.get("Front_3S", "")
        self.ai: str = row.get("AI", "")
        self.data_pipeline: str = row.get("DataPipeline", "")
        self.green_pillar: str = row.get("Green Pillar", "")
        self.green_documentation_markdown: str = row.get("Green Documentation #Markdown", "")
        self.reliability: str = row.get("Reliability", "")
        self.mobile_ref: str = row.get("Mobile ref", "")
        self.comments: str = row.get("Comments", "")
        self.who: str = row.get("Who", "")
        self.review: str = row.get("Review", "")


class MaturityMatrixEngine:
    """Engine handling maturity matrix configuration loading and progress computations."""

    maturity_matrix_config: Dict[str, MaturityMatrixConfigCsvRow] = {}

    @classmethod
    def initialize_maturity_matrix_config(cls, csv_file_path: Optional[Path] = None) -> None:
        """Loads and parses the maturity matrix CSV configuration file into memory.

        Raises FileNotFoundError or ValueError if the CSV file cannot be found or is empty.
        """
        cls.maturity_matrix_config.clear()

        config_filename = csv_file_path.name if csv_file_path else "Y2026_Q1.csv"

        candidate_paths = [
            Path("/data") / config_filename,
            Path("/data/Y2026_Q1.csv"),
            csv_file_path if csv_file_path else Path("scripts/architecture/maturity-matrix/data/Y2026_Q1.csv"),
            Path(__file__).parent / "data" / config_filename,
            Path("scripts/architecture/maturity-matrix/data") / config_filename,
            Path("data") / config_filename,
        ]

        target_file: Optional[Path] = None
        for path in candidate_paths:
            if path and path.exists() and path.is_file() and path.stat().st_size > 100:
                target_file = path
                break

        if not target_file:
            for path in candidate_paths:
                if path and path.exists() and path.is_file():
                    target_file = path
                    break

        if not target_file:
            searched_locations = ", ".join(f"'{p}'" for p in candidate_paths if p)
            error_message = (
                f"Maturity matrix configuration file '{config_filename}' was not found. "
                f"Searched in locations: [{searched_locations}]. Execution stopped."
            )
            logger.error(error_message)
            raise FileNotFoundError(error_message)

        logger.info("Loading maturity matrix config CSV from '%s'", target_file.resolve())

        content: Optional[str] = None
        for encoding in ["utf-8-sig", "utf-8", "latin-1", "cp1252"]:
            try:
                with open(target_file, mode="r", encoding=encoding) as f:
                    content = f.read()
                if content:
                    break
            except Exception:
                continue

        if not content or not content.strip():
            error_message = f"Maturity matrix configuration CSV at '{target_file}' is empty. Execution stopped."
            logger.error(error_message)
            raise ValueError(error_message)

        lines = content.splitlines()
        first_line = lines[0] if lines else ""
        delimiter = ";" if ";" in first_line and "," not in first_line else ","

        string_stream = io.StringIO(content)
        reader = csv.DictReader(string_stream, delimiter=delimiter, skipinitialspace=True)
        fieldnames = reader.fieldnames or []

        question_id_col = "Question ID"
        for field in fieldnames:
            clean_field = field.strip().replace("\ufeff", "")
            if clean_field.lower().replace(" ", "").replace("_", "") == "questionid":
                question_id_col = field
                break

        for row in reader:
            cleaned_row = {
                (k.strip().replace("\ufeff", "") if k else ""): (v.strip() if v is not None else "")
                for k, v in row.items()
                if k is not None
            }
            config_row = MaturityMatrixConfigCsvRow(cleaned_row, question_id_column=question_id_col)
            q_id = config_row.question_id.strip()
            if q_id:
                cls.maturity_matrix_config[q_id] = config_row
                if q_id.startswith("#"):
                    cls.maturity_matrix_config[q_id[1:]] = config_row
                else:
                    cls.maturity_matrix_config["#" + q_id] = config_row

    @classmethod
    def compute_responses_progress_for_pillar(cls, pillar_assessment: Dict[str, Any]) -> float:
        """Calculates the ratio of filled responses for a given pillar assessment."""
        responses: List[Dict[str, Any]] = pillar_assessment.get("responses", [])
        if not responses:
            return 0.0

        total_responses = len(responses)
        filled_count = sum(
            1 for resp in responses
            if resp.get("value") is not None and str(resp.get("value")).strip() != ""
        )
        return (filled_count * 100.0 / total_responses) / 100.0


class ProductCSV:
    """Encapsulates product assessment state and provides CSV export capabilities."""

    EMPTY_CSV_VALUE = '""'

    def __init__(self, code: str = "") -> None:
        self.leader: str = self.EMPTY_CSV_VALUE
        self.code: str = code
        self.pillar_by_code: Dict[str, PillarCSV] = {}

    def get_pillar_by_code(self) -> Dict[str, PillarCSV]:
        return self.pillar_by_code

    def to_dict(self) -> Dict[str, Any]:
        return {
            "leader": self.leader,
            "code": self.code,
            "pillarByCode": {
                p_code: p_csv.to_dict() for p_code, p_csv in self.pillar_by_code.items()
            },
        }

    def to_assessments_extracts_csv(self) -> str:
        """Formats product pillar assessment data into structured CSV lines."""
        lines: List[str] = []
        for pillar_name, pillar_info in self.pillar_by_code.items():
            last_released = pillar_info.get_assessment_last_released()
            capability_keys = list(last_released.values_by_capabilities.keys())
            header_capabilities = ",".join(f'"{cap}"' for cap in capability_keys)

            header_parts = [
                self.leader,
                self.code,
                pillar_info.last_assessor_name,
                pillar_name,
                "",
                self.EMPTY_CSV_VALUE,
            ]
            first_line = ",".join(header_parts)
            if header_capabilities:
                first_line += f",{header_capabilities}"
            lines.append(first_line)

            self._build_released_lines(
                pillar_name, pillar_info, lines, "Last Released Assessment ", PillarCSV.ASSESSMENT_RELEASED_LAST
            )
            self._build_released_lines(
                pillar_name, pillar_info, lines, "Last Released Assessment -1", PillarCSV.ASSESSMENT_RELEASED_PREVIOUS_LAST
            )
            self._build_pending_lines(
                pillar_name, pillar_info, lines, "Last Pending Assessment snapshot", PillarCSV.ASSESSMENT_PENDING_LAST_EXTRACT
            )
            self._build_pending_lines(
                pillar_name, pillar_info, lines, "Last Pending Assessment snapshot -1", PillarCSV.ASSESSMENT_PENDING_PREVIOUS_LAST_EXTRACT
            )

        return "\n".join(lines) + ("\n" if lines else "")

    def _build_released_lines(
        self, pillar_name: str, pillar_info: PillarCSV, lines: List[str], label: str, assessment_type: str
    ) -> None:
        asmt = pillar_info.assessments_info.get(assessment_type)
        date_str = str(asmt.date) if asmt and asmt.date is not None else "null"
        values = asmt.values_by_capabilities.values() if asmt else []

        score_values = [f'"{v.score if v.score != "null" and v.score is not None else "0,0"}"' for v in values]
        score_line = f"{self.leader},{self.EMPTY_CSV_VALUE},{label},{pillar_name},{date_str},Score"
        if score_values:
            score_line += "," + ",".join(score_values)
        lines.append(score_line)

        level_values = [f'"{v.level if v.level != "null" and v.level is not None else "0,0"}"' for v in values]
        level_line = f"{self.leader},{self.EMPTY_CSV_VALUE},{label},{pillar_name},{date_str},Level"
        if level_values:
            level_line += "," + ",".join(level_values)
        lines.append(level_line)

    def _build_pending_lines(
        self, pillar_name: str, pillar_info: PillarCSV, lines: List[str], label: str, assessment_type: str
    ) -> None:
        asmt = pillar_info.assessments_info.get(assessment_type)
        date_str = str(asmt.date) if asmt and asmt.date is not None else "null"
        values = asmt.values_by_capabilities.values() if asmt else []

        score_values = [f'"{v.score if v.score != "null" and v.score is not None else "0,0"}"' for v in values]
        pending_line = f"{self.leader},{self.EMPTY_CSV_VALUE},{label},{pillar_name},{date_str},Percentage"
        if score_values:
            pending_line += "," + ",".join(score_values)
        lines.append(pending_line)

    def to_skills_to_improve_csv(self, maturity_matrix_config: Dict[str, MaturityMatrixConfigCsvRow]) -> str:
        """Formats skills to improve into structured CSV lines matching Java behavior."""
        lines: List[str] = []
        last_pillar_name = [""]

        for pillar_name, pillar_info in self.pillar_by_code.items():
            if last_pillar_name[0] != pillar_name:
                lines.append(f"pillar_line,{self.code},,{pillar_name},,,,,,\n".rstrip("\n"))
                last_pillar_name[0] = pillar_name

            skills = list(pillar_info.get_assessment_last_released().skills)

            def get_config_row(skill_id: str) -> Optional[MaturityMatrixConfigCsvRow]:
                if not skill_id:
                    return None
                cleaned = skill_id.strip()
                return (
                    maturity_matrix_config.get(skill_id)
                    or maturity_matrix_config.get(cleaned)
                    or (maturity_matrix_config.get(cleaned[1:]) if cleaned.startswith("#") else maturity_matrix_config.get("#" + cleaned))
                )

            def sort_key(skill: SkillCSV) -> Tuple[int, str, str]:
                cfg_row = get_config_row(skill.id)
                if cfg_row is None:
                    return (1, "", "")
                topic = cfg_row.topic if cfg_row.topic is not None else ""
                level = cfg_row.level if cfg_row.level is not None else ""
                return (0, topic, level)

            skills.sort(key=sort_key)

            for skill in skills:
                cfg_row = get_config_row(skill.id)
                if cfg_row is not None:
                    topic = cfg_row.topic
                    level = cfg_row.level
                    raw_question = cfg_row.question
                    if raw_question is not None:
                        clean_question = raw_question.strip().replace(chr(34), "'")
                        formatted_question = f'"{clean_question}"'
                    else:
                        formatted_question = '"???"'
                else:
                    topic = "???"
                    level = "???"
                    formatted_question = '"???"'

                row_parts = [
                    self.leader,
                    self.code,
                    pillar_info.last_assessor_name,
                    pillar_name,
                    topic,
                    level,
                    skill.id,
                    formatted_question,
                    skill.value or "",
                ]
                lines.append(",".join(row_parts))

        return "\n".join(lines) + ("\n" if lines else "")
