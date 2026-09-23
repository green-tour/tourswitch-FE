import { ref } from "vue";
import { defineStore } from "pinia";
import myAxios from "../../api/myAxios";

export const useFavoritePlaceStore = defineStore("favoritePlaceStore", () => {
  const favorites = ref([]);
  const isLoading = ref(false);
  const errorMessage = ref("");

  const fetchFavorites = async () => {
    isLoading.value = true;
    errorMessage.value = "";

    try {
      const { data } = await myAxios.get("/users/me/favorite-places");
      favorites.value = data.data ?? [];
      return favorites.value;
    } catch (error) {
      errorMessage.value =
        error.response?.data?.message ?? "찜 목록을 불러오지 못했습니다.";
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  return { favorites, isLoading, errorMessage, fetchFavorites };
});
