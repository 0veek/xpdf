import { useEffect, useState, type RefObject } from "react";

export function useContainerWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => setWidth(el.getBoundingClientRect().width);
    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return width;
}

export function computeFitScale(
  pageWidthAtScale1: number,
  containerWidth: number,
  zoomScale: number
): number {
  if (pageWidthAtScale1 <= 0) return zoomScale;
  if (containerWidth <= 0) return zoomScale;
  const fitScale = Math.max(0.25, (containerWidth - 8) / pageWidthAtScale1);
  return fitScale * zoomScale;
}
