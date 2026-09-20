import React, { useState, useMemo, useRef, useEffect } from 'react';
        import { CornerDownLeft, Plus } from 'lucide-react';
        import { useBookmarksStore } from '../store/useBookmarksStore';
        import { BookmarkCard } from './BookmarkCard';
        import { BookmarkCard as CardType, Bookmark, GridPosition } from '../types/bookmarks.types';
        import { useGridPhysics } from '../hooks/useGridPhysics';

        interface BookmarksPanelProps {
          onEditCard?: (card: CardType) => void;
          onDeleteCard?: (card: CardType) => void;
          onAddBookmark?: (cardId: string) => void;
          onEditBookmark?: (cardId: string, bookmark: Bookmark) => void;
          onDeleteBookmark?: (cardId: string, bookmarkId: string) => void;
          onOpenReader?: (bm: Bookmark) => void;
          onAddNewCard?: () => void;
        }

        export const BookmarksPanel: React.FC<BookmarksPanelProps> = ({
          onEditCard = () => {},
          onDeleteCard = () => {},
          onAddBookmark = () => {},
          onEditBookmark = () => {},
          onDeleteBookmark = () => {},
          onOpenReader = () => {},
          onAddNewCard = () => {}
        }) => {
          const { tabs, activeTabId, setTabs, globalSettings, currentUser } = useBookmarksStore();
          const { computeCompactPositions, findNearestFreeSlot } = useGridPhysics();

          const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
          const [cardHoverTargetId, setCardHoverTargetId] = useState<string | null>(null);
          const [dragGhostPos, setDragGhostPos] = useState<GridPosition | null>(null);
          const [previewDisplacedOrder, setPreviewDisplacedOrder] = useState<string[] | null>(null);
          const [previewDisplacedPositions, setPreviewDisplacedPositions] = useState<Record<string, GridPosition>>({});
          const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
          const [isCmdPressed, setIsCmdPressed] = useState(false);

          const canvasRef = useRef<HTMLDivElement>(null);

          const clearDragGhost = () => {
            setDraggedCardId(null);
            setCardHoverTargetId(null);
            setDragGhostPos(null);
            setPreviewDisplacedOrder(null);
            setPreviewDisplacedPositions({});
          };

          useEffect(() => {
            const handleKeyDown = (e: KeyboardEvent) => {
              if (e.key === 'Meta' || e.key === 'Control') setIsCmdPressed(true);
              if (e.key === 'Escape') {
                clearDragGhost();
              }
            };
            const handleKeyUp = (e: KeyboardEvent) => {
              if (e.key === 'Meta' || e.key === 'Control') setIsCmdPressed(false);
            };
            const handleGlobalDragEnd = () => {
              clearDragGhost();
            };

            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);
            window.addEventListener('dragend', handleGlobalDragEnd);
            return () => {
              window.removeEventListener('keydown', handleKeyDown);
              window.removeEventListener('keyup', handleKeyUp);
              window.removeEventListener('dragend', handleGlobalDragEnd);
            };
          }, []);

          const activeTab = useMemo(() => {
            return tabs.find(t => t.id === activeTabId) || tabs[0];
          }, [tabs, activeTabId]);

          const effectiveSettings = useMemo(() => {
            const overrides = activeTab?.overrides || {};
            return {
              nbCols: overrides.nbCols ?? globalSettings.nbCols,
              nbRowsMax: overrides.nbRowsMax ?? globalSettings.nbRowsMax,
              rowHeight: overrides.rowHeight ?? globalSettings.rowHeight,
              gapX: overrides.gapX ?? globalSettings.gapX,
              gapY: overrides.gapY ?? globalSettings.gapY,
              showGridLines: overrides.showGridLines ?? globalSettings.showGridLines,
              cardsCollisionAlgo: overrides.cardsCollisionAlgo ?? globalSettings.cardsCollisionAlgo,
              defaultCardHeaderBgColor: overrides.defaultCardHeaderBgColor ?? globalSettings.defaultCardHeaderBgColor,
              defaultCardHeaderTextColor: overrides.defaultCardHeaderTextColor ?? globalSettings.defaultCardHeaderTextColor,
              hidePrivate: overrides.hidePrivate ?? globalSettings.hidePrivate,
            };
          }, [activeTab, globalSettings]);

          const visibleCards = useMemo(() => {
            if (!activeTab) return [];
            let baseCards = activeTab.cards.filter(c => {
              if (effectiveSettings.hidePrivate && c.isPrivate) return false;
              if (c.isPrivate && c.owner !== currentUser.id) return false;
              return true;
            });

            if (previewDisplacedOrder && previewDisplacedOrder.length > 0) {
              const map = new Map(baseCards.map(c => [c.id, c]));
              const reordered = previewDisplacedOrder.map(id => map.get(id)).filter(Boolean) as CardType[];
              baseCards.forEach(c => {
                if (!previewDisplacedOrder.includes(c.id)) reordered.push(c);
              });
              return reordered;
            }

            return baseCards;
          }, [activeTab, currentUser.id, previewDisplacedOrder, effectiveSettings.hidePrivate]);

          const handleCanvasDragOver = (e: React.DragEvent) => {
            const cardDragPayload = e.dataTransfer.types.includes('application/x-bookmark-card-id');
            if (!cardDragPayload || !draggedCardId || !canvasRef.current) return;

            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const canvasRect = canvasRef.current.getBoundingClientRect();
            const mouseX = e.clientX - canvasRect.left + canvasRef.current.scrollLeft;
            const mouseY = e.clientY - canvasRect.top + canvasRef.current.scrollTop;

            const cellWidth = (canvasRect.width - (effectiveSettings.nbCols - 1) * effectiveSettings.gapX) / effectiveSettings.nbCols;
            const stepX = cellWidth + effectiveSettings.gapX;
            const stepY = effectiveSettings.rowHeight + effectiveSettings.gapY;

            const rawCol = Math.floor(mouseX / stepX);
            const rawRow = Math.floor(mouseY / stepY);

            const currentDragged = activeTab?.cards.find(c => c.id === draggedCardId);
            if (!currentDragged) return;

            const cardW = Math.min(currentDragged.position?.w || 2, effectiveSettings.nbCols);
            const cardH = currentDragged.position?.h || 2;
            const targetCol = Math.max(0, Math.min(effectiveSettings.nbCols - cardW, rawCol));
            const targetRow = Math.max(0, Math.min(effectiveSettings.nbRowsMax - cardH, rawRow));

            if (effectiveSettings.cardsCollisionAlgo === 'Compact') {
              let hoveredCard = visibleCards.find(c => {
                if (c.id === draggedCardId) return false;
                const cx = previewDisplacedPositions[c.id]?.x ?? c.position?.x ?? 0;
                const cy = previewDisplacedPositions[c.id]?.y ?? c.position?.y ?? 0;
                const cw = Math.min(c.position?.w || 2, effectiveSettings.nbCols);
                const ch = c.position?.h || 2;
                return targetCol >= cx && targetCol < cx + cw && targetRow >= cy && targetRow < cy + ch;
              });

              const baseList = [...visibleCards];
              const dragIdx = baseList.findIndex(c => c.id === draggedCardId);

              if (hoveredCard && !hoveredCard.locks?.cardLocks?.lockedPosition) {
                const hoverIdx = baseList.findIndex(c => c.id === hoveredCard.id);
                if (dragIdx !== -1 && hoverIdx !== -1 && dragIdx !== hoverIdx) {
                  const [removed] = baseList.splice(dragIdx, 1);
                  baseList.splice(hoverIdx, 0, removed);
                }
              }

              const compactPositions = computeCompactPositions(baseList, effectiveSettings.nbCols, effectiveSettings.nbRowsMax);
              const ghostPos = compactPositions[draggedCardId];
              if (ghostPos) {
                setDragGhostPos({ x: ghostPos.x, y: ghostPos.y, w: cardW, h: cardH });
              } else {
                setDragGhostPos({ x: targetCol, y: targetRow, w: cardW, h: cardH });
              }
              setPreviewDisplacedPositions(compactPositions);
              setPreviewDisplacedOrder(baseList.map(c => c.id));
            } else {
              const prospectiveGhost = { x: targetCol, y: targetRow, w: cardW, h: cardH };
              setDragGhostPos(prospectiveGhost);

              const collidingCards = visibleCards.filter(c => c.id !== draggedCardId && !(
                prospectiveGhost.x + prospectiveGhost.w <= (c.position?.x ?? 0) ||
                (c.position?.x ?? 0) + (c.position?.w || 2) <= prospectiveGhost.x ||
                prospectiveGhost.y + prospectiveGhost.h <= (c.position?.y ?? 0) ||
                (c.position?.y ?? 0) + (c.position?.h || 2) <= prospectiveGhost.y
              ));

              if (collidingCards.length > 0) {
                const tempDisplacements: Record<string, GridPosition> = {};
                collidingCards.forEach(colCard => {
                  if (!colCard.locks?.cardLocks?.lockedPosition) {
                    const freeSlot = findNearestFreeSlot(
                      colCard,
                      prospectiveGhost,
                      visibleCards,
                      draggedCardId,
                      effectiveSettings.nbCols,
                      effectiveSettings.nbRowsMax,
                      tempDisplacements
                    );
                    if (freeSlot) {
                      tempDisplacements[colCard.id] = freeSlot;
                    }
                  }
                });
                setPreviewDisplacedPositions(tempDisplacements);
              } else {
                setPreviewDisplacedPositions({});
              }
              setPreviewDisplacedOrder(null);
            }
          };

          const handleCanvasDragLeave = (e: React.DragEvent) => {
            if (canvasRef.current && !canvasRef.current.contains(e.relatedTarget as Node)) {
              setDragGhostPos(null);
              setCardHoverTargetId(null);
            }
          };

          const handleCanvasDrop = (e: React.DragEvent) => {
            const draggedCardIdFromEvent = e.dataTransfer.getData('application/x-bookmark-card-id');
            const targetId = draggedCardIdFromEvent || draggedCardId;
            if (!targetId || !canvasRef.current) return;

            e.preventDefault();
            e.stopPropagation();

            const canvasRect = canvasRef.current.getBoundingClientRect();
            const mouseX = e.clientX - canvasRect.left + canvasRef.current.scrollLeft;
            const mouseY = e.clientY - canvasRect.top + canvasRef.current.scrollTop;

            const cellWidth = (canvasRect.width - (effectiveSettings.nbCols - 1) * effectiveSettings.gapX) / effectiveSettings.nbCols;
            const stepX = cellWidth + effectiveSettings.gapX;
            const stepY = effectiveSettings.rowHeight + effectiveSettings.gapY;

            const targetCol = dragGhostPos ? dragGhostPos.x : Math.max(0, Math.min(effectiveSettings.nbCols - 1, Math.floor(mouseX / stepX)));
            const targetRow = dragGhostPos ? dragGhostPos.y : Math.max(0, Math.min(effectiveSettings.nbRowsMax - 1, Math.floor(mouseY / stepY)));

            setTabs(prevTabs => prevTabs.map(tab => {
              if (tab.id !== activeTabId) return tab;

              if (effectiveSettings.cardsCollisionAlgo === 'Compact') {
                const order = previewDisplacedOrder || tab.cards.map(c => c.id);
                const orderedCards = order.map(id => tab.cards.find(c => c.id === id)).filter(Boolean) as CardType[];
                tab.cards.forEach(c => {
                  if (!order.includes(c.id)) orderedCards.push(c);
                });

                const updatedCards = orderedCards.map(c => {
                  const newPos = previewDisplacedPositions && previewDisplacedPositions[c.id];
                  if (newPos) {
                    return {
                      ...c,
                      position: { ...c.position, x: newPos.x, y: newPos.y }
                    };
                  }
                  return c;
                });

                return { ...tab, cards: updatedCards };
              }

              const updatedCards = tab.cards.map(c => {
                if (c.id === targetId) {
                  const cardW = c.position?.w || 2;
                  const clampedCol = Math.min(targetCol, effectiveSettings.nbCols - cardW);
                  return {
                    ...c,
                    position: { ...c.position, x: Math.max(0, clampedCol), y: targetRow }
                  };
                }
                if (previewDisplacedPositions && previewDisplacedPositions[c.id]) {
                  return {
                    ...c,
                    position: {
                      ...c.position,
                      x: previewDisplacedPositions[c.id].x,
                      y: previewDisplacedPositions[c.id].y
                    }
                  };
                }
                return c;
              });

              return { ...tab, cards: updatedCards };
            }));

            clearDragGhost();
          };

          const handleCardSizeChange = (cardId: string, newW: number, newH: number) => {
            setTabs(prevTabs => prevTabs.map(tab => {
              if (tab.id !== activeTabId) return tab;
              return {
                ...tab,
                cards: tab.cards.map(card => {
                  if (card.id !== cardId) return card;
                  return {
                    ...card,
                    position: { ...card.position, w: newW, h: newH }
                  };
                })
              };
            }));
          };

          const handleCardPositionChange = (cardId: string, newX: number, newY: number) => {
            setTabs(prevTabs => prevTabs.map(tab => {
              if (tab.id !== activeTabId) return tab;
              return {
                ...tab,
                cards: tab.cards.map(card => {
                  if (card.id !== cardId) return card;
                  return {
                    ...card,
                    position: { ...card.position, x: newX, y: newY }
                  };
                })
              };
            }));
          };

          const handleMoveOrCopyBookmark = (sourceCardId: string, targetCardId: string, bookmarkId: string, isCopy: boolean) => {
            if (!sourceCardId || !targetCardId || !bookmarkId) return;

            setTabs(prevTabs => prevTabs.map(tab => {
              if (tab.id !== activeTabId) return tab;

              const sourceCard = tab.cards.find(c => c.id === sourceCardId);
              const bookmarkToTransfer = sourceCard?.bookmarks.find(b => b.id === bookmarkId);
              if (!bookmarkToTransfer) return tab;

              if (sourceCardId === targetCardId) {
                if (isCopy) {
                  const duplicateBm = {
                    ...bookmarkToTransfer,
                    id: `bm_${Date.now()}_copy`,
                    name: `${bookmarkToTransfer.name} (Copy)`,
                    createdAt: Date.now()
                  };
                  return {
                    ...tab,
                    cards: tab.cards.map(c => c.id === targetCardId ? { ...c, bookmarks: [...c.bookmarks, duplicateBm] } : c)
                  };
                }
                return tab;
              }

              const payloadBm = isCopy ? {
                ...bookmarkToTransfer,
                id: `bm_${Date.now()}_copy`,
                createdAt: Date.now()
              } : bookmarkToTransfer;

              return {
                ...tab,
                cards: tab.cards.map(c => {
                  if (c.id === sourceCardId && !isCopy) {
                    return {
                      ...c,
                      bookmarks: c.bookmarks.filter(b => b.id !== bookmarkId)
                    };
                  }
                  if (c.id === targetCardId) {
                    return {
                      ...c,
                      bookmarks: [...c.bookmarks, payloadBm]
                    };
                  }
                  return c;
                })
              };
            }));
          };

          const handleDropLinkOntoCard = (cardId: string, payload: any, type: 'uri' | 'tree') => {
            if (type === 'uri') {
              try {
                const urlObj = new URL(payload.url);
                const domain = urlObj.hostname.replace('www.', '');
                const newBm: Bookmark = {
                  id: `bm_drop_${Date.now()}`,
                  name: domain.charAt(0).toUpperCase() + domain.slice(1).split('.')[0],
                  description: `Extracted from ${payload.url}`,
                  url: payload.url,
                  icon: `[https://www.google.com/s2/favicons?domain=$](https://www.google.com/s2/favicons?domain=$){domain}&sz=64`,
                  iconType: 'url',
                  tags: ['external-drop'],
                  isPrivate: false,
                  isLocked: false,
                  owner: currentUser.id,
                  healthStatus: 'healthy',
                  clickCount: 0,
                  createdAt: Date.now()
                };

                setTabs(prevTabs => prevTabs.map(tab => {
                  if (tab.id !== activeTabId) return tab;
                  return {
                    ...tab,
                    cards: tab.cards.map(card => card.id === cardId ? { ...card, bookmarks: [...card.bookmarks, newBm] } : card)
                  };
                }));
              } catch (e) {}
            } else if (type === 'tree') {
              const flattenLeaves = (node: any): Bookmark[] => {
                let leaves: Bookmark[] = [];
                if (node.url) {
                  leaves.push({
                    id: `bm_tree_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                    name: node.name,
                    url: node.url,
                    icon: node.icon || 'Globe',
                    iconType: node.iconType || 'lucide',
                    description: `Imported from path: ${node.path?.join(' / ') || 'Bookmarks'}`,
                    tags: node.path ? node.path.map((p: string) => p.toLowerCase().replace(/\s+/g, '-')) : ['imported'],
                    isPrivate: false,
                    isLocked: false,
                    owner: currentUser.id,
                    healthStatus: 'healthy',
                    clickCount: 0,
                    createdAt: Date.now()
                  });
                }
                if (node.children) {
                  node.children.forEach((c: any) => {
                    leaves = leaves.concat(flattenLeaves(c));
                  });
                }
                return leaves;
              };

              const extractedBookmarks = flattenLeaves(payload);
              if (extractedBookmarks.length > 0) {
                setTabs(prevTabs => prevTabs.map(tab => {
                  if (tab.id !== activeTabId) return tab;
                  return {
                    ...tab,
                    cards: tab.cards.map(card => card.id === cardId ? { ...card, bookmarks: [...card.bookmarks, ...extractedBookmarks] } : card)
                  };
                }));
              }
            }
          };

          const handleCopyBookmark = (bm: Bookmark) => {
            if (bm.url) {
              navigator.clipboard.writeText(bm.url);
            }
          };

          const handleSelectCard = (e: React.MouseEvent, cId: string) => {
            if (e.ctrlKey || e.metaKey) {
              setSelectedCardIds(prev => {
                const next = new Set(prev);
                if (next.has(cId)) next.delete(cId);
                else next.add(cId);
                return next;
              });
            } else {
              setSelectedCardIds(new Set([cId]));
            }
          };

          const handleCardDragStart = (cId: string) => {
            setDraggedCardId(cId);
          };

          const handleCardDragOverCard = (cId: string) => {
            setCardHoverTargetId(cId);
          };

          const handleCardDragLeaveCard = () => {
            setCardHoverTargetId(null);
          };

          const handleCardDropOnCard = (fromId: string, _toId: string) => {
            handleCanvasDrop({
              dataTransfer: { getData: () => fromId },
              preventDefault: () => {},
              stopPropagation: () => {},
              clientX: 0,
              clientY: 0
            } as unknown as React.DragEvent);
          };

          return (
            <div
              ref={canvasRef}
              className={`flex-1 overflow-y-auto p-6 transition-all relative ${!effectiveSettings.showGridLines ? 'bg-slate-50 dark:bg-slate-950' : ''}`}
              onDragOver={handleCanvasDragOver}
              onDragLeave={handleCanvasDragLeave}
              onDrop={handleCanvasDrop}
            >
              <div className="max-w-7xl mx-auto">
                {activeTab?.description && (
                  <div className="mb-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <p>{activeTab.description}</p>
                    <div className="flex items-center gap-3">
                      {isCmdPressed && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded font-mono text-[11px] font-medium border border-emerald-200 dark:border-emerald-800">
                          <span>Cmd/Ctrl active: Drop will COPY bookmark</span>
                        </span>
                      )}
                      <button
                        type="button"
                        className="flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                        onClick={onAddNewCard}
                      >
                        <Plus className="w-3.5 h-3.5"/>
                        <span>Add Section Card</span>
                      </button>
                    </div>
                  </div>
                )}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${effectiveSettings.nbCols}, minmax(0, 1fr))`,
                    columnGap: `${effectiveSettings.gapX}px`,
                    rowGap: `${effectiveSettings.gapY}px`,
                    gridAutoRows: `${effectiveSettings.rowHeight}px`,
                    minHeight: `${effectiveSettings.nbRowsMax * effectiveSettings.rowHeight + (effectiveSettings.nbRowsMax - 1) * effectiveSettings.gapY}px`,
                  }}
                  className="w-full transition-all duration-300 rounded-xl relative"
                >
                  {effectiveSettings.showGridLines && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${effectiveSettings.nbCols}, minmax(0, 1fr))`,
                        columnGap: `${effectiveSettings.gapX}px`,
                        rowGap: `${effectiveSettings.gapY}px`,
                        gridAutoRows: `${effectiveSettings.rowHeight}px`,
                      }}
                    >
                      {Array.from({ length: effectiveSettings.nbCols * effectiveSettings.nbRowsMax }).map((_, idx) => {
                        const col = idx % effectiveSettings.nbCols;
                        const row = Math.floor(idx / effectiveSettings.nbCols);
                        return (
                          <div
                            key={idx}
                            style={{ minHeight: `${effectiveSettings.rowHeight}px` }}
                            className="rounded-xl border border-dashed border-indigo-400/25 dark:border-indigo-500/20 bg-indigo-500/[0.015] dark:bg-indigo-400/[0.015] flex items-start justify-end p-2"
                          >
                            <span className="text-[10px] font-mono text-indigo-400/40 dark:text-indigo-400/30 select-none">
                              {col},{row}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {draggedCardId && dragGhostPos && (
                    <div
                      style={{
                        gridColumn: `${dragGhostPos.x + 1} / span ${dragGhostPos.w}`,
                        gridRow: `${dragGhostPos.y + 1} / span ${dragGhostPos.h}`,
                        minHeight: `${dragGhostPos.h * effectiveSettings.rowHeight + (dragGhostPos.h - 1) * effectiveSettings.gapY}px`,
                      }}
                      className="pointer-events-none rounded-xl border-2 border-dashed border-brand-500/90 bg-brand-500/10 dark:bg-brand-400/15 backdrop-blur-[1.5px] p-4 flex flex-col items-center justify-center text-center z-20 animate-pulse transition-all duration-150 shadow-inner"
                    >
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-600 text-white text-xs font-semibold shadow-md mb-1.5">
                        <CornerDownLeft className="w-3.5 h-3.5"/>
                        <span>Future Position ({dragGhostPos.x}, {dragGhostPos.y})</span>
                      </div>
                      <p className="text-xs font-medium text-brand-700 dark:text-brand-300">
                        {effectiveSettings.cardsCollisionAlgo === 'Compact' ? 'Compact Flow Displacement' : 'Grid Nearest-Space Push'}
                      </p>
                      <span className="text-[10px] font-mono text-brand-600/80 dark:text-brand-400/80 mt-0.5">
                        Span: {dragGhostPos.w} col × {dragGhostPos.h} row
                      </span>
                    </div>
                  )}

                  {visibleCards.map((card) => {
                    const previewPos = previewDisplacedPositions && previewDisplacedPositions[card.id];
                    const activeCard = previewPos ? { ...card, position: { ...card.position, ...previewPos } } : card;

                    return (
                      <BookmarkCard canvasContainerRef={canvasRef} card={activeCard} key={card.id} cardsCollisionAlgo={effectiveSettings.cardsCollisionAlgo} currentUser={currentUser} defaultHeaderBg={effectiveSettings.defaultCardHeaderBgColor} defaultHeaderTextColor={effectiveSettings.defaultCardHeaderTextColor} gapX={effectiveSettings.gapX} gapY={effectiveSettings.gapY} gridCols={effectiveSettings.nbCols} gridRows={effectiveSettings.nbRowsMax} hidePrivate={effectiveSettings.hidePrivate}
                      isBeingDragged={draggedCardId === card.id} isCmdPressed={isCmdPressed} isDropTarget={cardHoverTargetId === card.id} isSelected={selectedCardIds.has(card.id)} onAddBookmark={onAddBookmark} onCardDragEnd={clearDragGhost} onCardDragLeaveCard={handleCardDragLeaveCard} onCardDragOverCard={handleCardDragOverCard} onCardDragStart={handleCardDragStart} onCardDropOnCard={handleCardDropOnCard} onCardPositionChange={handleCardPositionChange} onCardSizeChange={handleCardSizeChange} onCopyBookmark={handleCopyBookmark} onDeleteBookmark={onDeleteBookmark} onDeleteCard={onDeleteCard} onDropLinkOntoCard={handleDropLinkOntoCard} onEditBookmark={onEditBookmark} onEditCard={onEditCard} onMoveOrCopyBookmark={handleMoveOrCopyBookmark} onOpenReader={onOpenReader} onSelectCard={handleSelectCard} rowHeight={effectiveSettings.rowHeight}/>
                    );
                  })}
                </div>

                {visibleCards.length === 0 && (
                  <div className="py-20 text-center">
                    <p className="text-sm text-slate-400 mb-2">
                      No accessible cards in this tab
                    </p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold shadow-sm hover:bg-brand-700 transition-colors"
                      onClick={onAddNewCard}
                    >
                      <Plus className="w-4 h-4"/>
                      <span>Create First Card</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        };
