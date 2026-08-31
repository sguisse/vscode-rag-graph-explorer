import { ReferenceItem } from '@/shared/services/reference/model/reference-model';
import { AbstractApiService } from './abstract-api.service';
import MOCK_REFERENCES from './mock/sdlc-references-api.mock-data.yaml';

class SdlcReferencesApiService extends AbstractApiService {
  private inMemoryStore: Map<string, ReferenceItem[]> = new Map();

  constructor() {
    super();
  }

  public async loadAllReferences(storageKey: string = 'default'): Promise<ReferenceItem[]> {
    if (!this.inMemoryStore.has(storageKey)) {
      const initialData = (MOCK_REFERENCES || []) as ReferenceItem[];
      this.inMemoryStore.set(storageKey, [...initialData]);
    }
    return this.inMemoryStore.get(storageKey) || [];
  }

  public async save(storageKey: string, reference: ReferenceItem): Promise<ReferenceItem> {
    const list = await this.loadAllReferences(storageKey);
    const existingIndex = list.findIndex((r) => r.id === reference.id);
    if (existingIndex !== -1) {
      list[existingIndex] = reference;
    } else {
      list.push(reference);
    }
    this.inMemoryStore.set(storageKey, [...list]);
    return reference;
  }

  public async update(storageKey: string, reference: ReferenceItem): Promise<ReferenceItem> {
    return this.save(storageKey, reference);
  }

  public async delete(storageKey: string, id: string): Promise<void> {
    const list = await this.loadAllReferences(storageKey);
    const filtered = list.filter((r) => r.id !== id);
    this.inMemoryStore.set(storageKey, filtered);
  }

  public async readUrlContent(url: string): Promise<{ content: string; sizeKb: number }> {
    try {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const response = await fetch(url);
        if (response.ok) {
          const text = await response.text();
          const sizeKb = Number((new Blob([text]).size / 1024).toFixed(2));
          return { content: text, sizeKb: Math.max(0.1, sizeKb) };
        }
      }
    } catch {
      // Fallback for offline / plugin execution environment
    }

    const mockContent = `# Imported Reference Content from ${url}\n\nURL: ${url}\nLoaded At: ${new Date().toLocaleString()}\n\n[CONTEXT DATA]\n- Updated configuration payload loaded.`;
    const sizeKb = Number((new Blob([mockContent]).size / 1024).toFixed(2));
    return { content: mockContent, sizeKb: Math.max(0.5, sizeKb) };
  }
}

export const sdlcReferencesApiService = new SdlcReferencesApiService();
