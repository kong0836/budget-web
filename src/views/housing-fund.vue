<template>
  <div class="housing-fund">
    <div class="calculator-container">
      <div class="calculator-header">公积金贷款利息计算器</div>

      <h3>基本信息</h3>
      <el-form
          ref="basicForm"
          :label-width="LABEL_WIDTH"
          :model="basicForm">
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
      </el-form>

      <h3>利率设置</h3>
      <el-button
          size="small"
          type="primary"
          @click="handleAddRateRow">添加利率行
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
                placeholder="选择还款年月"
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
                placeholder="选择还款年月"
                type="month"
                value-format="yyyy-MM"/>
          </template>
        </el-table-column>
        <el-table-column
            align="center"
            label="年利率（%）"
            prop="fixedRate">
          <template v-slot="{row}">
            <el-input
                v-model="row.fixedRate"
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
                @click="handleRemoveRateRow($index)">删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <h3>提前还款设置</h3>
      <el-button
          size="small"
          type="primary"
          @click="handleAddPrepayment">添加提前还款
      </el-button>
      <el-table
          :data="prepayments"
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
                v-if="prepayments.length > 1"
                size="small"
                type="text"
                @click="handleRemovePrepayment($index)">删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 计算按钮 -->
      <el-row class="action-section">
        <el-col :span="24" class="text-center">
          <el-button size="small"
                     type="primary"
                     @click="handleCalculate">计算
          </el-button>
          <el-button size="small"
                     type="default"
                     @click="handleReset">重置
          </el-button>
        </el-col>
      </el-row>

      <!-- 计算结果 -->
      <div v-if="showResults" class="results-section">
        <h4>计算结果</h4>

        <div class="basic-info">
          <p><strong>贷款总额：</strong>{{ handleFormatCurrency(basicForm.loanAmount) }}</p>
          <p><strong>贷款期限：</strong>{{ basicForm.loanYears }}年（{{ totalMonths }}个月）</p>
          <p><strong>开始还款：</strong>{{ basicForm.startDate ? basicForm.startDate.replace('-', '年') + '月' : '' }}
          </p>
          <p><strong>结束还款：</strong>{{ endYear }}年{{ endMonth }}月</p>
        </div>

        <div class="interest-results">
          <h5>利息总额</h5>
          <p><strong>固定利率总利息：</strong>{{ handleFormatCurrency(fixedTotalInterest) }}</p>
          <p><strong>浮动利率总利息：</strong>{{ handleFormatCurrency(floatingTotalInterest) }}</p>
        </div>

        <div v-if="prepayments.some(p => p.amount > 0)" class="prepayment-results">
          <h5>提前还款分析</h5>
          <div class="prepayment-summary">
            <p><strong>提前还款总次数：</strong>{{ prepayments.filter(p => p.amount > 0).length }}次</p>
            <p><strong>提前还款总金额：</strong>{{ handleFormatCurrency(prepaymentTotalAmount) }}</p>
            <p><strong>节省利息总额：</strong>{{ handleFormatCurrency(totalSaveInterest) }}</p>
            <p><strong>原还款期数：</strong>{{ totalMonths }}个月</p>
            <p><strong>最终还款期数：</strong>{{ finalTotalMonths }}个月</p>
            <p><strong>最终还款期限：</strong>{{ finalEndYear }}年{{ finalEndMonth }}月</p>
          </div>
          <div class="prepayment-details">
            <h6>每次提前还款详情</h6>
            <el-table
                :data="prepaymentDetails"
                border
                stripe>
              <el-table-column
                  align="center"
                  label="序号"
                  prop="index"></el-table-column>
              <el-table-column
                  align="center"
                  label="还款金额"
                  prop="amount"></el-table-column>
              <el-table-column
                  align="center"
                  label="还款时间"
                  prop="month"></el-table-column>
              <el-table-column
                  align="center"
                  label="还款方式"
                  prop="type"></el-table-column>
              <el-table-column
                  align="center"
                  label="节省利息"
                  prop="saveInterest"></el-table-column>
              <el-table-column
                  align="center"
                  label="剩余期数"
                  prop="remainingMonths"></el-table-column>
              <el-table-column
                  align="center"
                  label="新结束日期"
                  prop="newEndDate"></el-table-column>
            </el-table>
          </div>
        </div>

        <div class="repayment-schedule">
          <h5>完整还款计划</h5>
          <div class="schedule-controls">
            <el-input
                v-model="searchTerm"
                clearable
                placeholder="搜索期数或日期"
                style="width: 200px; margin-right: 10px;"></el-input>
            <el-select
                v-model="pageSize"
                placeholder="每页显示条数"
                style="width: 120px;">
              <el-option
                  :value="12"
                  label="12条"></el-option>
              <el-option
                  :value="24"
                  label="24条"></el-option>
              <el-option
                  :value="50"
                  label="50条"></el-option>
              <el-option
                  :value="100"
                  label="100条"></el-option>
            </el-select>
          </div>

          <el-table :data="paginatedSchedule"
                    :default-sort="{prop: 'month', order: 'ascending'}"
                    border
                    style="width: 100%; margin-top: 15px;">
            <el-table-column
                label="期数"
                prop="month"
                sortable></el-table-column>
            <el-table-column
                label="还款日期"
                prop="date"
                sortable></el-table-column>
            <el-table-column
                label="本金"
                prop="principal"
                sortable></el-table-column>
            <el-table-column
                label="利息"
                prop="interest"
                sortable></el-table-column>
            <el-table-column
                label="月供"
                prop="total"
                sortable></el-table-column>
            <el-table-column
                label="剩余本金"
                prop="remaining"
                sortable></el-table-column>
            <el-table-column label="操作">
              <template v-slot="{ row }">
                <el-button
                    size="small"
                    type="text"
                    @click="handleViewDetail(row)">详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
              :current-page="currentPage"
              :page-size="pageSize"
              :page-sizes="[12, 24, 50, 100]"
              :total="filteredSchedule.length"
              layout="prev, pager, next, sizes, total"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange">
          </el-pagination>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import moment from 'moment';
import { cloneDeep } from "lodash";

interface BasicInfo {
  loanAmount: number;
  loanYears: number;
  repaymentDate: string;
  startDate: string;
}

interface FloatingRate {
  startDate: string,
  rate: number
}

interface Prepayment {
  amount: number;
  repaymentDate: string;
  month: number;
  type: string;
}

/**
 * 默认基本信息配置
 */
const DEFAULT_BASIC_INFO: Partial<BasicInfo> = {
  loanAmount: 1000000, // 默认贷款金额（元）
  loanYears: 30, // 默认贷款年限
  repaymentDate: '', // 默认还款日期
  startDate: '', // 默认开始还款日期
};
// 在类的顶部定义常量
@Component
export default class HousingFund extends Vue {
  LABEL_WIDTH = '100px';
  basicForm: Partial<BasicInfo> = cloneDeep(DEFAULT_BASIC_INFO);
  rateList = [
    { startDate: '2024-01', endDate: '2025-01', fixedRate: 3.1 },
    { startDate: '2025-01', endDate: '2025-01', fixedRate: 2.85 },
    { startDate: '2026-01', endDate: '', fixedRate: 2.6 },
  ];
  loadYearOptions = [
    { value: 5, label: '5年' },
    { value: 10, label: '10年' },
    { value: 15, label: '15年' },
    { value: 20, label: '20年' },
    { value: 30, label: '30年' },
  ];
  fixedRate = 3.1;
  // 浮动利率设置（按期数）
  floatingRates: FloatingRate[] = [
    { startDate: `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`, rate: 3.1 }
  ];
  // 多次提前还款设置
  prepayments: Prepayment[] = [
    { amount: 100000, repaymentDate: '2025-01-01', month: 0, type: 'shorten' }
  ];
  // 计算结果
  showResults = false;
  totalMonths = 0;
  endYear = 0;
  endMonth = 0;
  fixedTotalInterest = 0;
  floatingTotalInterest = 0;
  prepaymentTotalAmount = 0;
  totalSaveInterest = 0;
  finalEndYear = 0;
  finalEndMonth = 0;
  finalTotalMonths = 0; // 添加最终的还款期数
  prepaymentDetails: Array<any> = [];
  repaymentSchedule: Array<any> = [];
  actualRepaymentSchedule: Array<any> = []; // 添加实际还款计划
  // 分页相关
  currentPage = 1;
  pageSize = 12;
  searchTerm = '';
  // 常量定义
  private TEN_THOUSAND = 10000;

  // 计算总月数
  get calculatedTotalMonths(): number {
    return this.basicForm.loanYears * 12;
  }

  // 从日期字符串中获取年份（使用moment优化）
  get startYear(): number {
    if (!this.basicForm.startDate) return moment().year();
    return moment(this.basicForm.startDate, 'YYYY-MM').year();
  }

  // 从日期字符串中获取月份（使用moment优化）
  get startMonth(): number {
    if (!this.basicForm.startDate) return moment().month() + 1;
    return moment(this.basicForm.startDate, 'YYYY-MM').month() + 1;
  }

  // 分页相关方法
  get filteredSchedule(): Array<any> {
    if (!this.searchTerm) {
      return this.repaymentSchedule;
    }
    return this.repaymentSchedule.filter(item =>
        item.month.toString().includes(this.searchTerm) ||
        item.date.includes(this.searchTerm)
    );
  }

  get paginatedSchedule(): Array<any> {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredSchedule.slice(start, end);
  }

  handleAddRateRow(): void {
    this.rateList.push({
      startDate: '',
      endDate: '',
      fixedRate: 0
    });
  }

  handleRemoveRateRow(index: number): void {
    if (this.rateList.length > 1) {
      this.rateList.splice(index, 1);
    }
  }

  // 计算结束日期（使用moment优化）
  handleCalculateEndDate(): void {
    if (!this.basicForm.startDate) return;

    const startMoment = moment(this.basicForm.startDate, 'YYYY-MM');
    const endMoment = startMoment.clone().add(this.calculatedTotalMonths - 1, 'months');

    this.endYear = endMoment.year();
    this.endMonth = endMoment.month() + 1;
  }

  // 添加提前还款
  handleAddPrepayment(): void {
    this.prepayments.push({
      amount: 0,
      repaymentDate: '',
      month: 0,
      type: 'shorten'
    });
  }

  // 更新提前还款期数
  handleUpdatePrepaymentMonth(row: any): void {
    if (row.repaymentDate && this.basicForm.startDate) {
      row.month = this.handleCalculatePrepaymentMonth(row.repaymentDate);
    }
  }

  // 计算提前还款对应的期数（使用moment优化）
  handleCalculatePrepaymentMonth(repaymentDateStr: string): number {
    if (!repaymentDateStr || !this.basicForm.startDate) return 0;

    const startMoment = moment(this.basicForm.startDate, 'YYYY-MM');
    const repayMoment = moment(repaymentDateStr, 'YYYY-MM');

    // 计算从开始日期到提前还款日期的月数差
    const monthDiff = repayMoment.diff(startMoment, 'months') + 1;

    return Math.max(1, monthDiff);
  }

  // 计算指定期间内的利息（等额本金方式）
  handleCalculateInterestForPeriod(principal: number, monthlyRate: number, months: number): number {
    let totalInterest = 0;
    let remainingPrincipal = principal;
    const monthlyPrincipal = principal / months;

    for (let i = 1; i <= months; i++) {
      const monthlyInterest = remainingPrincipal * monthlyRate;
      totalInterest += monthlyInterest;
      remainingPrincipal -= monthlyPrincipal;
    }

    return totalInterest;
  }

  // 等额本金计算
  handleCalculateEqualPrincipal(loanAmount: number, annualRate: number, months: number): any {
    const monthlyRate = annualRate / 100 / 12;
    const monthlyPrincipal = loanAmount / months;
    let remainingPrincipal = loanAmount;
    let totalInterest = 0;
    const schedule = [];

    for (let i = 1; i <= months; i++) {
      const monthlyInterest = remainingPrincipal * monthlyRate;
      const monthlyPayment = monthlyPrincipal + monthlyInterest;
      totalInterest += monthlyInterest;
      remainingPrincipal -= monthlyPrincipal;

      schedule.push({
        month: i,
        date: this.handleGetRepaymentDate(i),
        principal: this.handleFormatCurrency(monthlyPrincipal),
        interest: this.handleFormatCurrency(monthlyInterest),
        total: this.handleFormatCurrency(monthlyPayment),
        remaining: this.handleFormatCurrency(Math.max(0, remainingPrincipal)),
        rawPrincipal: monthlyPrincipal,
        rawInterest: monthlyInterest,
        rawTotal: monthlyPayment,
        rawRemaining: Math.max(0, remainingPrincipal)
      });
    }

    return { totalInterest, schedule };
  }

  // 获取还款日期（使用moment优化）
  handleGetRepaymentDate(monthIndex: number): string {
    if (!this.basicForm.startDate) return '';

    const startMoment = moment(this.basicForm.startDate, 'YYYY-MM');
    const repaymentMoment = startMoment.clone().add(monthIndex - 1, 'months');

    return `${repaymentMoment.year()}年${repaymentMoment.month() + 1}月`;
  }

  // 计算浮动利率总利息（按日期）
  handleCalculateFloatingInterest(): number {
    let totalInterest = 0;
    let remainingPrincipal = this.basicForm.loanAmount; // 移除乘以10000
    const monthlyPrincipal = this.basicForm.loanAmount / this.calculatedTotalMonths; // 移除乘以10000

    // 对利率期间按开始日期排序并转换为期数
    const sortedRates = [...this.floatingRates]
        .filter(period => period.startDate && period.rate > 0)
        .sort((a, b) => {
          const monthA = this.handleConvertDateToMonthIndex(a.startDate);
          const monthB = this.handleConvertDateToMonthIndex(b.startDate);
          return monthA - monthB;
        })
        .map(period => ({
          startMonth: this.handleConvertDateToMonthIndex(period.startDate),
          rate: period.rate
        }));

    // 如果没有有效的利率期间，返回0
    if (sortedRates.length === 0) {
      return 0;
    }

    // 按利率期间计算（按期数）
    for (let i = 0; i < sortedRates.length; i++) {
      const currentPeriod = sortedRates[i];
      const nextPeriod = sortedRates[i + 1];

      const startMonth = currentPeriod.startMonth;
      const endMonth = nextPeriod ? nextPeriod.startMonth - 1 : this.calculatedTotalMonths;

      // 确保开始期数在有效范围内
      if (startMonth > this.calculatedTotalMonths) continue;
      const monthlyRate = currentPeriod.rate / 100 / 12;

      for (let month = startMonth; month <= endMonth && month <= this.calculatedTotalMonths; month++) {
        const monthlyInterest = remainingPrincipal * monthlyRate;
        totalInterest += monthlyInterest;
        remainingPrincipal -= monthlyPrincipal;
      }
    }

    return totalInterest;
  }

  // 计算多次提前还款
  handleCalculateMultiplePrepayments(): void {
    const validPrepayments = this.prepayments
        .filter(p => p.amount > 0 && p.month > 0)
        .sort((a, b) => a.month - b.month);

    this.prepaymentTotalAmount = validPrepayments.reduce((sum, p) => sum + p.amount, 0);
    this.prepaymentDetails = [];
    this.totalSaveInterest = 0;

    let currentPrincipal = this.basicForm.loanAmount;
    let currentMonths = this.calculatedTotalMonths;
    let currentMonth = 1;
    let totalSaveInterest = 0;
    let finalEndDate = this.handleGetEndDate(this.startYear, this.startMonth, currentMonths);
    let finalTotalMonths = currentMonths; // 初始化最终期数
    let actualRepaymentSchedule: any[] = []; // 添加实际还款计划

    for (const prepayment of validPrepayments) {
      if (prepayment.month <= currentMonth) continue;

      // 计算到提前还款时的已还本金
      const monthlyPrincipal = currentPrincipal / currentMonths;
      const monthsBeforePrepayment = prepayment.month - currentMonth;
      const principalPaid = monthlyPrincipal * monthsBeforePrepayment;

      // 计算提前还款前的利息
      const monthlyRate = this.fixedRate / 100 / 12;
      const interestBeforePrepayment = this.handleCalculateInterestForPeriod(
          currentPrincipal, monthlyRate, monthsBeforePrepayment
      );

      // 生成提前还款前的还款计划
      const prepaymentSchedule = this.handleGenerateRepaymentScheduleForPeriod(
          currentPrincipal, monthlyRate, currentMonth, prepayment.month - 1
      );
      actualRepaymentSchedule = actualRepaymentSchedule.concat(prepaymentSchedule);

      // 提前还款后的剩余本金
      const remainingAfterPrepayment = currentPrincipal - principalPaid - prepayment.amount;

      if (remainingAfterPrepayment <= 0) {
        // 如果提前还款后剩余本金为0或负数，贷款已还清
        const saveInterest = this.handleCalculateRemainingInterest(currentPrincipal, monthlyRate, currentMonths) - interestBeforePrepayment;
        totalSaveInterest += saveInterest;

        // 添加提前还款这一期的记录
        actualRepaymentSchedule.push({
          month: prepayment.month,
          date: this.handleGetRepaymentDate(prepayment.month),
          principal: this.handleFormatCurrency(monthlyPrincipal + prepayment.amount),
          interest: this.handleFormatCurrency(0),
          total: this.handleFormatCurrency(monthlyPrincipal + prepayment.amount),
          remaining: this.handleFormatCurrency(0),
          rawPrincipal: monthlyPrincipal + prepayment.amount,
          rawInterest: 0,
          rawTotal: monthlyPrincipal + prepayment.amount,
          rawRemaining: 0,
          isPrepayment: true
        });

        this.prepaymentDetails.push({
          index: this.prepaymentDetails.length + 1,
          amount: this.handleFormatCurrency(prepayment.amount),
          month: prepayment.month,
          type: prepayment.type === 'shorten' ? '缩短期限' : '减少月供',
          saveInterest: this.handleFormatCurrency(saveInterest),
          remainingMonths: '贷款已还清',
          newEndDate: '贷款已还清'
        });

        finalEndDate = this.handleGetRepaymentDate(prepayment.month);
        finalTotalMonths = prepayment.month; // 最终期数就是提前还款的期数
        break;
      }

      let newMonths = currentMonths - monthsBeforePrepayment;
      let saveInterest = 0;
      let newMonthlyPrincipal = monthlyPrincipal;

      if (prepayment.type === 'shorten') {
        // 缩短期限方式：保持月供不变，缩短还款期限
        newMonths = Math.ceil(remainingAfterPrepayment / monthlyPrincipal);
        const originalInterest = this.handleCalculateRemainingInterest(remainingAfterPrepayment, monthlyRate, currentMonths - monthsBeforePrepayment);
        const newInterest = this.handleCalculateRemainingInterest(remainingAfterPrepayment, monthlyRate, newMonths);
        saveInterest = originalInterest - newInterest;
      } else {
        // 减少月供方式：保持期限不变，减少月供金额
        const originalInterest = this.handleCalculateRemainingInterest(remainingAfterPrepayment, monthlyRate, currentMonths - monthsBeforePrepayment);
        newMonthlyPrincipal = remainingAfterPrepayment / (currentMonths - monthsBeforePrepayment);
        const newInterest = this.handleCalculateRemainingInterestWithNewPrincipal(remainingAfterPrepayment, monthlyRate, currentMonths - monthsBeforePrepayment, newMonthlyPrincipal);
        saveInterest = originalInterest - newInterest;
      }

      // 添加提前还款这一期的记录
      actualRepaymentSchedule.push({
        month: prepayment.month,
        date: this.handleGetRepaymentDate(prepayment.month),
        principal: this.handleFormatCurrency(monthlyPrincipal + prepayment.amount),
        interest: this.handleFormatCurrency(0),
        total: this.handleFormatCurrency(monthlyPrincipal + prepayment.amount),
        remaining: this.handleFormatCurrency(remainingAfterPrepayment),
        rawPrincipal: monthlyPrincipal + prepayment.amount,
        rawInterest: 0,
        rawTotal: monthlyPrincipal + prepayment.amount,
        rawRemaining: remainingAfterPrepayment,
        isPrepayment: true
      });

      totalSaveInterest += saveInterest;
      currentPrincipal = remainingAfterPrepayment;
      currentMonths = newMonths;
      currentMonth = prepayment.month;
      finalTotalMonths = prepayment.month + newMonths; // 更新最终期数

      this.prepaymentDetails.push({
        index: this.prepaymentDetails.length + 1,
        amount: this.handleFormatCurrency(prepayment.amount),
        month: prepayment.month,
        type: prepayment.type === 'shorten' ? '缩短期限' : '减少月供',
        saveInterest: this.handleFormatCurrency(saveInterest),
        remainingMonths: newMonths,
        newEndDate: this.handleGetEndDate(this.startYear, this.startMonth, prepayment.month + newMonths)
      });

      finalEndDate = this.handleGetEndDate(this.startYear, this.startMonth, prepayment.month + newMonths);
    }

    // 生成剩余期的还款计划
    if (currentPrincipal > 0) {
      const remainingSchedule = this.handleGenerateRepaymentScheduleForPeriod(
          currentPrincipal, this.fixedRate / 100 / 12, currentMonth, finalTotalMonths
      );
      actualRepaymentSchedule = actualRepaymentSchedule.concat(remainingSchedule);
    }

    this.totalSaveInterest = totalSaveInterest;
    this.finalTotalMonths = finalTotalMonths; // 设置最终的还款期数
    this.actualRepaymentSchedule = actualRepaymentSchedule; // 设置实际还款计划
    const finalDateParts = finalEndDate.split('年');
    this.finalEndYear = parseInt(finalDateParts[0]);
    this.finalEndMonth = parseInt(finalDateParts[1].replace('月', ''));
  }

  /**
   * 生成指定期间的还款计划
   * @param principal 剩余本金
   * @param monthlyRate 月利率
   * @param startMonth 开始期数
   * @param endMonth 结束期数
   * @returns 还款计划数组，包含每期的还款信息
   */
  handleGenerateRepaymentScheduleForPeriod(principal: number, monthlyRate: number, startMonth: number, endMonth: number): any[] {
    const schedule = [];
    let remainingPrincipal = principal;

    const totalLoanMonths = this.calculatedTotalMonths;
    const monthlyPrincipal = (this.basicForm.loanAmount * this.TEN_THOUSAND) / totalLoanMonths;

    for (let i = startMonth; i <= endMonth; i++) {
      const monthlyInterest = remainingPrincipal * monthlyRate;
      const monthlyPayment = monthlyPrincipal + monthlyInterest;

      schedule.push({
        month: i, // 期数
        date: this.handleGetRepaymentDate(i), // 还款日期
        principal: this.handleFormatCurrency(monthlyPrincipal), // 本金（格式化后）
        interest: this.handleFormatCurrency(monthlyInterest), // 利息（格式化后）
        total: this.handleFormatCurrency(monthlyPayment), // 月供总额（格式化后）
        remaining: this.handleFormatCurrency(Math.max(0, remainingPrincipal - monthlyPrincipal)), // 剩余本金（格式化后）
        rawPrincipal: monthlyPrincipal, // 本金（原始数值）
        rawInterest: monthlyInterest, // 利息（原始数值）
        rawTotal: monthlyPayment, // 月供总额（原始数值）
        rawRemaining: Math.max(0, remainingPrincipal - monthlyPrincipal), // 剩余本金（原始数值）
        isPrepayment: false // 是否为提前还款
      });

      remainingPrincipal -= monthlyPrincipal;
    }

    return schedule;
  }

  /**
   * 计算剩余利息（等额本金方式）
   * @param principal 剩余本金
   * @param monthlyRate 月利率
   * @param months 剩余期数
   * @returns 剩余利息总额
   */
  handleCalculateRemainingInterest(principal: number, monthlyRate: number, months: number): number {
    let totalInterest = 0;
    let remainingPrincipal = principal;
    const monthlyPrincipal = principal / months;

    for (let i = 1; i <= months; i++) {
      const monthlyInterest = remainingPrincipal * monthlyRate;
      totalInterest += monthlyInterest;
      remainingPrincipal -= monthlyPrincipal;
    }

    return totalInterest;
  }

  /**
   * 计算新本金下的剩余利息
   * @param principal 剩余本金
   * @param monthlyRate 月利率
   * @param months 剩余期数
   * @param newMonthlyPrincipal 新的每月本金还款额
   * @returns 剩余利息总额
   */
  handleCalculateRemainingInterestWithNewPrincipal(principal: number, monthlyRate: number, months: number, newMonthlyPrincipal: number): number {
    let totalInterest = 0;
    let remainingPrincipal = principal;

    for (let i = 1; i <= months; i++) {
      const monthlyInterest = remainingPrincipal * monthlyRate;
      totalInterest += monthlyInterest;
      remainingPrincipal -= newMonthlyPrincipal;
    }

    return totalInterest;
  }

  /**
   * 获取贷款结束日期
   * @param startYear 开始年份
   * @param startMonth 开始月份
   * @param totalMonths 总期数
   * @returns 格式化的结束日期字符串（YYYY年MM月）
   */
  handleGetEndDate(startYear: number, startMonth: number, totalMonths: number): string {
    const startDateStr = `${startYear}-${startMonth.toString().padStart(2, '0')}`;
    const startMoment = moment(startDateStr, 'YYYY-MM');
    const endMoment = startMoment.clone().add(totalMonths - 1, 'months');

    return `${endMoment.year()}年${endMoment.month() + 1}月`;
  }

  /**
   * 格式化货币金额
   * @param amount 金额数值
   * @returns 格式化后的货币字符串（带¥符号和千位分隔符）
   */
  handleFormatCurrency(amount = 0): string {
    console.log('formatCurrency', amount);
    // 确保amount是数字类型
    const numAmount = Number(amount);
    // 检查是否为有效数字，如果不是则使用0作为默认值
    const validAmount = isNaN(numAmount) ? 0 : numAmount;
    // 添加人民币符号，保留两位小数，并添加千位分隔符
    return '¥' + validAmount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  }

  /**
   * 将日期字符串转换为对应的还款期数
   * @param dateStr 日期字符串（YYYY-MM格式）
   * @returns 对应的还款期数
   */
  handleConvertDateToMonthIndex(dateStr: string): number {
    if (!dateStr || !this.basicForm.startDate) return 1;

    const startMoment = moment(this.basicForm.startDate, 'YYYY-MM');
    const dateMoment = moment(dateStr, 'YYYY-MM');

    // 计算从开始日期到指定日期的月数差
    const monthDiff = dateMoment.diff(startMoment, 'months') + 1;

    // 确保至少为第1期
    return Math.max(1, monthDiff);
  }

  /**
   * 处理分页大小变化
   * @param val 新的每页显示条数
   */
  handleSizeChange(val: number): void {
    this.pageSize = val;
    this.currentPage = 1; // 重置为第一页
  }

  /**
   * 处理当前页码变化
   * @param val 新的当前页码
   */
  handleCurrentChange(val: number): void {
    this.currentPage = val;
  }

  /**
   * 查看还款计划详情
   * @param row 还款计划行数据
   */
  handleViewDetail(row: any): void {
    this.$message({
      message: `第${row.month}期详情：本金${row.principal}，利息${row.interest}，月供${row.total}，剩余本金${row.remaining}`,
      type: 'info'
    });
  }

  /**
   * 主计算函数，整合所有计算逻辑
   */
  handleCalculate(): void {
    // 确保所有提前还款都有计算好的期数
    this.prepayments.forEach(row => {
      if (row.repaymentDate) {
        row.month = this.handleCalculatePrepaymentMonth(row.repaymentDate);
      }
    });

    // 验证基本贷款信息
    if (!this.basicForm.loanAmount || !this.basicForm.loanYears || !this.startYear || !this.startMonth) {
      this.$message.error('请填写完整的贷款信息');
      return;
    }

    // 验证浮动利率设置
    const validRates = this.floatingRates.filter(period => period.startDate && period.rate > 0);

    if (validRates.length === 0) {
      this.$message.error('请至少设置一个有效的浮动利率期间');
      return;
    }

    // 设置总期数和计算结束日期
    this.totalMonths = this.calculatedTotalMonths;
    this.handleCalculateEndDate();

    // 计算固定利率总利息和还款计划
    const fixedResult = this.handleCalculateEqualPrincipal(this.basicForm.loanAmount * this.TEN_THOUSAND, this.fixedRate, this.totalMonths);
    this.fixedTotalInterest = fixedResult.totalInterest;
    this.repaymentSchedule = fixedResult.schedule;

    // 计算浮动利率总利息
    this.floatingTotalInterest = this.handleCalculateFloatingInterest();

    // 计算多次提前还款的影响
    this.handleCalculateMultiplePrepayments();

    // 根据是否有提前还款选择显示哪种还款计划
    const hasPrepayments = this.prepayments.some(p => p.amount > 0);
    if (hasPrepayments && this.actualRepaymentSchedule.length > 0) {
      // 使用实际还款计划（包含提前还款）
      this.repaymentSchedule = this.actualRepaymentSchedule;
    }

    // 重置分页状态
    this.currentPage = 1;
    this.searchTerm = '';

    // 显示计算结果
    this.showResults = true;
  }

  /**
   * 重置所有表单数据和计算结果
   */
  handleReset(): void {
    this.basicForm = cloneDeep(DEFAULT_BASIC_INFO); // 重置基本表单数据
    this.fixedRate = 3.1; // 重置固定利率
    this.floatingRates = [{ startDate: this.basicForm.startDate, rate: 3.1 }]; // 重置浮动利率
    this.prepayments = [{ amount: 0, repaymentDate: '', month: 0, type: 'shorten' }]; // 重置提前还款设置
    this.showResults = false; // 隐藏计算结果
    this.currentPage = 1; // 重置当前页码
    this.pageSize = 12; // 重置每页显示条数
    this.searchTerm = ''; // 清空搜索条件
  }
}
</script>

<style lang="scss" scoped>
.housing-fund {
  height: 100vh;
  padding: 20px;
  background-color: #f5f7fa;

  .calculator-container {
    width: 80%;
    margin: 0 auto;
    background: white;
    padding: 10px 30px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    .calculator-header {
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      color: #409eff;
      margin-bottom: 30px;
    }

    .input-section {
      margin-bottom: 30px;
    }

    .el-table {
      margin-top: 10px;
    }

    .rate-section-card,
    .prepayment-section-card {
      margin-bottom: 30px;
    }

    .rate-section {
      .rate-period {
        display: grid;
        grid-template-columns: 1fr 1fr auto;
        gap: 10px;
        align-items: end;
        margin-bottom: 15px;
        padding: 15px;
        border: 1px solid #ebeef5;
        border-radius: 4px;
      }

      .rate-tip {
        font-size: 12px;
        color: #909399;
        margin-top: 5px;
      }

      .floating-rates-form {
        width: 100%;
      }
    }

    .prepayment-section {
      .prepayment-list {
        .prepayment-item {
          margin-bottom: 15px;

          .prepayment-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;

            h5 {
              margin: 0;
              color: #409eff;
            }
          }
        }
      }
    }

    .action-section {
      margin: 30px 0;

      .el-button {
        margin: 0 10px;
      }
    }

    .results-section {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ebeef5;

      h4, h5, h6 {
        color: #409eff;
        margin-bottom: 15px;
      }

      .basic-info, .interest-results, .prepayment-results {
        margin-bottom: 20px;

        p {
          margin: 8px 0;
          font-size: 14px;
        }

        .prepayment-summary, .prepayment-details {
          margin-top: 15px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 4px;
        }
      }

      .repayment-schedule {
        margin-top: 20px;

        .schedule-controls {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }

        .el-pagination {
          margin-top: 10px;
          text-align: center;
        }
      }
    }
  }
}
</style>
