<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router';
import { useMessage } from '@/hooks/useMessage';

const router = useRouter();
const { addListener, postMsg } = useMessage();
addListener('path', (data) => {
  router.push(data);
});
postMsg('ready');
</script>

<template>
  <RouterView />
</template>

<style scoped></style>
