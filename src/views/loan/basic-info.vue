<template>
  <div class="basic-info">
    <h3>基本信息</h3>
    <el-form
        ref="basicForm"
        :model="basicForm"
        :rules="basicFormRules"
        label-width="120px">
      <el-form-item label="贷款总额" prop="loanAmount">
        <el-input
            v-model="basicForm.loanAmount"
            placeholder="请输入贷款总额（元）"
            type="number"
            @change="handleRepaymentTypeChange">
          <template v-slot:append>元</template>
        </el-input>
      </el-form-item>
      <el-form-item label="贷款年限" prop="loanYears">
        <el-select v-model="basicForm.loanYears">
          <el-option
              v-for="item in loadYearOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"/>
        </el-select>
      </el-form-item>
      <el-form-item label="还款方式" prop="repaymentType">
        <el-select v-model="basicForm.repaymentType" @change="handleRepaymentTypeChange">
          <el-option
              v-for="item in repaymentTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"/>
        </el-select>
      </el-form-item>
      <el-form-item v-if="isPrincipal" label="每月还款本金">
        <el-input v-model="basicForm.principal" disabled>
          <template v-slot:append>元</template>
        </el-input>
      </el-form-item>
      <el-form-item v-if="isInterest" label="每月还款利息">
        <b>剩余本金 × 月利率</b>
      </el-form-item>
      <el-form-item label="每月还款日期" prop="repaymentDate">
        <el-date-picker
            v-model="basicForm.repaymentDate"
            format="dd"
            placeholder="选择还款日期"
            type="date"
            value-format="dd">
        </el-date-picker>
      </el-form-item>
      <el-form-item label="首次还款日期" prop="startDate">
        <el-date-picker
            v-model="basicForm.startDate"
            placeholder="选择还款年月"
            type="date"
            value-format="yyyy-MM-dd"
            @change="handleStartDateChange">
        </el-date-picker>
      </el-form-item>
      <el-form-item label="结束还款日期" prop="endDate">
        <el-date-picker
            v-model="basicForm.endDate"
            disabled
            placeholder="选择还款年月"
            type="date"
            value-format="yyyy-MM-dd"/>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { cloneDeep } from "lodash";
import { BasicForm } from "@/types/loan";
import { Form } from "element-ui";
import moment from "moment";

/**
 * 默认基本贷款信息配置
 */
const DEFAULT_BASIC_INFO: Partial<BasicForm> = {
  loanAmount: 1000000,
  loanYears: 30,
  repaymentDate: '27',
  startDate: '2024-04-27',
  endDate: '',
  repaymentType: 'principal',
  principal: 0,
  interest: 0,
};

@Component
export default class BasicInfo extends Vue {
  basicForm: Partial<BasicForm> = cloneDeep(DEFAULT_BASIC_INFO);
  basicFormRules = {
    loanAmount: { required: true, message: '请输入贷款总额', trigger: 'blur' },
    loanYears: { required: true, message: '请选择贷款年限', trigger: 'change' },
    repaymentDate: { required: true, message: '请输入每月还款日期', trigger: 'blur' },
    startDate: { required: true, message: '请输入首次还款日期', trigger: 'blur' },
  };
  // 贷款年限选项
  loadYearOptions = [
    { value: 5, label: '5年' },
    { value: 10, label: '10年' },
    { value: 15, label: '15年' },
    { value: 20, label: '20年' },
    { value: 30, label: '30年' },
  ];
  // 还款方式选项
  repaymentTypeOptions = {
    PRINCIPAL: { label: '等额本金', value: 'principal' },
    INTEREST: { label: '等额本息', value: 'interest' },
  }

  get isPrincipal(): boolean {
    return this.basicForm?.repaymentType === this.repaymentTypeOptions.PRINCIPAL.value;
  }

  get isInterest(): boolean {
    return this.basicForm?.repaymentType === this.repaymentTypeOptions.INTEREST.value;
  }

  mounted() {
    this.handleStartDateChange();
    this.handleRepaymentTypeChange();
  }

  handleStartDateChange() {
    let startDate = this.basicForm?.startDate;
    if (!startDate) {
      this.basicForm.endDate = '';
      return;
    }

    this.basicForm.endDate = moment(startDate, 'YYYY-MM-DD').add(this.basicForm.loanYears, 'years').format('YYYY-MM-DD');
  }

  handleRepaymentTypeChange() {
    try {
      if (this.isPrincipal) {
        this.basicForm.principal = parseFloat((this.basicForm.loanAmount / this.basicForm.loanYears / 12).toFixed(2));
        return;
      }
    } catch (error) {
      console.error(error);
    }
  }

  async handleSave() {
    try {
      await (this.$refs.basicForm as Form).validate();
      this.$emit('update', this.basicForm);
    } catch (error) {
      console.error(error);
    }
  }
}
</script>

<style lang="scss" scoped>
.basic-info {
  .el-form {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 15px;

    .el-input,
    .el-select {
      width: 100%;
    }
  }
}
</style>
