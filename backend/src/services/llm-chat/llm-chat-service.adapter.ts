import * as vscode from 'vscode';
import { AbstractServiceAdapter } from "../../core/AbstractServiceAdapter";
import { ILLMChatServicePort } from '../../../../shared/services/llm-chat';

export class LLMChatServiceAdapter extends AbstractServiceAdapter implements ILLMChatServicePort, vscode.Disposable {
    constructor() {
        super();
    }

    public async chat(): Promise<void> {

    }
}
