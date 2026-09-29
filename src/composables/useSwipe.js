import { ref } from 'vue';

const SWIPE_THRESHOLD_PX = 50;
// 짧게 튕기듯 넘길 때도 넘어가도록 속도를 함께 본다(px/ms).
const FLICK_VELOCITY = 0.4;
const FLICK_MIN_PX = 20;
// 이 거리만큼 움직이기 전에는 가로·세로 중 어느 쪽 드래그인지 정하지 않는다.
const AXIS_LOCK_PX = 8;
// 더 넘길 카드가 없는 쪽으로 끌면 이 비율만큼만 밀리고 되돌아온다.
const EDGE_RESISTANCE = 0.3;

/**
 * 카드를 옆으로 끌어 넘기는 스와이프. 터치와 마우스를 포인터 이벤트로 함께 처리한다.
 * 세로로 끌면 페이지 스크롤에 양보하고, 옆으로 끈 직후의 클릭은 막아 설명 보기·선택 버튼이
 * 잘못 눌리지 않게 한다. 적용할 요소에는 `touch-action: pan-y`를 둔다.
 */
export function useSwipe({ canPrev, canNext, onPrev, onNext }) {
  const offset = ref(0);
  const isDragging = ref(false);
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let axis = null;
  let suppressClick = false;

  const reset = () => {
    offset.value = 0;
    isDragging.value = false;
    pointerId = null;
    axis = null;
  };

  const pointerdown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    startTime = event.timeStamp;
    axis = null;
  };

  const pointermove = (event) => {
    if (event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (!axis) {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
      axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (axis === 'x') {
        isDragging.value = true;
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }
    }
    if (axis !== 'x') return;
    const isBlocked = (dx > 0 && !canPrev()) || (dx < 0 && !canNext());
    offset.value = isBlocked ? dx * EDGE_RESISTANCE : dx;
  };

  const pointerup = (event) => {
    if (event.pointerId !== pointerId) return;
    if (axis === 'x') {
      const dx = event.clientX - startX;
      const velocity = Math.abs(dx) / Math.max(1, event.timeStamp - startTime);
      const isSwipe = Math.abs(dx) >= SWIPE_THRESHOLD_PX
        || (Math.abs(dx) >= FLICK_MIN_PX && velocity >= FLICK_VELOCITY);
      if (isSwipe && dx < 0 && canNext()) onNext();
      else if (isSwipe && dx > 0 && canPrev()) onPrev();
      // 드래그 직후 따라오는 click 한 번만 막는다. click이 오지 않아도 다음 탭은 막히지 않게 바로 푼다.
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
    }
    reset();
  };

  const pointercancel = (event) => {
    if (event.pointerId === pointerId) reset();
  };

  const clickCapture = (event) => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick = false;
  };

  return {
    offset,
    isDragging,
    handlers: { pointerdown, pointermove, pointerup, pointercancel },
    clickCapture,
  };
}
