<script setup lang="ts">
import { useMessage } from '@/hooks/useMessage';
import { ElMessage } from 'element-plus';
import { ref } from 'vue';

const { invoke } = useMessage();

const data = ref({
  value: 10,
  tooltip: 'This is a tooltip message'
});
function setting() {
  invoke('prompt', data.value).then((value) => {
    ElMessage.success(`You have set the value to ${value}`);
  });
}
</script>

<template>
  <el-container>
    <el-header> Sidebar Webview - Badge</el-header>
    <el-main>
      <el-form label-width="auto">
        <el-form-item label="Value">
          <el-input v-model="data.value" />
        </el-form-item>
        <el-form-item label="Tooltip">
          <el-input v-model="data.tooltip" />
        </el-form-item>
        <el-form-item label="Badge">
          <el-button type="primary" @click="setting"> Setting</el-button>
        </el-form-item>
      </el-form>
    </el-main>
  </el-container>
</template>
<style lang="less" scoped></style>
