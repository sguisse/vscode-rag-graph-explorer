import { CodebaseService } from './domain/service/codebase.service';
import { MockCodebaseAdapter } from './infrastructure/mockCodebaseAdapter';

export const codebaseService = new CodebaseService(new MockCodebaseAdapter());

export * from './domain/model/codebase.model';
export * from './domain/model/codebase.constants';
export * from './domain/rule/transitive-impact.rule';
export * from './domain/rule/codebase-filter.rule';
export * from './domain/rule/markdown-recipe.rule';
export * from './domain/port-out/codebase-repository.port';
export * from './domain/service/codebase.service';
export * from './infrastructure/mockCodebaseAdapter';
