import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import { GraphNode } from '../../../types';
import { getGraphStyle, layoutOptions } from './GraphConfig';

interface UseCytoscapeGraphProps {
    nodes: GraphNode[];
    fileLevelEdges: any[];
    nodeToFileIdMap: Map<string, string>;
    effectiveFileIds: Set<string>;
    exactSelectedIds: Set<string>;
    toggleNodeSelection: (id: string) => void;
    clearSelection: () => void;
    applyOnGraph: boolean;
    selectedTypes: string[];
    searchText: string;
    searchMode: string;
    isRegexEnabled: boolean;
    ignoreCase: boolean;
    isTreeCollapsed: boolean;
    isMaximized: boolean;
}

export function useCytoscapeGraph({
    nodes,
    fileLevelEdges,
    nodeToFileIdMap,
    effectiveFileIds,
    exactSelectedIds,
    toggleNodeSelection,
    clearSelection,
    applyOnGraph,
    selectedTypes,
    searchText,
    searchMode,
    isRegexEnabled,
    ignoreCase,
    isTreeCollapsed,
    isMaximized
}: UseCytoscapeGraphProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<cytoscape.Core | null>(null);
    const networkRef = useRef<any>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const fileNodes = nodes.filter(n => n.group === 'file' || n.group === 'file_unreferenced');
        const cyElements: any[] = [];

        fileNodes.forEach(f => {
            cyElements.push({
                data: { id: f.id, label: f.label, group: f.group }
            });
        });

        fileLevelEdges.forEach((fe, index) => {
            cyElements.push({
                data: { id: `edge-${index}`, source: fe.from, target: fe.to, type: Array.from(fe.types).join(', ') }
            });
        });

        const cy = cytoscape({
            container: containerRef.current,
            elements: cyElements,
            boxSelectionEnabled: false,
            style: getGraphStyle(),
            layout: layoutOptions as any
        });

        cyRef.current = cy;

        networkRef.current = {
            fit: () => {
                if (cyRef.current) {
                    cyRef.current.animate({
                        fit: { eles: cyRef.current.elements(), padding: 40 },
                        duration: 350
                    });
                }
            },
            focus: (nodeId: string, options?: any) => {
                if (cyRef.current) {
                    const targetNode = cyRef.current.$(`[id = "${nodeId}"]`);
                    if (targetNode.length) {
                        // Core camera repositioning workflow
                        cyRef.current.animate({
                            center: { eles: targetNode },
                            zoom: options?.scale || 1.1,
                            duration: options?.animation?.duration || 450,
                            // High visibility flashing pipeline triggered only when camera translation is fully done
                            complete: () => {
                                const targetBg = targetNode.style('background-color');
                                const targetBorderColor = targetNode.style('border-color');
                                const targetBorderWidth = targetNode.style('border-width');
                                const targetWidth = targetNode.style('width');
                                const targetHeight = targetNode.style('height');

                                targetNode.animate({
                                    style: {
                                        'width': 55,
                                        'height': 55,
                                        'background-color': '#ffeb3b',
                                        'border-color': '#ffffff',
                                        'border-width': 4
                                    },
                                    duration: 150
                                }).animate({
                                    style: {
                                        'width': targetWidth,
                                        'height': targetHeight,
                                        'background-color': targetBg,
                                        'border-color': targetBorderColor,
                                        'border-width': targetBorderWidth
                                    },
                                    duration: 250
                                });
                            }
                        } as any);
                    }
                }
            },
            setOptions: () => {},
            stabilize: () => {}
        };

        cy.on('tap', 'node', (evt) => {
            const node = evt.target;
            const nodeId = node.id();
            const srcEvent = evt.originalEvent;
            const isMultiSelect = srcEvent ? (srcEvent.ctrlKey || srcEvent.metaKey) : false;

            if (!isMultiSelect) {
                clearSelection();
            }
            toggleNodeSelection(nodeId);
        });

        cy.on('tap', (evt) => {
            if (evt.target === cy) {
                const srcEvent = evt.originalEvent;
                const isMultiSelect = srcEvent ? (srcEvent.ctrlKey || srcEvent.metaKey) : false;
                if (!isMultiSelect) {
                    clearSelection();
                }
            }
        });

        return () => {
            cy.destroy();
        };
    }, [nodes, fileLevelEdges, toggleNodeSelection, clearSelection]);

    useEffect(() => {
        if (!cyRef.current) return;
        cyRef.current.batch(() => {
            cyRef.current!.nodes().forEach(node => {
                const id = node.id();
                let isVisible = true;

                if (applyOnGraph) {
                    const relatedNodes = nodes.filter(n => nodeToFileIdMap.get(n.id) === id);
                    const filteredRelated = selectedTypes.length > 0 ? relatedNodes.filter(rn => selectedTypes.includes(rn.group)) : relatedNodes;
                    if (filteredRelated.length === 0) isVisible = false;
                    else if (searchText) {
                        const queryStr = ignoreCase ? searchText.toLowerCase() : searchText;
                        const matchesSearch = filteredRelated.some(rn => {
                            const labelStr = ignoreCase ? rn.label.toLowerCase() : rn.label;
                            const pathStr = rn.source_file ? (ignoreCase ? rn.source_file.toLowerCase() : rn.source_file) : '';

                            if (isRegexEnabled) {
                                try {
                                    return new RegExp(queryStr).test(labelStr) || new RegExp(queryStr).test(pathStr);
                                } catch { return true; }
                            } else {
                                if (searchMode === 'exact') {
                                    return labelStr === queryStr || pathStr === queryStr;
                                } else if (searchMode === 'starts') {
                                    return labelStr.startsWith(queryStr) || pathStr.startsWith(queryStr);
                                } else {
                                    return labelStr.includes(queryStr) || pathStr.includes(queryStr);
                                }
                            }
                        });
                        if (!matchesSearch) isVisible = false;
                    }
                }

                const isContextuallySelected = effectiveFileIds.has(id);
                const isExactlySelected = exactSelectedIds.has(id);

                let opacity = 1;
                if (effectiveFileIds.size > 0) {
                    opacity = isContextuallySelected ? 1 : 0.15;
                }

                node.style({
                    'display': isVisible ? 'element' : 'none',
                    'opacity': opacity,
                    'border-width': isExactlySelected ? 4 : (isContextuallySelected ? 2.5 : (node.data('group') === 'file_unreferenced' ? 2.5 : 2)),
                    'border-color': isExactlySelected ? '#007acc' : (isContextuallySelected ? '#3b82f6' : (node.data('group') === 'file_unreferenced' ? '#000000' : '#1177bb')),
                    'background-color': isExactlySelected ? '#1f8ad2' : (node.data('group') === 'file_unreferenced' ? '#3a1e22' : '#0e639c')
                });
            });

            cyRef.current!.edges().forEach(edge => {
                const sourceId = edge.source().id();
                const targetId = edge.target().id();
                const isHighlighted = effectiveFileIds.has(sourceId) && effectiveFileIds.has(targetId);

                let opacity = 0.65;
                if (effectiveFileIds.size > 0) {
                    opacity = isHighlighted ? 1 : 0.05;
                }

                edge.style({
                    'line-color': isHighlighted ? '#3b82f6' : '#444444',
                    'target-arrow-color': isHighlighted ? '#3b82f6' : '#444444',
                    'width': isHighlighted ? 2.5 : 1.5,
                    'opacity': opacity
                });
            });
        });
    }, [effectiveFileIds, exactSelectedIds, applyOnGraph, selectedTypes, searchText, searchMode, isRegexEnabled, ignoreCase, nodes, fileLevelEdges, nodeToFileIdMap]);

    useEffect(() => {
        if (cyRef.current) {
            setTimeout(() => {
                cyRef.current?.resize();
            }, 150);
        }
    }, [isTreeCollapsed, isMaximized]);

    return { containerRef, networkRef };
}
