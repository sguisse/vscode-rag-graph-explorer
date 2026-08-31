import * as vscode from 'vscode';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { logInfo, logWarn } from '../../utils/utils-log';
import { readImageAsBase64 as readImageAsBase64Delegate } from './delegate/image-reader.delegate';
import { IImageServicePort } from '../../../../shared/services/images/model/port-out/image-service.port';

export class ImageAdapter extends AbstractServiceAdapter implements IImageServicePort, vscode.Disposable {

    constructor () {
        super()
    }


    public async readImageAsBase64(filePathOrUrl: string): Promise<string> {
        return readImageAsBase64Delegate(filePathOrUrl);
    }


    public dispose() {

    }
}
