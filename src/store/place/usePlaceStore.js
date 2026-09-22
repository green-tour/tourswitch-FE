import { ref } from "vue";
import { defineStore } from "pinia";
import myAxios from "../../api/myAxios";

export const usePlaceStore = defineStore("placeStore", () => {
  const place = ref(null);
  const isLoading = ref(true);
  const errorMessage = ref("");
  const isFavorite = ref(false);
  const isFavoriteLoading = ref(false);

  const fetchPlaceDetail = async (placeId, regionId = null) => {
    isLoading.value = true;
    errorMessage.value = "";
    place.value = null;
    isFavorite.value = false;

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

  const fetchFavorite = async (placeId) => {
    const { data } = await myAxios.get(`/places/${placeId}/favorite`);
    isFavorite.value = Boolean(data.data?.favorite);
    return isFavorite.value;
  };

  const toggleFavorite = async (placeId) => {
    if (isFavoriteLoading.value) return isFavorite.value;
    isFavoriteLoading.value = true;

    try {
      const request = isFavorite.value
        ? myAxios.delete(`/places/${placeId}/favorite`)
        : myAxios.post(`/places/${placeId}/favorite`);
      const { data } = await request;
      isFavorite.value = Boolean(data.data?.favorite);
      return isFavorite.value;
    } finally {
      isFavoriteLoading.value = false;
    }
  };

  return {
    place,
    isLoading,
    errorMessage,
    isFavorite,
    isFavoriteLoading,
    fetchPlaceDetail,
    fetchFavorite,
    toggleFavorite,
  };
});

