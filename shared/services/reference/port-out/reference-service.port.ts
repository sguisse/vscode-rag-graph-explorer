import { ReferenceItem } from '../model/reference-model';

export interface IReferenceServicePort {
    loadAllReferences(storageKey?: string): Promise<ReferenceItem[]>;
    save(storageKey: string, reference: ReferenceItem): Promise<ReferenceItem>;
    update(storageKey: string, reference: ReferenceItem): Promise<ReferenceItem>;
    delete(storageKey: string, id: string): Promise<void>;
}
