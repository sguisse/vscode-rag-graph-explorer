import { ReferenceItem, ReferenceFiles } from '../model/reference-model';

export interface IReferenceServicePort {
    loadAllReferences(storageKey?: string): Promise<ReferenceItem[]>;
    loadReferenceFiles(id: string): Promise<ReferenceFiles>;
    save(storageKey: string, reference: ReferenceItem, initialContent?: string): Promise<ReferenceItem>;
    update(storageKey: string, reference: ReferenceItem): Promise<ReferenceItem>;
    delete(storageKey: string, id: string): Promise<void>;
}
