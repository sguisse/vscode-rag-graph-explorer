import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { getWorkspaceExtentionPath } from '../../utils/utils-vscode';
import { logInfo, logError } from '../../utils/utils-log';
import { ITransformContentServicePort } from '../../../../shared/services/transform-content/port-out/transform-content-service.port';

export class TransformContentAdapter extends AbstractServiceAdapter implements ITransformContentServicePort, vscode.Disposable {

    constructor() {
        super();
    }


    public dispose() {
        // Cleanup if necessary
    }
}
