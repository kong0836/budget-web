<template>
  <div class="housing-fund">
    <div class="calculator-container">
      <div class="calculator-header">贷款利息计算器</div>

      <basic-info ref="basicInfoRef" @update="handleUpdateBasicInfo"/>

      <rate-list ref="rateListRef" @update="handleUpdateRateInfo"/>

      <prepayment-list ref="prepaymentListRef" @update="handleUpdatePrepaymentList"/>

      <!-- 计算按钮 -->

      <el-button
          size="small"
          type="primary"
          @click="handleCalculate">
        计算
      </el-button>
      <el-button size="small" @click="handleReset">
        重置
      </el-button>

      <!-- 计算结果 -->
      <div v-if="showResults" class="results-section">
        <h4>计算结果</h4>

        <div class="basic-info">
          <p><strong>贷款总额：</strong>{{ handleFormatCurrency(basicInfo.loanAmount) }}</p>
          <p><strong>贷款期限：</strong>{{ basicInfo.loanYears }}年（{{ totalMonths }}个月）</p>
          <p><strong>开始还款：</strong>{{ basicInfo.startDate }}</p>
          <p><strong>结束还款：</strong>{{ endYear }}年{{ endMonth }}月</p>
        </div>

        <div class="interest-results">
          <h5>利息总额</h5>
          <p><strong>浮动利率总利息：</strong>{{ handleFormatCurrency(totalInterest) }}</p>
        </div>

        <div v-if="prepaymentList.some(p => p.amount > 0)" class="prepayment-results">
          <h5>提前还款分析</h5>
          <div class="prepayment-summary">
            <p><strong>提前还款总次数：</strong>{{ prepaymentList.filter(p => p.amount > 0).length }}次</p>
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
            <el-table-column
                align="right"
                label="年利率(%)"
                prop="annualRate"
                sortable>
              <template v-slot="{ row }">
                <span>{{ row.annualRate.toFixed(2) }}</span>
              </template>
            </el-table-column>
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
import { BasicForm, PrepaymentInfo, RateInfo } from "@/types/loan";
import BasicInfo from "@/views/loan/basic-info.vue";
import RateList from "@/views/loan/rate-list.vue";
import PrepaymentList from "@/views/loan/prepayment-list.vue";

@Component({
  components: { PrepaymentList, RateList, BasicInfo }
})
export default class LoanList extends Vue {
  basicInfo: Partial<BasicForm> = {};
  rateList: RateInfo[] = [];
  prepaymentList: PrepaymentInfo[] = [];

  // 固定利率值
  fixedRate = 3.1;
  // 计算结果相关字段
  showResults = false; // 是否显示计算结果
  totalMonths = 0; // 贷款总月数
  endYear = 0; // 贷款结束年份
  endMonth = 0; // 贷款结束月份
  totalInterest = 0; // 浮动利率总利息
  totalSaveInterest = 0; // 节省利息总额
  finalEndYear = 0; // 最终还款结束年份
  finalEndMonth = 0; // 最终还款结束月份
  finalTotalMonths = 0; // 最终的还款期数
  prepaymentDetails: Array<any> = []; // 每次提前还款的详细信息
  scheduleTable = {
    data: [],
    currentPage: 1,
    pageSize: 10,
  };
  repaymentSchedule: Array<any> = []; // 还款计划表
  actualRepaymentSchedule: Array<any> = []; // 实际还款计划(含提前还款)
  // 分页相关字段
  currentPage = 1; // 当前页码
  pageSize = 12; // 每页显示条数
  searchTerm = ''; // 搜索关键词

  // 贷款总月数
  get calculatedTotalMonths(): number {
    return this.basicInfo.loanYears * 12;
  }

  // 等额本金-每月还款本金（元）
  get monthlyPrincipal(): number {
    return parseFloat((this.basicInfo.loanAmount / this.calculatedTotalMonths).toFixed(2));
  }

  /**
   * 从日期字符串中获取年份（使用moment优化）
   * @returns 开始年份
   */
  get startYear(): number {
    if (!this.basicInfo.startDate) return moment().year();
    return moment(this.basicInfo.startDate, 'YYYY-MM').year();
  }

  /**
   * 从日期字符串中获取月份（使用moment优化）
   * @returns 开始月份
   */
  get startMonth(): number {
    if (!this.basicInfo.startDate) return moment().month() + 1;
    return moment(this.basicInfo.startDate, 'YYYY-MM').month() + 1;
  }

  /**
   * 按搜索条件过滤还款计划
   * @returns 过滤后的还款计划数组
   */
  get filteredSchedule(): Array<any> {
    if (!this.searchTerm) {
      return this.repaymentSchedule;
    }
    return this.repaymentSchedule.filter(item =>
        item.month.toString().includes(this.searchTerm) ||
        item.date.includes(this.searchTerm)
    );
  }

  /**
   * 获取当前页显示的还款计划数据
   * @returns 当前页的还款计划数据
   */
  get paginatedSchedule(): Array<any> {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredSchedule.slice(start, end);
  }

  /**
   * 计算提前还款总金额
   * @returns 提前还款总金额
   */
  get prepaymentTotalAmount(): number {
    const validPrepayments = this.prepaymentList
        .filter(p => p.amount > 0 && p.period > 0);
    return validPrepayments.reduce((sum, p) => sum + p.amount, 0);
  }

  handleUpdateBasicInfo(basicInfo: BasicForm) {
    this.basicInfo = cloneDeep(basicInfo);
  }

  handleUpdateRateInfo(rateList: RateInfo[]) {
    this.rateList = cloneDeep(rateList);
  }

  handleUpdatePrepaymentList(prepaymentList: PrepaymentInfo[]) {
    prepaymentList.forEach(row => {
      if (row.date) {
        row.period = this.handleCalculatePeriod(row.date);
      }
    });
    this.prepaymentList = cloneDeep(prepaymentList);
  }

  /**
   * 计算贷款结束日期（使用moment优化）
   */
  handleCalculateEndDate(): void {
    if (!this.basicInfo.startDate) return;

    const startMoment = moment(this.basicInfo.startDate, 'YYYY-MM');
    const endMoment = startMoment.clone().add(this.calculatedTotalMonths - 1, 'months');

    this.endYear = endMoment.year();
    this.endMonth = endMoment.month() + 1;
  }

  /**
   * 计算提前还款对应的期数（使用moment优化）
   * @param date 提前还款日期字符串
   * @returns 对应的还款期数
   */
  handleCalculatePeriod(date: string): number {
    if (!date || !this.basicInfo.startDate) return 0;

    const startMoment = moment(this.basicInfo.startDate, 'YYYY-MM');
    const repayMoment = moment(date, 'YYYY-MM');

    // 计算从开始日期到提前还款日期的月数差
    const monthDiff = repayMoment.diff(startMoment, 'months') + 1;

    return Math.max(1, monthDiff);
  }

  /**
   * 根据利率设置信息和指定时间获取实际年利率值
   * @param date 指定时间，默认为当前时间
   * @returns 实际年利率值
   */
  handleGetCurrentAnnualRate(date: string = moment().format('YYYY-MM')): number {
    if (!this.rateList || this.rateList.length === 0) {
      return this.fixedRate; // 如果没有利率设置，返回默认固定利率
    }

    const targetDate = moment(date, 'YYYY-MM');

    // 遍历利率列表，找到当前时间对应的利率
    for (const rateItem of this.rateList) {
      if (!rateItem.startDate || !rateItem.rate) continue;

      const startDate = moment(rateItem.startDate, 'YYYY-MM');
      let endDate = null;

      if (rateItem.endDate) {
        endDate = moment(rateItem.endDate, 'YYYY-MM');
      }

      // 检查是否在当前利率区间内
      if (targetDate.isSameOrAfter(startDate)) {
        // 如果有结束日期且当前日期在结束日期之后，跳过
        if (endDate && targetDate.isAfter(endDate)) {
          continue;
        }

        return rateItem.rate;
      }
    }

    // 如果当前时间不在任何利率区间内，返回第一个利率或默认利率
    return this.rateList[0]?.rate || this.fixedRate;
  }

  /**
   * 计算指定期间内的利息（等额本金方式）
   * @param principal 剩余本金金额
   * @param fixedRate 年利率
   * @param date 提前还款日期
   * @returns 期间内的总利息
   */
  handleCalculateInterest(principal: number, fixedRate: number, date: string): number {
    try {
      console.log('handleCalculateInterest', principal, fixedRate, date);
      let totalInterest = 0;
      // 日利率
      const dailyRate = fixedRate / 100 / 360;
      // 计算提前还款日期之前的利息
      const endDate = moment(date, 'YYYY-MM');
      // 获取endDate上一个月的BasicInfo.repaymentDate日作为startDate
      const startDateMonth = endDate.clone().subtract(1, 'months');
      // 获取每月还款日期，如果没有设置则默认为1日
      const repaymentDay = this.basicInfo.repaymentDate || '01';
      // 构建正确的startDate
      const startDate = moment(`${startDateMonth.format('YYYY-MM')}-${repaymentDay}`, 'YYYY-MM-DD');

      const days = endDate.diff(startDate, 'days');
      totalInterest = principal * dailyRate * days;

      return totalInterest;
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * 等额本金计算
   * @param loanAmount 贷款总额
   * @param annualRate 年利率
   * @param months 还款期数
   * @returns 包含总利息和还款计划的对象
   */
  handleCalculateEqualPrincipal(loanAmount: number, annualRate: number, months: number): any {
    const monthlyRate = annualRate / 100 / 12; // 计算月利率
    const monthlyPrincipal = loanAmount / months; // 每月应还本金
    let remainingPrincipal = loanAmount; // 剩余本金
    let totalInterest = 0; // 总利息
    const schedule = []; // 还款计划数组

    for (let i = 1; i <= months; i++) {
      const monthlyInterest = remainingPrincipal * monthlyRate; // 当月利息
      const monthlyPayment = monthlyPrincipal + monthlyInterest; // 当月还款总额
      totalInterest += monthlyInterest; // 累加总利息
      remainingPrincipal -= monthlyPrincipal; // 更新剩余本金

      // 获取当期还款日期对应的月份字符串（YYYY-MM格式）
      const repaymentDateStr = this.handleGetRepaymentDate(i).replace('年', '-').replace('月', '');
      // 获取当期对应的实际年利率
      const currentAnnualRate = this.handleGetCurrentAnnualRate(repaymentDateStr);

      // 添加当期还款计划记录
      schedule.push({
        month: i, // 期数
        date: this.handleGetRepaymentDate(i), // 还款日期
        principal: this.handleFormatCurrency(monthlyPrincipal), // 本金（格式化后）
        interest: this.handleFormatCurrency(monthlyInterest), // 利息（格式化后）
        total: this.handleFormatCurrency(monthlyPayment), // 月供总额（格式化后）
        remaining: this.handleFormatCurrency(Math.max(0, remainingPrincipal)), // 剩余本金（格式化后）
        annualRate: currentAnnualRate, // 当期年利率
        rawPrincipal: monthlyPrincipal, // 本金（原始数值）
        rawInterest: monthlyInterest, // 利息（原始数值）
        rawTotal: monthlyPayment, // 月供总额（原始数值）
        rawRemaining: Math.max(0, remainingPrincipal) // 剩余本金（原始数值）
      });
    }

    return { totalInterest, schedule };
  }

  /**
   * 获取指定期数的还款日期（使用moment优化）
   * @param monthIndex 期数索引
   * @returns 格式化的还款日期字符串（YYYY年MM月）
   */
  handleGetRepaymentDate(monthIndex: number): string {
    if (!this.basicInfo.startDate) return '';

    const startMoment = moment(this.basicInfo.startDate, 'YYYY-MM');
    const repaymentMoment = startMoment.clone().add(monthIndex - 1, 'months');

    return `${repaymentMoment.year()}年${repaymentMoment.month() + 1}月`;
  }

  /**
   * 计算浮动利率总利息（按日期）
   * @returns 浮动利率总利息金额
   */
  handleCalculateFloatingInterest(): number {
    let totalInterest = 0;
    let remainingPrincipal = this.basicInfo.loanAmount; // 剩余本金
    // TODO 扩展等额本息情况
    const monthlyPrincipal = this.basicInfo.loanAmount / this.calculatedTotalMonths; // 每月应还本金

    // 对利率期间按开始日期排序并转换为期数
    const sortedRates = [...this.rateList]
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

  /**
   * 计算多次提前还款的影响
   * 处理提前还款对贷款期限、月供金额和利息支出的影响
   */
  handleCalculatePrepayments(): void {
    // 过滤有效且按时间排序的提前还款记录
    const validPrepaymentList = this.prepaymentList
        .filter(p => p.amount > 0 && p.period > 0)
        .sort((a, b) => a.period - b.period);

    this.prepaymentDetails = [];
    this.totalSaveInterest = 0;

    // 初始化变量
    let currentPrincipal = this.basicInfo.loanAmount;
    let currentMonths = this.calculatedTotalMonths;
    let currentMonth = 1;
    let totalSaveInterest = 0;
    let finalEndDate = this.handleGetEndDate(this.startYear, this.startMonth, currentMonths);
    let finalTotalMonths = currentMonths; // 初始化最终期数
    let actualRepaymentSchedule: any[] = []; // 实际还款计划数组

    // 遍历每个有效的提前还款记录
    for (const prepayment of validPrepaymentList) {
      if (prepayment.period <= currentMonth) continue; // 跳过已经处理过的期间

      // 已还本金
      const monthlyPrincipal = currentPrincipal / currentMonths;
      const monthsBeforePrepayment = prepayment.period - currentMonth;
      const paidPrincipal = monthlyPrincipal * monthsBeforePrepayment;

      // 使用当前时间对应的实际年利率
      const annualRate = this.handleGetCurrentAnnualRate(prepayment.date);
      // 截止提前还款日时已产生的利息
      const interestBeforePrepayment = this.handleCalculateInterest(
          currentPrincipal - paidPrincipal, annualRate, prepayment.date
      );

      const monthlyRate = annualRate / 100 / 12;
      // 生成提前还款前的还款计划
      const prepaymentSchedule = this.handleGenerateRepaymentScheduleForPeriod(
          currentPrincipal, monthlyRate, currentMonth, prepayment.period - 1
      );
      actualRepaymentSchedule = actualRepaymentSchedule.concat(prepaymentSchedule);

      // 提前还款后的剩余本金
      const remainingAfterPrepayment = currentPrincipal - paidPrincipal - prepayment.amount;

      if (remainingAfterPrepayment <= 0) {
        // 如果提前还款后剩余本金为0或负数，贷款已还清
        const saveInterest = this.handleCalculateRemainingInterest(currentPrincipal, monthlyRate, currentMonths) - interestBeforePrepayment;
        totalSaveInterest += saveInterest;

        // 添加提前还款这一期的记录
        actualRepaymentSchedule.push({
          month: prepayment.period,
          date: this.handleGetRepaymentDate(prepayment.period),
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

        // 添加提前还款详情
        this.prepaymentDetails.push({
          index: this.prepaymentDetails.length + 1,
          amount: this.handleFormatCurrency(prepayment.amount),
          month: prepayment.period,
          type: prepayment.type === 'shorten' ? '缩短期限' : '减少月供',
          saveInterest: this.handleFormatCurrency(saveInterest),
          remainingMonths: '贷款已还清',
          newEndDate: '贷款已还清'
        });

        finalEndDate = this.handleGetRepaymentDate(prepayment.period);
        finalTotalMonths = prepayment.period; // 最终期数就是提前还款的期数
        break;
      }

      // 根据提前还款类型计算新的还款计划
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
        month: prepayment.period,
        date: this.handleGetRepaymentDate(prepayment.period),
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

      // 更新状态变量
      totalSaveInterest += saveInterest;
      currentPrincipal = remainingAfterPrepayment;
      currentMonths = newMonths;
      currentMonth = prepayment.period;
      finalTotalMonths = prepayment.period + newMonths; // 更新最终期数

      // 添加提前还款详情
      this.prepaymentDetails.push({
        index: this.prepaymentDetails.length + 1,
        amount: this.handleFormatCurrency(prepayment.amount),
        month: prepayment.period,
        type: prepayment.type === 'shorten' ? '缩短期限' : '减少月供',
        saveInterest: this.handleFormatCurrency(saveInterest),
        remainingMonths: newMonths,
        newEndDate: this.handleGetEndDate(this.startYear, this.startMonth, prepayment.period + newMonths)
      });

      finalEndDate = this.handleGetEndDate(this.startYear, this.startMonth, prepayment.period + newMonths);
    }

    // 生成剩余期的还款计划
    if (currentPrincipal > 0) {
      // 使用当前时间对应的实际年利率
      const annualRate = this.handleGetCurrentAnnualRate();
      const remainingSchedule = this.handleGenerateRepaymentScheduleForPeriod(
          currentPrincipal, annualRate / 100 / 12, currentMonth, finalTotalMonths
      );
      actualRepaymentSchedule = actualRepaymentSchedule.concat(remainingSchedule);
    }

    // 更新计算结果
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
    const monthlyPrincipal = this.basicInfo.loanAmount / totalLoanMonths;

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
    if (!dateStr || !this.basicInfo.startDate) return 1;

    const startMoment = moment(this.basicInfo.startDate, 'YYYY-MM');
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
  async handleCalculate(): Promise<void> {
    // 利率设置
    const validRates = this.rateList.filter(period => period.startDate && period.rate > 0);
    if (validRates.length === 0) {
      this.$message.error('请至少设置一个有效的浮动利率期间');
      return;
    }

    // 设置总期数和计算结束日期
    this.totalMonths = this.calculatedTotalMonths;
    this.handleCalculateEndDate();

    // 计算浮动利率总利息
    this.totalInterest = this.handleCalculateFloatingInterest();
    //
    // // 计算多次提前还款的影响
    // // this.handleCalculatePrepayments();
    //
    // console.log('this.actualRepaymentSchedule', this.actualRepaymentSchedule);
    // // 根据是否有提前还款选择显示哪种还款计划
    // const hasPrepayments = this.prepaymentList.some(p => p.amount > 0);
    // if (hasPrepayments && this.actualRepaymentSchedule.length > 0) {
    //   // 使用实际还款计划（包含提前还款）
    //   this.repaymentSchedule = this.actualRepaymentSchedule;
    // }
    //
    // // 重置分页状态
    // this.currentPage = 1;
    // this.searchTerm = '';
    //
    // // 显示计算结果
    // this.showResults = true;
  }

  /**
   * 重置所有表单数据和计算结果
   */
  handleReset(): void {
    console.log('handleReset');
  }
}
</script>

<style lang="scss" scoped>
.housing-fund {
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

    .basic-info {
      .el-form {
        width: 15%;

        .el-input,
        .el-select {
          width: 100%;
        }
      }
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
