<template>
  <div class="rate-list">
    <h3>利率设置</h3>
    <el-button
        size="mini"
        type="primary"
        @click="handleAddRateRow">
      添加利率行
    </el-button>
    <el-button
        size="mini"
        type="primary"
        @click="handleUpdate">
      保存
    </el-button>
    <el-table
        :data="rateList"
        border
        stripe>
      <el-table-column
          align="center"
          label="开始日期"
          prop="startDate">
        <template v-slot="{row}">
          <el-date-picker
              v-model="row.startDate"
              format="yyyy年MM月"
              type="date"
              value-format="yyyy-MM"/>
        </template>
      </el-table-column>
      <el-table-column
          align="center"
          label="结束日期"
          prop="endDate">
        <template v-slot="{row}">
          <el-date-picker
              v-model="row.endDate"
              format="yyyy年MM月"
              type="month"
              value-format="yyyy-MM"/>
        </template>
      </el-table-column>
      <el-table-column
          align="center"
          label="年利率（%）"
          prop="rate">
        <template v-slot="{row}">
          <el-input
              v-model="row.rate"
              placeholder="请输入年利率"
              type="number"/>
        </template>
      </el-table-column>
      <el-table-column
          align="center"
          label="操作"
          width="80">
        <template v-slot="{$index}">
          <el-button
              v-if="rateList.length > 1"
              size="small"
              type="text"
              @click="handleRemoveRateRow($index)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { cloneDeep } from "lodash";
import { RateInfo } from "@/types/loan";

/**
 * 默认利率列表配置
 */
const DEFAULT_RATE_LIST: RateInfo[] = [
  { startDate: '2024-01', endDate: '2024-12', rate: 3.1 },
  { startDate: '2025-01', endDate: '2025-12', rate: 2.85 },
  { startDate: '2026-01', endDate: '', rate: 2.6 },
];

@Component({})
export default class RateList extends Vue {
  rateList: RateInfo[] = cloneDeep(DEFAULT_RATE_LIST);

  /**
   * 添加利率行
   */
  handleAddRateRow(): void {
    this.rateList.push({
      startDate: '',
      endDate: '',
      rate: 0
    });
  }

  /**
   * 删除利率行
   * @param index 要删除的行索引
   */
  handleRemoveRateRow(index: number): void {
    if (this.rateList.length > 1) {
      this.rateList.splice(index, 1);
    }
  }

  handleUpdate() {
    this.$emit('update', this.rateList);
  }
}
</script>

<style lang="scss" scoped>
.rate-list {
  .el-table {
    margin-top: 10px;
  }
}
</style>
