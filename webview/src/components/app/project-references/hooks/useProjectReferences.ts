import { useState, useEffect, useMemo } from 'react';
import { referenceApiService } from '@/services/api/reference-api.service.gen';
import {ReferenceItem, REFERENCES_PROJECT_KEY } from '@/shared/services/reference/model/reference-model';
import {
  RefSortField,
  RefSortRule,
  ProjectReferencesViewMode,
} from '../model/prj-model-ui';

export function useProjectReferences(
  localDocumentStorage: string = REFERENCES_PROJECT_KEY,
  initialViewMode: ProjectReferencesViewMode = 'User'
) {
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [initialDefaults, setInitialDefaults] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ProjectReferencesViewMode>(initialViewMode);

  // Filter & Grouping States
  const [isGrouped, setIsGrouped] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [emojiFilter, setEmojiFilter] = useState<string>('all');
  const [selectedOnly, setSelectedOnly] = useState<boolean>(false);
  const [globalFilter, setGlobalFilter] = useState<string>('');

  // Column Visibility Toggles
  const [hideDescription, setHideDescription] = useState<boolean>(false);
  const [hideUrl, setHideUrl] = useState<boolean>(false);

  const [sortRules, setSortRules] = useState<RefSortRule[]>([
    { field: 'category', order: 'asc' },
    { field: 'name', order: 'asc' },
  ]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const fetchReferences = async () => {
    setLoading(true);
    try {
      const data = await referenceApiService.loadAllReferences(localDocumentStorage);
      setReferences(data);

      const defaultsMap: Record<string, boolean> = {};
      const catMap: Record<string, boolean> = {};
      data.forEach((r) => {
        defaultsMap[r.id] = !!r.preSelected;
        catMap[r.category] = true;
      });

      setInitialDefaults((prev) => (Object.keys(prev).length === 0 ? defaultsMap : prev));
      setExpandedCategories((prev) => ({ ...catMap, ...prev }));
    } catch (err) {
      console.error('[useProjectReferences] Failed to load references', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferences();
  }, [localDocumentStorage]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    references.forEach((r) => set.add(r.category));
    return Array.from(set);
  }, [references]);

  const emojis = useMemo(() => {
    const set = new Set<string>();
    references.forEach((r) => {
      if (r.emoji) set.add(r.emoji);
    });
    return Array.from(set);
  }, [references]);

  const handleSort = (field: RefSortField, isShiftPressed: boolean = false) => {
    setSortRules((prevRules) => {
      const existingIndex = prevRules.findIndex((r) => r.field === field);

      if (isShiftPressed) {
        if (existingIndex !== -1) {
          const currentOrder = prevRules[existingIndex].order;
          if (currentOrder === 'asc') {
            const next = [...prevRules];
            next[existingIndex] = { field, order: 'desc' };
            return next;
          } else {
            return prevRules.filter((_, idx) => idx !== existingIndex);
          }
        } else {
          return [...prevRules, { field, order: 'asc' }];
        }
      } else {
        if (existingIndex !== -1 && prevRules.length === 1) {
          return [{ field, order: prevRules[0].order === 'asc' ? 'desc' : 'asc' }];
        }
        return [{ field, order: 'asc' }];
      }
    });
  };

  const clearSort = () => {
    setSortRules([{ field: 'category', order: 'asc' }, { field: 'name', order: 'asc' }]);
  };

  const toggleCategoryExpand = (catName: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName],
    }));
  };

  const expandAllCategories = () => {
    const allExpanded: Record<string, boolean> = {};
    categories.forEach((cat) => {
      allExpanded[cat] = true;
    });
    setExpandedCategories(allExpanded);
  };

  const collapseAllCategories = () => {
    const allCollapsed: Record<string, boolean> = {};
    categories.forEach((cat) => {
      allCollapsed[cat] = false;
    });
    setExpandedCategories(allCollapsed);
  };

  const toggleCategorySelectAll = async (catName: string) => {
    const catRefs = references.filter((r) => r.category === catName);
    if (catRefs.length === 0) return;

    const selectedCount = catRefs.filter((r) => r.preSelected).length;
    const nextSelectedState = selectedCount < catRefs.length;

    const updated = references.map((r) => {
      if (r.category === catName) {
        return { ...r, preSelected: nextSelectedState };
      }
      return r;
    });

    setReferences(updated);
    for (const r of updated.filter((x) => x.category === catName)) {
      await referenceApiService.update(localDocumentStorage, r);
    }
  };

  const toggleReferenceSelect = async (id: string) => {
    const target = references.find((r) => r.id === id);
    if (!target) return;
    const updatedRef = { ...target, preSelected: !target.preSelected };

    setReferences((prev) => prev.map((r) => (r.id === id ? updatedRef : r)));
    await referenceApiService.update(localDocumentStorage, updatedRef);
  };

  const addReference = async (newRef: Omit<ReferenceItem, 'id'>) => {
    const now = new Date().toISOString();
    const item: ReferenceItem = {
      ...newRef,
      id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      addedAt: now,
      updatedAt: now,
      changeDetected: 0,
    };
    await referenceApiService.save(localDocumentStorage, item);
    await fetchReferences();
    return item;
  };

  const removeReference = async (id: string) => {
    await referenceApiService.delete(localDocumentStorage, id);
    setReferences((prev) => prev.filter((r) => r.id !== id));
  };

  const removeSelectedReferences = async () => {
    const selectedList = references.filter((r) => r.preSelected);
    if (selectedList.length === 0) return;

    setLoading(true);
    try {
      for (const item of selectedList) {
        await referenceApiService.delete(localDocumentStorage, item.id);
      }
      await fetchReferences();
    } catch (err) {
      console.error('[useProjectReferences] Failed to remove selected references', err);
    } finally {
      setLoading(false);
    }
  };

  const reloadReference = async (id: string) => {
    const target = references.find((r) => r.id === id);
    if (!target || !target.url) return;

    setImporting(true);
    try {
      const { content, sizeKb } = await referenceApiService.readUrlContent(target.url);
      const now = new Date().toISOString();
      const updated: ReferenceItem = {
        ...target,
        content,
        sizeKb,
        updatedAt: now,
        changeDetected: 0,
      };
      await referenceApiService.update(localDocumentStorage, updated);
      setReferences((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (err) {
      console.error('[useProjectReferences] Failed to reload reference content', err);
    } finally {
      setImporting(false);
    }
  };

  const reloadSelectedReferences = async () => {
    const selectedList = references.filter((r) => r.preSelected && r.url);
    if (selectedList.length === 0) return;

    setImporting(true);
    try {
      const now = new Date().toISOString();
      for (const item of selectedList) {
        const { content, sizeKb } = await referenceApiService.readUrlContent(item.url);
        const updated: ReferenceItem = {
          ...item,
          content,
          sizeKb,
          updatedAt: now,
          changeDetected: 0,
        };
        await referenceApiService.update(localDocumentStorage, updated);
      }
      await fetchReferences();
    } catch (err) {
      console.error('[useProjectReferences] Failed to reload selected references', err);
    } finally {
      setImporting(false);
    }
  };

  const importUrl = async (url: string) => {
    if (!url) return null;
    setImporting(true);
    try {
      const result = await referenceApiService.readUrlContent(url);
      return result;
    } catch (err) {
      console.error('[useProjectReferences] Failed to import URL', err);
      return null;
    } finally {
      setImporting(false);
    }
  };

  const filteredReferences = useMemo(() => {
    const search = globalFilter.trim().toLowerCase();
    return references.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (emojiFilter !== 'all' && item.emoji !== emojiFilter) return false;
      if (selectedOnly && !item.preSelected) return false;

      if (search) {
        const matchName = item.name.toLowerCase().includes(search);
        const matchCategory = item.category.toLowerCase().includes(search);
        const matchDesc = item.description.toLowerCase().includes(search);
        const matchUrl = item.url.toLowerCase().includes(search);
        const matchEmoji = item.emoji.toLowerCase().includes(search);
        return matchName || matchCategory || matchDesc || matchUrl || matchEmoji;
      }
      return true;
    });
  }, [references, categoryFilter, emojiFilter, selectedOnly, globalFilter]);

  const sortedReferences = useMemo(() => {
    if (sortRules.length === 0) return filteredReferences;

    return [...filteredReferences].sort((a, b) => {
      for (const rule of sortRules) {
        let valA: string | number | boolean = '';
        let valB: string | number | boolean = '';

        switch (rule.field) {
          case 'category':
            valA = (a.category || '').toLowerCase();
            valB = (b.category || '').toLowerCase();
            break;
          case 'preSelected':
            valA = a.preSelected ? 1 : 0;
            valB = b.preSelected ? 1 : 0;
            break;
          case 'name':
            valA = (a.name || '').toLowerCase();
            valB = (b.name || '').toLowerCase();
            break;
          case 'transformer':
            valA = a.transformer ? 1 : 0;
            valB = b.transformer ? 1 : 0;
            break;
          case 'sizeKb':
            valA = a.sizeKb ?? 0;
            valB = b.sizeKb ?? 0;
            break;
          case 'sizeKbAfterTransformation':
            valA = a.sizeKbAfterTransformation ?? 0;
            valB = b.sizeKbAfterTransformation ?? 0;
            break;
          case 'updatedAt':
            valA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            valB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            break;
        }

        if (valA < valB) return rule.order === 'asc' ? -1 : 1;
        if (valA > valB) return rule.order === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredReferences, sortRules]);

  const groupedReferences = useMemo(() => {
    const groups: Record<string, ReferenceItem[]> = {};
    sortedReferences.forEach((r) => {
      if (!groups[r.category]) {
        groups[r.category] = [];
      }
      groups[r.category].push(r);
    });
    return groups;
  }, [sortedReferences]);

  const categorySelectionStates = useMemo(() => {
    const states: Record<string, boolean | 'indeterminate'> = {};
    Object.entries(groupedReferences).forEach(([cat, items]) => {
      const selectedCount = items.filter((i) => i.preSelected).length;
      if (items.length > 0 && selectedCount === items.length) {
        states[cat] = true;
      } else if (selectedCount > 0) {
        states[cat] = 'indeterminate';
      } else {
        states[cat] = false;
      }
    });
    return states;
  }, [groupedReferences]);

  const globalSelectionState = useMemo<boolean | 'indeterminate'>(() => {
    if (filteredReferences.length === 0) return false;
    const selectedCount = filteredReferences.filter((r) => r.preSelected).length;
    if (selectedCount === filteredReferences.length) return true;
    if (selectedCount > 0) return 'indeterminate';
    return false;
  }, [filteredReferences]);

  const toggleAllSelect = async () => {
    if (filteredReferences.length === 0) return;
    const allSelected = filteredReferences.every((r) => r.preSelected);
    const nextState = !allSelected;
    const filteredIds = new Set(filteredReferences.map((r) => r.id));

    const updated = references.map((r) => {
      if (filteredIds.has(r.id)) {
        return { ...r, preSelected: nextState };
      }
      return r;
    });

    setReferences(updated);
    for (const r of updated.filter((x) => filteredIds.has(x.id))) {
      await referenceApiService.update(localDocumentStorage, r);
    }
  };

  const resetSelection = async () => {
    const updated = references.map((r) => ({
      ...r,
      preSelected: initialDefaults[r.id] ?? true,
    }));

    setReferences(updated);
    for (const r of updated) {
      await referenceApiService.update(localDocumentStorage, r);
    }
  };

  // Selected counts (Total selected across entire dataset)
  const totalSelectedCount = useMemo(() => references.filter((r) => r.preSelected).length, [references]);
  const totalSelectedSizeKb = useMemo(
    () => Number(references.filter((r) => r.preSelected).reduce((acc, r) => acc + (r.sizeKb || 0), 0).toFixed(2)),
    [references]
  );

  // Total references loaded from YAML file
  const totalAllCount = references.length;
  const totalAllSizeKb = useMemo(
    () => Number(references.reduce((acc, r) => acc + (r.sizeKb || 0), 0).toFixed(2)),
    [references]
  );

  const totalCount = filteredReferences.length;
  const totalSizeKb = useMemo(
    () => Number(filteredReferences.reduce((acc, r) => acc + (r.sizeKb || 0), 0).toFixed(2)),
    [filteredReferences]
  );

  return {
    references,
    filteredReferences,
    sortedReferences,
    groupedReferences,
    categories,
    emojis,
    categorySelectionStates,
    globalSelectionState,
    loading,
    importing,
    viewMode,
    setViewMode,
    isGrouped,
    setIsGrouped,
    categoryFilter,
    setCategoryFilter,
    emojiFilter,
    setEmojiFilter,
    selectedOnly,
    setSelectedOnly,
    globalFilter,
    setGlobalFilter,
    hideDescription,
    setHideDescription,
    hideUrl,
    setHideUrl,
    sortRules,
    handleSort,
    clearSort,
    expandedCategories,
    toggleCategoryExpand,
    expandAllCategories,
    collapseAllCategories,
    toggleCategorySelectAll,
    toggleReferenceSelect,
    toggleAllSelect,
    resetSelection,
    addReference,
    removeReference,
    removeSelectedReferences,
    reloadReference,
    reloadSelectedReferences,
    importUrl,
    totalSelectedCount,
    totalSelectedSizeKb,
    totalAllCount,
    totalAllSizeKb,
    totalCount,
    totalSizeKb,
    refetch: fetchReferences,
  };
}
