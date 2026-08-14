import { PythonScriptStatus } from "../../../_python-scripts";

export interface ExportStatus {
   exportDir: string;
   pythonScriptStatus: PythonScriptStatus;
}
