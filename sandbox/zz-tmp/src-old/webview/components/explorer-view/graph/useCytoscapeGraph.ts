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

        // Core adjustment: render Class topology natively instead of forcing high-level file aggregation blocks
        const classNodes = nodes.filter(n => n.group === 'class');
        const classIds = new Set(classNodes.map(n => n.id));
        const cyElements: any[] = [];

        classNodes.forEach(c => {
            cyElements.push({
                data: { id: c.id, label: c.label, group: c.group }
            });
        });

        // Loop through the precise filtered edge collection mapped straight out of GraphService
        fileLevelEdges.forEach((fe, index) => {
            if (classIds.has(fe.from) && classIds.has(fe.to)) {
                cyElements.push({
                    data: {
                        id: `edge-${index}`,
                        source: fe.from,
                        target: fe.to,
                        type: fe.type
                    }
                });
            }
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
                        cyRef.current.animate({
                            center: { eles: targetNode },
                            zoom: options?.scale || 1.1,
                            duration: options?.animation?.duration || 450,
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
            sviewilize: () => {}
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

                if (applyOnGraph && searchText) {
                    const queryStr = ignoreCase ? searchText.toLowerCase() : searchText;
                    const labelStr = ignoreCase ? node.data('label').toLowerCase() : node.data('label');
                    if (!labelStr.includes(queryStr)) isVisible = false;
                }

                const isExactlySelected = exactSelectedIds.has(id);
                const isContextuallySelected = effectiveFileIds.has(id);

                let opacity = 1;
                if (exactSelectedIds.size > 0) {
                    opacity = (isExactlySelected || isContextuallySelected) ? 1 : 0.15;
                }

                node.style({
                    'display': isVisible ? 'element' : 'none',
                    'opacity': opacity,
                    'border-width': isExactlySelected ? 4 : 2,
                    'border-color': isExactlySelected ? '#007acc' : '#1177bb',
                    'background-color': isExactlySelected ? '#1f8ad2' : '#0e639c'
                });
            });

            cyRef.current!.edges().forEach(edge => {
                const sourceId = edge.source().id();
                const targetId = edge.target().id();
                const isHighlighted = exactSelectedIds.has(sourceId) || exactSelectedIds.has(targetId);

                let opacity = 0.65;
                if (exactSelectedIds.size > 0) {
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
