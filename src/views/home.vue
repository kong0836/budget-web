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

<style lang="scss" scoped>
@import '../style/index.scss';
.home {
  height: 100%;
  .el-container {
    height: 100%;
    .el-header {
      text-align: center;
      line-height: 60px;
      border-bottom: 1px solid $border-color;
    }
    .el-container {
      height: 100%;
      .el-aside {
       border-right: 1px solid $border-color;
      }
    }
  }
}
</style>