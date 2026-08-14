export function shouldTriggerPullToRefresh({
  startX,
  startY,
  endX,
  endY,
  scrollTop,
  threshold = 72,
}: {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  scrollTop: number;
  threshold?: number;
}) {
  const deltaX = Math.abs(endX - startX);
  const deltaY = endY - startY;
  return scrollTop <= 0 && deltaY >= threshold && deltaY > deltaX;
}
