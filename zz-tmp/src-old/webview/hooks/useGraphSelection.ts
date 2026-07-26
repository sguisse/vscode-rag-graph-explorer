import { useState, useMemo, useCallback, useEffect } from 'react';

export function useGraphSelection(
    fileLevelEdges: { from: string; to: string; types: Set<string> }[],
    nodeToFileIdMap: Map<string, string>,
    parentDepth: number,
    childDepth: number,
    isHierarchyEnabled: boolean
) {
    const [exactSelectedIds, setExactSelectedIds] = useState<Set<string>>(new Set());

    const manualFileIds = useMemo(() => {
        const fileIds = new Set<string>();
        exactSelectedIds.forEach(id => {
            const fileId = nodeToFileIdMap.get(id) || id;
            fileIds.add(fileId);
        });
        return fileIds;
    }, [exactSelectedIds, nodeToFileIdMap]);

    const effectiveFileIds = useMemo(() => {
        const effective = new Set<string>(manualFileIds);

        if (!isHierarchyEnabled || manualFileIds.size === 0) {
            return effective;
        }

        Array.from(manualFileIds).forEach(startId => {
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

    // Relocate side-effect logging to a safe useEffect lifecycle phase to eliminate App component render-phase updates
    useEffect(() => {
        if (typeof (window as any).logToTerminal === 'function') {
            if (!isHierarchyEnabled || manualFileIds.size === 0) {
                (window as any).logToTerminal('debug', `Registry B recalculated (Flat Mode). Effective Files: ${effectiveFileIds.size}`);
            } else {
                (window as any).logToTerminal('debug', `Registry B recalculated (Hierarchy Sync Link). Manual Base: ${manualFileIds.size} ➔ Total Effective Files Context: ${effectiveFileIds.size}`);
            }
        }
    }, [effectiveFileIds, manualFileIds, isHierarchyEnabled]);

    const toggleNodeSelection = useCallback((targetId: string) => {
        setExactSelectedIds(prev => {
            const next = new Set(prev);
            const isChecked = next.has(targetId);
            if (isChecked) {
                next.delete(targetId);
            } else {
                next.add(targetId);
            }
            if (typeof (window as any).logToTerminal === 'function') {
                (window as any).logToTerminal('info', `🎯 Transaction: toggleNodeSelection ID=[${targetId}] | PriorState=${isChecked ? 'Checked' : 'Unchecked'} ➔ New Registry A Size: ${next.size}`);
            }
            return next;
        });
    }, []);

    const setNodesSelectionState = useCallback((ids: string[], checked: boolean) => {
        setExactSelectedIds(prev => {
            const next = new Set(prev);
            ids.forEach(id => {
                if (checked) next.add(id);
                else next.delete(id);
            });
            if (typeof (window as any).logToTerminal === 'function') {
                (window as any).logToTerminal('info', `📦 Mass Transaction: setNodesSelectionState -> TargetState=${checked} | Actioned IDs Count: ${ids.length} ➔ New Registry A Size: ${next.size}`);
            }
            return next;
        });
    }, []);

    const clearSelection = useCallback(() => {
        if (typeof (window as any).logToTerminal === 'function') {
            (window as any).logToTerminal('warn', `🗑️ Transaction: clearSelection invoked. Purging total Registry A!`);
        }
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
