import { AbstractApiService } from './abstract-api.service';
import { ReferenceItem } from '@/components/app/project-references/model/prj-model-ui';

class SdlcReferencesApiService extends AbstractApiService {
  private inMemoryStore: Map<string, ReferenceItem[]> = new Map();

  constructor() {
    super();
  }

  public async loadAllReferences(storageKey: string = 'default'): Promise<ReferenceItem[]> {
    if (!this.inMemoryStore.has(storageKey)) {
      const now = new Date().toISOString();
      const initial: ReferenceItem[] = [
        {
          id: 'ref-1',
          emoji: '🏗️',
          name: 'System Architecture Specs',
          description: 'High-level system design and component topology',
          category: 'Architecture & Design',
          url: 'https://raw.githubusercontent.com/bmad-method/specs/main/arch.md',
          preSelected: true,
          sizeKb: 14.5,
          content: '# System Architecture\n- Monorepo design\n- React + Webview messaging',
          addedAt: now,
          updatedAt: now,
          changeDetected: 5, // 1% < 5% <= 10% -> Blue
        },
        {
          id: 'ref-2',
          emoji: '📐',
          name: 'API Contracts & Schemas',
          description: 'OpenAPI 3.0 specification for SDLC endpoints',
          category: 'Architecture & Design',
          url: 'https://api.internal/v1/openapi.yaml',
          preSelected: true,
          sizeKb: 28.2,
          content: 'openapi: 3.0.0\ninfo:\n  title: SDLC API\n  version: 1.0.0',
          addedAt: now,
          updatedAt: now,
          changeDetected: 15, // 10% < 15% <= 20% -> Orange
        },
        {
          id: 'ref-3',
          emoji: '📊',
          name: 'BMad Skills Schema Configuration',
          description: 'Local skill definitions and domain prompts YAML',
          category: 'Domain Reference',
          url: 'webview/src/features/sdlc/domains/instructions/bmad-method/data/bmad-skills-by-category.yaml',
          preSelected: true,
          sizeKb: 18.7,
          content: 'skills:\n  - name: Analysis\n  - name: Planning',
          addedAt: now,
          updatedAt: now,
          changeDetected: 28, // > 20% -> Red
        },
        {
          id: 'ref-4',
          emoji: '📝',
          name: 'Project Coding Standards',
          description: 'Linting, styling and commit conventions',
          category: 'Guidelines',
          url: 'https://docs.internal/guidelines.md',
          preSelected: false,
          sizeKb: 8.1,
          content: 'Standard operating procedures...',
          addedAt: now,
          updatedAt: now,
          changeDetected: 0, // <= 1% -> Default
        },
      ];
      this.inMemoryStore.set(storageKey, initial);
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
