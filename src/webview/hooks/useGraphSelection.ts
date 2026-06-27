import { useState, useMemo, useCallback } from 'react';

export function useGraphSelection(
    fileLevelEdges: { from: string; to: string; types: Set<string> }[],
    nodeToFileIdMap: Map<string, string>,
    parentDepth: number,
    childDepth: number,
    isHierarchyEnabled: boolean
) {
    // REGISTRY A: Exact Entities manually clicked/checked by the user
    const [exactSelectedIds, setExactSelectedIds] = useState<Set<string>>(new Set());

    // Map exact entities to their parent File IDs for the graph context
    const manualFileIds = useMemo(() => {
        const fileIds = new Set<string>();
        exactSelectedIds.forEach(id => {
            const fileId = nodeToFileIdMap.get(id) || id;
            fileIds.add(fileId);
        });
        return fileIds;
    }, [exactSelectedIds, nodeToFileIdMap]);

    // REGISTRY B: Effective File Context (Manual + Derived Callers/Callees)
    const effectiveFileIds = useMemo(() => {
        const effective = new Set<string>(manualFileIds);

        // If hierarchy sync is disabled, we only highlight the exact files selected
        if (!isHierarchyEnabled || manualFileIds.size === 0) return effective;

        // BFS Traversal for callers and callees
        Array.from(manualFileIds).forEach(startId => {
            // Propagate downstream (Callees)
            let currentChildLayer = [startId];
            for (let d = 0; d < childDepth; d++) {
                const nextLayer: string[] = [];
                currentChildLayer.forEach(id => {
                    for (const e of fileLevelEdges) {
                        if (e.from === id && !effective.has(e.to)) {
                            effective.add(e.to);
                            nextLayer.push(e.to);
                        }
                    }
                });
                currentChildLayer = nextLayer;
            }

            // Propagate upstream (Callers)
            let currentParentLayer = [startId];
            for (let d = 0; d < parentDepth; d++) {
                const nextLayer: string[] = [];
                currentParentLayer.forEach(id => {
                    for (const e of fileLevelEdges) {
                        if (e.to === id && !effective.has(e.from)) {
                            effective.add(e.from);
                            nextLayer.push(e.from);
                        }
                    }
                });
                currentParentLayer = nextLayer;
            }
        });

        return effective;
    }, [manualFileIds, fileLevelEdges, parentDepth, childDepth, isHierarchyEnabled]);

    // Interaction Parity: 100% stable reference via functional state updates.
    // A single click ALWAYS toggles the specific ID without destroying the rest of the selection.
    const toggleNodeSelection = useCallback((targetId: string) => {
        setExactSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(targetId)) {
                next.delete(targetId);
            } else {
                next.add(targetId);
            }
            return next;
        });
    }, []);

    // Mass selection from TreeView group checkboxes
    const setNodesSelectionState = useCallback((ids: string[], checked: boolean) => {
        setExactSelectedIds(prev => {
            const next = new Set(prev);
            ids.forEach(id => {
                if (checked) next.add(id);
                else next.delete(id);
            });
            return next;
        });
    }, []);

    const clearSelection = useCallback(() => {
        setExactSelectedIds(new Set());
    }, []);

    return {
        exactSelectedIds,
        effectiveFileIds,
        toggleNodeSelection,
        setNodesSelectionState,
        clearSelection
    };
}
