import { useState, useMemo, useCallback } from 'react';

export function useGraphSelection(
    fileLevelEdges: { from: string; to: string; types: Set<string> }[],
    nodeToFileIdMap: Map<string, string>,
    parentDepth: number,
    childDepth: number,
    isHierarchyEnabled: boolean
) {
    const [manualSelectedIds, setManualSelectedIds] = useState<Set<string>>(new Set());
    const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

    // 1. Calculate the impact radius (Callers / Callees) derived from manual selection
    const derivedSelectedIds = useMemo(() => {
        const derived = new Set<string>();
        if (!isHierarchyEnabled || manualSelectedIds.size === 0) return derived;

        const startFileIds = Array.from(manualSelectedIds)
            .map(id => nodeToFileIdMap.get(id))
            .filter(Boolean) as string[];

        startFileIds.forEach(startId => {
            // Propagate to Callees (Children)
            let currentChildLayer = [startId];
            for (let d = 0; d < childDepth; d++) {
                const nextLayer: string[] = [];
                currentChildLayer.forEach(id => {
                    for (const e of fileLevelEdges) {
                        if (e.from === id && !derived.has(e.to) && !manualSelectedIds.has(e.to)) {
                            derived.add(e.to);
                            nextLayer.push(e.to);
                        }
                    }
                });
                currentChildLayer = nextLayer;
            }

            // Propagate to Callers (Parents)
            let currentParentLayer = [startId];
            for (let d = 0; d < parentDepth; d++) {
                const nextLayer: string[] = [];
                currentParentLayer.forEach(id => {
                    for (const e of fileLevelEdges) {
                        if (e.to === id && !derived.has(e.from) && !manualSelectedIds.has(e.from)) {
                            derived.add(e.from);
                            nextLayer.push(e.from);
                        }
                    }
                });
                currentParentLayer = nextLayer;
            }
        });

        return derived;
    }, [manualSelectedIds, nodeToFileIdMap, fileLevelEdges, parentDepth, childDepth, isHierarchyEnabled]);

    // 2. Calculate the final effective selection (Manual + Derived - Excluded)
    const effectiveSelectedNodeIds = useMemo(() => {
        const effective = new Set<string>();

        manualSelectedIds.forEach(id => {
            const fileId = nodeToFileIdMap.get(id) || id;
            effective.add(fileId);
        });

        if (isHierarchyEnabled) {
            derivedSelectedIds.forEach(id => {
                if (!excludedIds.has(id)) effective.add(id);
            });
        }

        return effective;
    }, [manualSelectedIds, derivedSelectedIds, excludedIds, nodeToFileIdMap, isHierarchyEnabled]);

    // 3. Individual toggle controller (Single click)
    const toggleNodeSelection = useCallback((targetId: string, isMultiSelect: boolean = true) => {
        const fileId = nodeToFileIdMap.get(targetId) || targetId;

        setManualSelectedIds(prevManual => {
            const nextManual = new Set(isMultiSelect ? prevManual : []);
            setExcludedIds(prevExcluded => {
                const nextExcluded = new Set(isMultiSelect ? prevExcluded : []);

                const isManual = nextManual.has(targetId);
                const isDerived = derivedSelectedIds.has(fileId);
                const isExcluded = nextExcluded.has(fileId);

                if (isManual) {
                    nextManual.delete(targetId);
                } else if (isDerived && !isExcluded) {
                    nextExcluded.add(fileId);
                } else {
                    nextManual.add(targetId);
                    if (isExcluded) nextExcluded.delete(fileId);
                }

                return nextExcluded;
            });
            return nextManual;
        });
    }, [derivedSelectedIds, nodeToFileIdMap]);

    // 4. Mass selection controller (Checking folders in the tree)
    const setNodesSelectionState = useCallback((ids: string[], checked: boolean) => {
        setManualSelectedIds(prevManual => {
            const nextManual = new Set(prevManual);
            setExcludedIds(prevExcluded => {
                const nextExcluded = new Set(prevExcluded);

                ids.forEach(id => {
                    const fileId = nodeToFileIdMap.get(id) || id;
                    if (checked) {
                        nextManual.add(id);
                        nextExcluded.delete(fileId);
                    } else {
                        nextManual.delete(id);
                        if (derivedSelectedIds.has(fileId)) nextExcluded.add(fileId);
                    }
                });
                return nextExcluded;
            });
            return nextManual;
        });
    }, [derivedSelectedIds, nodeToFileIdMap]);

    const clearSelection = useCallback(() => {
        setManualSelectedIds(new Set());
        setExcludedIds(new Set());
    }, []);

    return {
        manualSelectedIds,
        effectiveSelectedNodeIds,
        toggleNodeSelection,
        setNodesSelectionState,
        clearSelection
    };
}
