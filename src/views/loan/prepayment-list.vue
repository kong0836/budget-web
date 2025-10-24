<template>
  <div class="prepayment">
    <h3>提前还款设置</h3>
    <el-button
        size="mini"
        type="primary"
        @click="handleAddPrepayment">
      添加提前还款
    </el-button>
    <el-button
        size="mini"
        type="primary"
        @click="handleUpdate">
      保存
    </el-button>
    <el-table
        :data="prepaymentList"
        border
        stripe>
      <el-table-column
          align="center"
          label="还款金额（元）"
          prop="amount">
        <template v-slot="{row}">
          <el-input
              v-model="row.amount"
              placeholder="请输入还款金额"
              type="number"/>
        </template>
      </el-table-column>
      <el-table-column
          align="center"
          label="还款时间"
          prop="repaymentDate">
        <template v-slot="{row}">
          <el-date-picker
              v-model="row.repaymentDate"
              placeholder="选择还款时间"
              type="date"
              value-format="yyyy-MM-dd"
              @change="handleUpdatePrepaymentMonth(row)"/>
        </template>
      </el-table-column>
      <el-table-column
          align="center"
          label="对应期数"
          prop="month"
          width="100">
        <template v-slot="{row}">
          <span>{{ row.month || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column
          align="center"
          label="还款方式"
          prop="type">
        <template v-slot="{row}">
          <el-radio-group v-model="row.type" size="small">
            <el-radio label="shorten">缩短还款期限</el-radio>
            <el-radio label="reduce">减少月供金额</el-radio>
          </el-radio-group>
        </template>
      </el-table-column>
      <el-table-column
          align="center"
          label="操作"
          width="80">
        <template v-slot="{$index}">
          <el-button
              v-if="prepaymentList.length > 1"
              size="small"
              type="text"
              @click="handleRemovePrepayment($index)">删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { cloneDeep } from "lodash";
import { Prepayment } from "@/types/loan";

const DEFAULT_PREPAYMENT_LIST: Prepayment[] = [
  { amount: 100000, repaymentDate: '2025-01-01', period: 0, type: 'shorten' }
];

@Component({})
export default class PrepaymentList extends Vue {
  prepaymentList: Prepayment[] = cloneDeep(DEFAULT_PREPAYMENT_LIST);

  handleAddPrepayment(): void {
    this.prepaymentList.push({
      amount: 0,
      repaymentDate: '',
      period: 0,
      type: 'shorten'
    });
  }

  handleUpdatePrepaymentMonth(row: any): void {
    console.log('handleUpdatePrepaymentMonth', row);
    // if (row.repaymentDate && this.basicInfo.startDate) {
    //   row.month = this.handleCalculatePeriod(row.repaymentDate);
    // }
  }

  handleUpdate(): void {
    this.$emit('update', this.prepaymentList);
  }
}
</script>

<style lang="scss" scoped>
.prepayment {
  .el-table {
    margin-top: 10px;
  }
}
</style>
