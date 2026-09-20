import { ref } from 'vue';
import myAxios from '../api/myAxios';

/**
 * 진행 중인 방은 서버가 판단한다. 방을 만든 사람만 기록되던 localStorage와 달리
 * 초대로 참여한 사람도 같은 방을 돌려받는다.
 *
 * 여러 화면이 같은 값을 쓰므로 모듈 수준에 한 벌만 둔다.
 */
const activeRoom = ref(null);
const isLoading = ref(false);
let inflight = null;

export function useActiveRoom() {
  const fetchActiveRoom = async ({ force = false } = {}) => {
    if (!force && activeRoom.value) return activeRoom.value;
    if (inflight) return inflight;

    isLoading.value = true;
    inflight = myAxios.get('/rooms/active')
      .then(({ data }) => {
        activeRoom.value = data.data ?? null;
        return activeRoom.value;
      })
      .catch(() => {
        activeRoom.value = null;
        return null;
      })
      .finally(() => {
        inflight = null;
        isLoading.value = false;
      });
    return inflight;
  };

  const clearActiveRoom = () => {
    activeRoom.value = null;
  };

  return { activeRoom, isLoading, fetchActiveRoom, clearActiveRoom };
}
