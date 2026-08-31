import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { logInfo } from '../../utils/utils-log';
import { IFilesExporterServicePort } from '../../../../shared/services/file-exporter/port-out/file-exporter-service.port';


export class FilesExporterAdapter extends AbstractServiceAdapter implements IFilesExporterServicePort, vscode.Disposable {

    constructor () {
        super()
    }




    public dispose() {

    }
}
