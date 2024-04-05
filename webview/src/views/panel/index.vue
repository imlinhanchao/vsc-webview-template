<script setup lang="ts">
import { useMessage } from '@/hooks/useMessage';
import { ref } from 'vue';

const content = ref('');
const { invoke } = useMessage();

function get() {
  invoke('fetch').then((data) => {
    content.value = data;
  });
}
</script>

<template>
  <el-container>
    <el-header> Panel Webview </el-header>
    <el-main>
      <p>{{ content }}</p>
      <el-button @click="get" type="primary">Fetch</el-button>
    </el-main>
  </el-container>
</template>
<style lang="less" scoped></style>
