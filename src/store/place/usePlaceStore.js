import { ref } from "vue";
import { defineStore } from "pinia";
import myAxios from "../../api/myAxios";

export const usePlaceStore = defineStore("placeStore", () => {
  const place = ref(null);
  const isLoading = ref(true);
  const errorMessage = ref("");

  const fetchPlaceDetail = async (placeId, regionId = null) => {
    isLoading.value = true;
    errorMessage.value = "";
    place.value = null;

    try {
      const { data } = await myAxios.get(`/places/${placeId}`, {
        params: regionId ? { regionId } : undefined,
      });
      place.value = data.data;
      return place.value;
    } catch (error) {
      errorMessage.value =
        error.response?.data?.message ?? "관광지 정보를 불러오지 못했습니다.";
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  return { place, isLoading, errorMessage, fetchPlaceDetail };
});

