<template>
  <div class="basic-info">
    <h3>基本信息</h3>
    <el-form
        ref="basicForm"
        :model="basicForm"
        :rules="basicFormRules"
        label-position="top">
      <el-form-item label="贷款总额" prop="loanAmount">
        <el-input
            v-model="basicForm.loanAmount"
            placeholder="请输入贷款总额（元）"
            type="number">
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
            value-format="yyyy-MM-dd">
        </el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button
            size="mini"
            type="primary"
            @click="handleSave">
          保存
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { cloneDeep } from "lodash";
import { BasicForm } from "@/types/loan";
import { Form } from "element-ui";

/**
 * 默认基本贷款信息配置
 */
const DEFAULT_BASIC_INFO: Partial<BasicForm> = {
  loanAmount: 1000000, // 100万元对应的元单位值
  loanYears: 30, // 默认贷款30年
  repaymentDate: '27', // 还款日期为空
  startDate: '2024-04-27', // 开始日期为空
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
    width: 10%;

    .el-input,
    .el-select {
      width: 100%;
    }
  }
}
</style>
