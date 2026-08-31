import * as path from 'path';

import { vsCodeSettingsManager } from '../managers/VsCodeSettings.manager';

const rawBackendWorkspacePath = vsCodeSettingsManager.getSettings().backendWorkspacePath || '';

// Where All the Token Razor configuration data files are stored
export const TOKEN_RAZOR_CONFIG_PATH = path.join(rawBackendWorkspacePath, 'config');

// Reference service constants
export const REFERENCES_CONFIG_PATH = path.join(TOKEN_RAZOR_CONFIG_PATH, 'references');
export const PROJECT_REFERENCES_CONFIG_FILENAME = 'project-references.yaml';
export const GLOBAL_PROJECT_REFERENCES_KEY = 'global-project-references';

export const REFERENCES_ORIGINAL_PATH = path.join(REFERENCES_CONFIG_PATH, 'original');
export const REFERENCES_TEMP_PATH = path.join(REFERENCES_CONFIG_PATH, 'temp');
export const REFERENCES_TRANSFORMED_PATH = path.join(REFERENCES_CONFIG_PATH, 'transformed');
