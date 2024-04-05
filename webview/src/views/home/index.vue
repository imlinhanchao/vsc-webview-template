<script setup lang="ts">
import { useMessage } from '@/hooks/useMessage';
import { ref } from 'vue';

const data = ref<IData>();
const { addListener, postMsg } = useMessage();
addListener('data', (d: IData) => {
  data.value = d;
});
postMsg('data');
</script>

<template>
  <el-container>
    <el-header class="flex justify-between">
      <h1 class="flex items-center">
        <img src="@/assets/logo.svg" alt="Vue logo" /> <span>Editor Webview</span>
      </h1>
      <el-button type="primary" @click="postMsg('save', data)">Save</el-button>
    </el-header>
    <el-main v-loading="!data">
      <el-form label-width="auto" v-if="data" :model="data">
        <el-form-item label="Name">
          <el-input v-model="data.name" />
        </el-form-item>
        <el-form-item label="Age">
          <el-input-number v-model="data.age" />
        </el-form-item>
      </el-form>
    </el-main>
  </el-container>
</template>
<style lang="less" scoped>
img {
  height: 1.5em;
  margin-right: 10px;
}
</style>
