import { ExportFormat, ExportMode } from "../types";

export interface ExportArgs {
  /** Array of input file/folder paths to process */
  paths: string[];

  /** Timestamp used to identify the final export operation location*/
  timestamp: string;

  /** Target directory path where exported files should be saved */
   destDir?: string;

  /** File format for the output export */
  format?: ExportFormat;

  /** Execution mode passed to the python script */
  mode?: ExportMode;

  /** Maximum size or limit per input file in KB */
  maxFile?: number | string;

  /** Maximum output files chunk size limit in KB */
  maxChunk?: number | string;

  /** Group generated files by their extension */
  groupByExt?: boolean;

  /** Enable logging output to the console */
  logConsole?: boolean;

  /** Enable logging output to a file */
  logFile?: boolean;

  /** Flag to output a tree-view structure */
  generateTreeView?: boolean;

  /** Comma or newline-separated list of path inclusions */
  incPaths?: string;

  /** Comma or newline-separated list of path exclusions */
  excPaths?: string;

  /** Comma or newline-separated list of file extension inclusions */
  incExts?: string;

  /** Comma or newline-separated list of file extension exclusions */
  excExts?: string;

}
