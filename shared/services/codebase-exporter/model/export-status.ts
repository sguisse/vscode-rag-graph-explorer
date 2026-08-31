import { PythonScriptStatus } from "../../_python-scripts";
import { ExportArgs } from "./export-args";

export interface ExportStatus {
   exportArgs?: ExportArgs;
   pythonScriptStatus: PythonScriptStatus;
}
