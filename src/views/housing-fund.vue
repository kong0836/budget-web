<template>
  <div class="housing-fund">
    <div class="calculator-container">
      <div class="calculator-header">公积金贷款利息计算器</div>

      <h3>基本信息</h3>
      <el-form
        :model="basicForm"
        ref="basicForm"
        :label-width="LABEL_WIDTH">
        <el-form-item label="贷款总额" prop="loanAmount">
          <el-input
            v-model="loanAmount"
            placeholder="请输入贷款总额"
            type="number">
            <template slot="append">万元</template>
          </el-input>
        </el-form-item>
        <el-form-item label="贷款年限" prop="loanYears">
          <el-select v-model="loanYears">
            <el-option
              v-for="item in loadYearOptions"
              :key="item.value"
              :value="item.value"
              :label="item.label"/>
          </el-select>
        </el-form-item>
        <el-form-item label="首次还款日期" prop="startDate">
          <el-date-picker
            v-model="startDate"
            type="month"
            placeholder="选择还款年月"
            format="yyyy年MM月"
            value-format="yyyy-MM">
          </el-date-picker>
        </el-form-item>
      </el-form>

      <h3>利率设置</h3>
      <el-button
        type="primary"
        size="small"
        @click="handleAddRateRow">添加利率行</el-button>
      <el-table
        :data="rateList"
        border
        stripe>
        <el-table-column label="开始日期" prop="startDate">
          <template v-slot="{row}">
            <el-date-picker
              v-model="row.startDate"
              type="month"
              placeholder="选择还款年月"
              format="yyyy年MM月"
              value-format="yyyy-MM"/>
          </template>
        </el-table-column>
        <el-table-column label="结束日期" prop="endDate">
          <template v-slot="{row}">
            <el-date-picker
              v-model="row.endDate"
              type="month"
              placeholder="选择还款年月"
              format="yyyy年MM月"
              value-format="yyyy-MM"/>
          </template>
        </el-table-column>
        <el-table-column label="年利率（%）" prop="fixedRate">
          <template v-slot="{row}">
            <el-input
              v-model="row.fixedRate"
              placeholder="请输入年利率"
              type="number"/>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
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
        type="primary"
        size="small"
        @click="handleAddPrepayment">添加提前还款</el-button>
      <el-table
        :data="prepayments"
        border
        stripe>
        <el-table-column label="还款金额（元）" prop="amount">
          <template v-slot="{row}">
            <el-input
              v-model="row.amount"
              placeholder="请输入还款金额"
              type="number"/>
          </template>
        </el-table-column>
        <el-table-column label="还款时间" prop="repaymentDate">
          <template v-slot="{row}">
            <el-date-picker
              v-model="row.repaymentDate"
              type="month"
              placeholder="选择还款年月"
              format="yyyy年MM月"
              value-format="yyyy-MM"
              @change="handleUpdatePrepaymentMonth(row)"/>
          </template>
        </el-table-column>
        <el-table-column
          label="对应期数"
          prop="month"
          width="100">
          <template v-slot="{row}">
            <span>{{ row.month || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="还款方式" prop="type">
          <template v-slot="{row}">
            <el-radio-group v-model="row.type" size="small">
              <el-radio label="shorten">缩短还款期限</el-radio>
              <el-radio label="reduce">减少月供金额</el-radio>
            </el-radio-group>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
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
        <p><strong>贷款总额：</strong>{{ handleFormatCurrency(loanAmount * TEN_THOUSAND) }}</p>
        <p><strong>贷款期限：</strong>{{ loanYears }}年（{{ totalMonths }}个月）</p>
        <p><strong>开始还款：</strong>{{ startDate ? startDate.replace('-', '年') + '月' : '' }}</p>
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
            <p><strong>最终还款期限：</strong>{{ finalEndYear }}年{{ finalEndMonth }}月</p>
          </div>

          <div class="prepayment-details">
            <h6>每次提前还款详情</h6>
            <el-table :data="prepaymentDetails"
                      border>
              <el-table-column
                label="序号"
                prop="index"></el-table-column>
              <el-table-column
                label="还款金额"
                prop="amount"></el-table-column>
              <el-table-column
                label="还款时间"
                prop="month"></el-table-column>
              <el-table-column
                label="还款方式"
                prop="type"></el-table-column>
              <el-table-column
                label="节省利息"
                prop="saveInterest"></el-table-column>
              <el-table-column
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

// 在类的顶部定义常量
@Component
export default class HousingFund extends Vue {
  // 常量定义
  private TEN_THOUSAND = 10000;

  LABEL_WIDTH = '100px';

  basicForm = {
    loanAmount: 50,
    loanYears: 30,
  };

  rateForm = {
    rateType: 'fixed',
    fixedRate: 3.1,
  };

  rateList = [
    { startDate: '2023-01', endDate: '2024-01', fixedRate: 3.1 },
  ];

  // 基本参数
  loanAmount = 50;

  loanYears = 30;

  loadYearOptions = [
    { value: 5, label: '5年' },
    { value: 10, label: '10年' },
    { value: 15, label: '15年' },
    { value: 20, label: '20年' },
    { value: 30, label: '30年' },
  ];

  startDate = `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;

  // 利率类型
  rateType = 'fixed';

  fixedRate = 3.1;

  // 浮动利率设置（按期数）
  floatingRates: Array<{ startDate: string, rate: number }> = [
    { startDate: `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`, rate: 3.1 }
  ];

  // 多次提前还款设置
  prepayments: Array<{ amount: number, repaymentDate: string, month: number, type: string }> = [
    { amount: 10000, repaymentDate: '', month: 12, type: 'shorten' }
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

  prepaymentDetails: Array<any> = [];

  repaymentSchedule: Array<any> = [];

  // 分页相关
  currentPage = 1;

  pageSize = 12;

  searchTerm = '';

  // 计算总月数
  get calculatedTotalMonths(): number {
    return this.loanYears * 12;
  }

  // 从日期字符串中获取年份
  get startYear(): number {
    if (!this.startDate) return new Date().getFullYear();
    return parseInt(this.startDate.split('-')[0]);
  }

  // 从日期字符串中获取月份
  get startMonth(): number {
    if (!this.startDate) return new Date().getMonth() + 1;
    return parseInt(this.startDate.split('-')[1]);
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

  // 计算结束日期
  handleCalculateEndDate(): void {
    let endYear = this.startYear + Math.floor((this.startMonth + this.calculatedTotalMonths - 1) / 12);
    let endMonth = (this.startMonth + this.calculatedTotalMonths - 1) % 12 + 1;
    this.endYear = endYear;
    this.endMonth = endMonth;
  }

  // 添加利率期间
  handleAddRatePeriod(): void {
    const lastPeriod = this.floatingRates[this.floatingRates.length - 1];
    const [year, month] = lastPeriod.startDate.split('-').map(Number);
    const nextDate = new Date(year, month);
    nextDate.setMonth(nextDate.getMonth() + 12); // 默认间隔12个月
    const nextDateStr = `${nextDate.getFullYear()}-${(nextDate.getMonth() + 1).toString().padStart(2, '0')}`;
    this.floatingRates.push({
      startDate: nextDateStr,
      rate: 3.1
    });
  }

  // 删除利率期间
  handleRemoveRatePeriod(index: number): void {
    this.floatingRates.splice(index, 1);
  }

  // 添加提前还款
  handleAddPrepayment(): void {
    const lastPrepayment = this.prepayments[this.prepayments.length - 1];
    const currentDate = new Date();
    const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 12, 1);

    this.prepayments.push({
      amount: 0,
      repaymentDate: '',
      month: 0,
      type: 'shorten'
    });
  }

  // 更新提前还款期数
  handleUpdatePrepaymentMonth(row: any): void {
    if (row.repaymentDate && this.startDate) {
      row.month = this.handleCalculatePrepaymentMonth(row.repaymentDate);
    }
  }

  // 计算提前还款对应的期数
  handleCalculatePrepaymentMonth(repaymentDateStr: string): number {
    if (!repaymentDateStr || !this.startDate) return 0;

    const [startYear, startMonth] = this.startDate.split('-').map(Number);
    const [repayYear, repayMonth] = repaymentDateStr.split('-').map(Number);

    // 计算从开始日期到提前还款日期的月数差
    const monthDiff = (repayYear - startYear) * 12 + (repayMonth - startMonth) + 1;

    return Math.max(1, monthDiff);
  }

  // 删除提前还款
  handleRemovePrepayment(index: number): void {
    this.prepayments.splice(index, 1);
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

  // 获取还款日期
  handleGetRepaymentDate(monthIndex: number): string {
    const totalMonths = this.startMonth + monthIndex - 1;
    const year = this.startYear + Math.floor((totalMonths - 1) / 12);
    const month = (totalMonths - 1) % 12 + 1;
    return `${year}年${month}月`;
  }

  // 计算浮动利率总利息（按日期）
  handleCalculateFloatingInterest(): number {
    let totalInterest = 0;
    let remainingPrincipal = this.loanAmount * this.TEN_THOUSAND;
    const monthlyPrincipal = (this.loanAmount * this.TEN_THOUSAND) / this.calculatedTotalMonths;

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

    // 修改前：let currentPrincipal = this.loanAmount;
    let currentPrincipal = this.loanAmount * this.TEN_THOUSAND;
    let currentMonths = this.calculatedTotalMonths;
    let currentMonth = 1;
    let totalSaveInterest = 0;
    let finalEndDate = this.handleGetEndDate(this.startYear, this.startMonth, currentMonths);

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

      // 提前还款后的剩余本金
      const remainingAfterPrepayment = currentPrincipal - principalPaid - prepayment.amount;

      if (remainingAfterPrepayment <= 0) {
        // 如果提前还款后剩余本金为0或负数，贷款已还清
        const saveInterest = this.handleCalculateRemainingInterest(currentPrincipal, monthlyRate, currentMonths) - interestBeforePrepayment;
        totalSaveInterest += saveInterest;

        this.prepaymentDetails.push({
          index: this.prepaymentDetails.length + 1,
          amount: this.handleFormatCurrency(prepayment.amount),
          month: prepayment.month,
          type: prepayment.type === 'shorten' ? '缩短期限' : '减少月供',
          saveInterest: this.handleFormatCurrency(saveInterest),
          newEndDate: '贷款已还清'
        });

        finalEndDate = this.handleGetRepaymentDate(prepayment.month);
        break;
      }

      let newMonths = currentMonths - monthsBeforePrepayment;
      let saveInterest = 0;

      if (prepayment.type === 'shorten') {
        // 缩短期限方式：保持月供不变，缩短还款期限
        newMonths = Math.ceil(remainingAfterPrepayment / monthlyPrincipal);
        const originalInterest = this.handleCalculateRemainingInterest(remainingAfterPrepayment, monthlyRate, currentMonths - monthsBeforePrepayment);
        const newInterest = this.handleCalculateRemainingInterest(remainingAfterPrepayment, monthlyRate, newMonths);
        saveInterest = originalInterest - newInterest;
      } else {
        // 减少月供方式：保持期限不变，减少月供金额
        const originalInterest = this.handleCalculateRemainingInterest(remainingAfterPrepayment, monthlyRate, currentMonths - monthsBeforePrepayment);
        const newMonthlyPrincipal = remainingAfterPrepayment / (currentMonths - monthsBeforePrepayment);
        const newInterest = this.handleCalculateRemainingInterestWithNewPrincipal(remainingAfterPrepayment, monthlyRate, currentMonths - monthsBeforePrepayment, newMonthlyPrincipal);
        saveInterest = originalInterest - newInterest;
      }

      totalSaveInterest += saveInterest;
      currentPrincipal = remainingAfterPrepayment;
      currentMonths = newMonths;
      currentMonth = prepayment.month;

      this.prepaymentDetails.push({
        index: this.prepaymentDetails.length + 1,
        amount: this.handleFormatCurrency(prepayment.amount),
        month: prepayment.month,
        type: prepayment.type === 'shorten' ? '缩短期限' : '减少月供',
        saveInterest: this.handleFormatCurrency(saveInterest),
        newEndDate: this.handleGetEndDate(this.startYear, this.startMonth, prepayment.month + newMonths)
      });

      finalEndDate = this.handleGetEndDate(this.startYear, this.startMonth, prepayment.month + newMonths);
    }

    this.totalSaveInterest = totalSaveInterest;
    const finalDateParts = finalEndDate.split('年');
    this.finalEndYear = parseInt(finalDateParts[0]);
    this.finalEndMonth = parseInt(finalDateParts[1].replace('月', ''));
  }

  // 计算指定期间的利息
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

  // 计算剩余利息
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

  // 计算新本金下的剩余利息
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

  // 获取结束日期
  handleGetEndDate(startYear: number, startMonth: number, totalMonths: number): string {
    const endYear = startYear + Math.floor((startMonth + totalMonths - 1) / 12);
    const endMonth = (startMonth + totalMonths - 1) % 12 + 1;
    return `${endYear}年${endMonth}月`;
  }

  // 格式化货币
  handleFormatCurrency(amount = 0): string {
    console.log('formatCurrency', amount);
    // 确保amount是数字类型
    const numAmount = Number(amount);
    // 检查是否为有效数字，如果不是则使用0作为默认值
    const validAmount = isNaN(numAmount) ? 0 : numAmount;
    return '¥' + validAmount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  }

  // 将日期转换为期数
  handleConvertDateToMonthIndex(dateStr: string): number {
    if (!dateStr) return 1;

    const [year, month] = dateStr.split('-').map(Number);
    const startYear = this.startYear;
    const startMonth = this.startMonth;

    // 计算从开始日期到指定日期的月数差
    const monthDiff = (year - startYear) * 12 + (month - startMonth) + 1;

    // 确保至少为第1期
    return Math.max(1, monthDiff);
  }

  handleSizeChange(val: number): void {
    this.pageSize = val;
    this.currentPage = 1;
  }

  handleCurrentChange(val: number): void {
    this.currentPage = val;
  }

  // 查看详情
  handleViewDetail(row: any): void {
    this.$message({
      message: `第${row.month}期详情：本金${row.principal}，利息${row.interest}，月供${row.total}，剩余本金${row.remaining}`,
      type: 'info'
    });
  }

  // 主计算函数
  handleCalculate(): void {
    // 确保所有提前还款都有计算好的期数
    this.prepayments.forEach(row => {
      if (row.repaymentDate) {
        row.month = this.handleCalculatePrepaymentMonth(row.repaymentDate);
      }
    });

    if (!this.loanAmount || !this.loanYears || !this.startYear || !this.startMonth) {
      this.$message.error('请填写完整的贷款信息');
      return;
    }

    // 验证浮动利率设置
    const validRates = this.floatingRates.filter(period => period.startDate && period.rate > 0);

    if (validRates.length === 0) {
      this.$message.error('请至少设置一个有效的浮动利率期间');
      return;
    }

    this.totalMonths = this.calculatedTotalMonths;
    this.handleCalculateEndDate();

    // 计算固定利率总利息
    const fixedResult = this.handleCalculateEqualPrincipal(this.loanAmount * this.TEN_THOUSAND, this.fixedRate, this.totalMonths);
    this.fixedTotalInterest = fixedResult.totalInterest;
    this.repaymentSchedule = fixedResult.schedule;

    // 计算浮动利率总利息
    this.floatingTotalInterest = this.handleCalculateFloatingInterest();

    // 计算多次提前还款
    this.handleCalculateMultiplePrepayments();

    // 重置分页
    this.currentPage = 1;
    this.searchTerm = '';

    this.showResults = true;
  }

  // 重置
  handleReset(): void {
    this.loanAmount = 50;
    this.loanYears = 30;
    this.fixedRate = 3.1;
    this.startDate = `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;
    this.floatingRates = [{ startDate: this.startDate, rate: 3.1 }];
    this.prepayments = [{ amount: 0, repaymentDate: '', month: 0, type: 'shorten' }];
    this.showResults = false;
    this.currentPage = 1;
    this.pageSize = 12;
    this.searchTerm = '';
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