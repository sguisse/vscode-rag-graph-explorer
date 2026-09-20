import { BookmarkCard, GridPosition } from '../types/bookmarks.types';

export const useGridPhysics = () => {
  const computeCompactPositions = (cardsList: BookmarkCard[], nbCols: number, maxRows: number = 50): Record<string, GridPosition> => {
    const occupied = new Set<string>();
    const isFree = (x: number, y: number, w: number, h: number) => {
      if (x + w > nbCols) return false;
      for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
          if (occupied.has(`${x + c},${y + r}`)) return false;
        }
      }
      return true;
    };

    const mark = (x: number, y: number, w: number, h: number) => {
      for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
          occupied.add(`${x + c},${y + r}`);
        }
      }
    };

    const positions: Record<string, GridPosition> = {};

    cardsList.forEach(card => {
      if (card.locks?.cardLocks?.lockedPosition) {
        const w = Math.min(card.position?.w || 2, nbCols);
        const h = card.position?.h || 2;
        const x = Math.max(0, Math.min(card.position?.x ?? 0, nbCols - w));
        const y = Math.max(0, card.position?.y ?? 0);
        mark(x, y, w, h);
        positions[card.id] = { x, y, w, h };
      }
    });

    cardsList.forEach(card => {
      if (card.locks?.cardLocks?.lockedPosition) return;
      const w = Math.min(card.position?.w || 2, nbCols);
      const h = card.position?.h || 2;
      let placed = false;
      for (let y = 0; y < maxRows && !placed; y++) {
        for (let x = 0; x <= nbCols - w && !placed; x++) {
          if (isFree(x, y, w, h)) {
            mark(x, y, w, h);
            positions[card.id] = { x, y, w, h };
            placed = true;
          }
        }
      }
      if (!placed) {
        positions[card.id] = { x: 0, y: 0, w, h };
      }
    });

    return positions;
  };

  const findNearestFreeSlot = (
    cardToMove: BookmarkCard,
    ghostPos: GridPosition | null,
    allCards: BookmarkCard[],
    draggedCardId: string | null,
    nbCols: number,
    nbRowsMax: number,
    tempMoves: Record<string, GridPosition> = {}
  ): GridPosition | null => {
    const w = Math.min(cardToMove.position?.w || 2, nbCols);
    const h = cardToMove.position?.h || 2;
    const origX = cardToMove.position?.x ?? 0;
    const origY = cardToMove.position?.y ?? 0;

    const isSlotBlocked = (cx: number, cy: number) => {
      if (ghostPos) {
        const collidesGhost = !(
          cx + w <= ghostPos.x || ghostPos.x + ghostPos.w <= cx ||
          cy + h <= ghostPos.y || ghostPos.y + ghostPos.h <= cy
        );
        if (collidesGhost) return true;
      }

      for (const c of allCards) {
        if (c.id === cardToMove.id || c.id === draggedCardId) continue;
        const pos = tempMoves[c.id] || c.position;
        const otherX = pos?.x ?? 0;
        const otherY = pos?.y ?? 0;
        const otherW = Math.min(pos?.w || 2, nbCols);
        const otherH = pos?.h || 2;

        const collidesOther = !(
          cx + w <= otherX || otherX + otherW <= cx ||
          cy + h <= otherY || otherY + otherH <= cy
        );
        if (collidesOther) return true;
      }
      return false;
    };

    let bestSlot: GridPosition | null = null;
    let minDistance = Infinity;

    for (let r = 0; r <= nbRowsMax - h; r++) {
      for (let c = 0; c <= nbCols - w; c++) {
        if (c === origX && r === origY) continue;
        if (!isSlotBlocked(c, r)) {
          const dist = Math.hypot(c - origX, (r - origY) * 1.15);
          if (dist < minDistance) {
            minDistance = dist;
            bestSlot = { x: c, y: r, w, h };
          }
        }
      }
    }

    if (!bestSlot) {
      bestSlot = { x: origX, y: Math.min(nbRowsMax - h, origY + h), w, h };
    }
    return bestSlot;
  };

  return { computeCompactPositions, findNearestFreeSlot };
};
