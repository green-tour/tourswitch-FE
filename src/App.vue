<script setup>
import Header from './components/Header.vue';
import UserInfo from './components/UserInfo.vue';
import PostIndex from './pages/posts/PostIndex.vue';
</script>

<template>
  <Header />
  <UserInfo />
  <router-view></router-view>
</template>

<style scoped>
</style>