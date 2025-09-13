<template>
  <div class="home">
    <el-container>
      <el-header>Header</el-header>
      <el-container>
        <el-aside width="200px">Aside</el-aside>
        <el-main>Main</el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class HomeView extends Vue {}
</script>

<style scoped>
.home {
  height: 100%;
  .el-container {
    height: 100%;
    .el-header {
      height: 60px;
    }
    .el-container {
      height: 100%;
    }
  }
}
</style>