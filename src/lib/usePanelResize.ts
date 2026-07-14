import { useEffect, type RefObject } from 'react';

/**
 * Drives a side-panel resize drag from a mousedown on a resize handle.
 * Coalesces mousemove into one width update per animation frame instead of
 * firing a store update on every raw pixel move.
 */
export function usePanelResize(
  panelRef: RefObject<HTMLElement | null>,
  resizing: boolean,
  setWidth: (w: number) => void,
  setResizing: (v: boolean) => void,
  anchor: 'left' | 'right' = 'left',
) {
  useEffect(() => {
    if (!resizing) return;
    let frame = 0;
    let latestX = 0;

    const applyWidth = () => {
      frame = 0;
      const rect = panelRef.current?.getBoundingClientRect();
      const width = anchor === 'right' ? (rect?.right ?? 0) - latestX : latestX - (rect?.left ?? 0);
      setWidth(width);
    };
    const onMove = (e: MouseEvent) => {
      latestX = e.clientX;
      if (!frame) frame = requestAnimationFrame(applyWidth);
    };
    const onUp = () => setResizing(false);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [panelRef, resizing, setWidth, setResizing, anchor]);
}
