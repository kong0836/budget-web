<template>
  <div class="housing-fund">
    <div class="calculator-container">
      <h3>公积金贷款利息计算器</h3>

      <!-- 基本信息输入 -->
      <div class="input-section">
        <div class="form-group">
          <label>贷款总额（元）</label>
          <el-input v-model="loanAmount"
type="number"
placeholder="请输入贷款总额"></el-input>
        </div>

        <div class="form-group">
          <label>贷款年限（年）</label>
          <el-input v-model="loanYears"
type="number"
placeholder="请输入贷款年限"></el-input>
        </div>

        <div class="form-group">
          <label>首次还款年份</label>
          <el-input v-model="startYear"
type="number"
placeholder="如：2024"></el-input>
        </div>

        <div class="form-group">
          <label>首次还款月份</label>
          <el-select v-model="startMonth" placeholder="请选择月份">
            <el-option v-for="month in 12"
:key="month"
:label="`${month}月`"
:value="month"></el-option>
          </el-select>
        </div>
      </div>

      <!-- 利率设置 -->
      <div class="rate-section">
        <h4>利率设置</h4>
        <el-radio-group v-model="rateType">
          <el-radio label="fixed">固定利率</el-radio>
          <el-radio label="floating">浮动利率</el-radio>
        </el-radio-group>

        <div v-if="rateType === 'fixed'" class="form-group">
          <label>年利率（%）</label>
          <el-input v-model="fixedRate"
type="number"
placeholder="如：3.25"></el-input>
        </div>

        <div v-if="rateType === 'floating'" class="floating-rates">
          <div class="rate-period"
v-for="(period, index) in floatingRates"
:key="index">
            <div class="form-group">
              <label>从第{{ period.startYear }}年{{ period.startMonth }}月开始</label>
              <el-input v-model="period.rate"
type="number"
placeholder="年利率%"></el-input>
            </div>
            <el-button v-if="floatingRates.length > 1"
@click="removeRatePeriod(index)"
type="danger"
size="small">删除</el-button>
          </div>
          <el-button @click="addRatePeriod"
type="primary"
size="small">添加利率期间</el-button>
        </div>
      </div>

      <!-- 多次提前还款设置 -->
      <div class="prepayment-section">
        <h4>提前还款设置（可选）</h4>
        <div class="prepayment-list">
          <div class="prepayment-item"
v-for="(prepayment, index) in prepayments"
:key="index">
            <div class="prepayment-header">
              <h5>第{{ index + 1 }}次提前还款</h5>
              <el-button v-if="prepayments.length > 1"
@click="removePrepayment(index)"
type="danger"
size="small">删除</el-button>
            </div>
            <div class="prepayment-form">
              <div class="form-group">
                <label>还款金额（元）</label>
                <el-input v-model="prepayment.amount"
type="number"
placeholder="请输入还款金额"></el-input>
              </div>
              <div class="form-group">
                <label>还款时间（还款后第几个月）</label>
                <el-input v-model="prepayment.month"
type="number"
placeholder="如：12"></el-input>
              </div>
              <div class="form-group">
                <label>还款方式</label>
                <el-radio-group v-model="prepayment.type">
                  <el-radio label="shorten">缩短还款期限</el-radio>
                  <el-radio label="reduce">减少月供金额</el-radio>
                </el-radio-group>
              </div>
            </div>
          </div>
          <el-button @click="addPrepayment"
type="primary"
size="small">添加提前还款</el-button>
        </div>
      </div>

      <!-- 计算按钮 -->
      <div class="action-section">
        <el-button @click="calculate"
type="primary"
size="large">计算</el-button>
        <el-button @click="reset"
type="default"
size="large">重置</el-button>
      </div>

      <!-- 计算结果 -->
      <div v-if="showResults" class="results-section">
        <h4>计算结果</h4>

        <div class="basic-info">
          <p><strong>贷款总额：</strong>{{ formatCurrency(loanAmount) }}</p>
          <p><strong>贷款期限：</strong>{{ loanYears }}年（{{ totalMonths }}个月）</p>
          <p><strong>开始还款：</strong>{{ startYear }}年{{ startMonth }}月</p>
          <p><strong>结束还款：</strong>{{ endYear }}年{{ endMonth }}月</p>
        </div>

        <div class="interest-results">
          <h5>利息总额</h5>
          <p><strong>固定利率总利息：</strong>{{ formatCurrency(fixedTotalInterest) }}</p>
          <p><strong>浮动利率总利息：</strong>{{ formatCurrency(floatingTotalInterest) }}</p>
        </div>

        <div v-if="prepayments.some(p => p.amount > 0)" class="prepayment-results">
          <h5>提前还款分析</h5>
          <div class="prepayment-summary">
            <p><strong>提前还款总次数：</strong>{{ prepayments.filter(p => p.amount > 0).length }}次</p>
            <p><strong>提前还款总金额：</strong>{{ formatCurrency(prepaymentTotalAmount) }}</p>
            <p><strong>节省利息总额：</strong>{{ formatCurrency(totalSaveInterest) }}</p>
            <p><strong>最终还款期限：</strong>{{ finalEndYear }}年{{ finalEndMonth }}月</p>
          </div>

          <div class="prepayment-details">
            <h6>每次提前还款详情</h6>
            <el-table :data="prepaymentDetails"
border
style="width: 100%">
              <el-table-column prop="index"
label="序号"
width="60"></el-table-column>
              <el-table-column prop="amount"
label="还款金额"
width="120"></el-table-column>
              <el-table-column prop="month"
label="还款时间"
width="100"></el-table-column>
              <el-table-column prop="type"
label="还款方式"
width="120"></el-table-column>
              <el-table-column prop="saveInterest"
label="节省利息"
width="120"></el-table-column>
              <el-table-column prop="newEndDate"
label="新结束日期"
width="120"></el-table-column>
            </el-table>
          </div>
        </div>

        <div class="repayment-schedule">
          <h5>还款计划（前12个月）</h5>
          <el-table :data="repaymentSchedule.slice(0, 12)"
border
style="width: 100%">
            <el-table-column prop="month"
label="期数"
width="80"></el-table-column>
            <el-table-column prop="date"
label="还款日期"
width="120"></el-table-column>
            <el-table-column prop="principal"
label="本金"
width="120"></el-table-column>
            <el-table-column prop="interest"
label="利息"
width="120"></el-table-column>
            <el-table-column prop="total"
label="月供"
width="120"></el-table-column>
            <el-table-column prop="remaining"
label="剩余本金"
width="120"></el-table-column>
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class HousingFund extends Vue {
  // 基本参数
  loanAmount = 500000;

  loanYears = 20;

  startYear: number = new Date().getFullYear();

  startMonth: number = new Date().getMonth() + 1;

  // 利率类型
  rateType = 'fixed';

  fixedRate = 3.25;

  // 浮动利率设置
  floatingRates: Array<{startYear: number, startMonth: number, rate: number}> = [
    { startYear: 1, startMonth: 1, rate: 3.25 }
  ];

  // 多次提前还款设置
  prepayments: Array<{amount: number, month: number, type: string}> = [
    { amount: 0, month: 12, type: 'shorten' }
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

  // 计算总月数
  get calculatedTotalMonths(): number {
    return this.loanYears * 12;
  }

  // 计算结束日期
  calculateEndDate(): void {
    let endYear = this.startYear + Math.floor((this.startMonth + this.calculatedTotalMonths - 1) / 12);
    let endMonth = (this.startMonth + this.calculatedTotalMonths - 1) % 12 + 1;
    this.endYear = endYear;
    this.endMonth = endMonth;
  }

  // 添加利率期间
  addRatePeriod(): void {
    const lastPeriod = this.floatingRates[this.floatingRates.length - 1];
    const nextYear = lastPeriod.startYear + 1;
    this.floatingRates.push({
      startYear: nextYear,
      startMonth: 1,
      rate: 3.25
    });
  }

  // 删除利率期间
  removeRatePeriod(index: number): void {
    this.floatingRates.splice(index, 1);
  }

  // 添加提前还款
  addPrepayment(): void {
    const lastPrepayment = this.prepayments[this.prepayments.length - 1];
    const nextMonth = lastPrepayment.month + 12;
    this.prepayments.push({
      amount: 0,
      month: nextMonth,
      type: 'shorten'
    });
  }

  // 删除提前还款
  removePrepayment(index: number): void {
    this.prepayments.splice(index, 1);
  }

  // 等额本金计算
  calculateEqualPrincipal(loanAmount: number, annualRate: number, months: number): any {
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
        date: this.getRepaymentDate(i),
        principal: this.formatCurrency(monthlyPrincipal),
        interest: this.formatCurrency(monthlyInterest),
        total: this.formatCurrency(monthlyPayment),
        remaining: this.formatCurrency(Math.max(0, remainingPrincipal))
      });
    }

    return { totalInterest, schedule };
  }

  // 获取还款日期
  getRepaymentDate(monthIndex: number): string {
    const totalMonths = this.startMonth + monthIndex - 1;
    const year = this.startYear + Math.floor((totalMonths - 1) / 12);
    const month = (totalMonths - 1) % 12 + 1;
    return `${year}年${month}月`;
  }

  // 计算浮动利率总利息
  calculateFloatingInterest(): number {
    let totalInterest = 0;
    let remainingPrincipal = this.loanAmount;
    const monthlyPrincipal = this.loanAmount / this.calculatedTotalMonths;

    // 按利率期间计算
    for (let i = 0; i < this.floatingRates.length; i++) {
      const currentPeriod = this.floatingRates[i];
      const nextPeriod = this.floatingRates[i + 1];

      const startMonth = (currentPeriod.startYear - 1) * 12 + currentPeriod.startMonth;
      const endMonth = nextPeriod ?
        (nextPeriod.startYear - 1) * 12 + nextPeriod.startMonth - 1 :
        this.calculatedTotalMonths;

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
  calculateMultiplePrepayments(): void {
    const validPrepayments = this.prepayments
      .filter(p => p.amount > 0 && p.month > 0)
      .sort((a, b) => a.month - b.month);

    if (validPrepayments.length === 0) return;

    this.prepaymentTotalAmount = validPrepayments.reduce((sum, p) => sum + p.amount, 0);
    this.prepaymentDetails = [];
    this.totalSaveInterest = 0;

    let currentPrincipal = this.loanAmount;
    let currentMonths = this.calculatedTotalMonths;
    let currentMonth = 1;
    let totalSaveInterest = 0;
    let finalEndDate = this.getEndDate(this.startYear, this.startMonth, currentMonths);

    for (const prepayment of validPrepayments) {
      if (prepayment.month <= currentMonth) continue;

      // 计算到提前还款时的已还本金
      const monthlyPrincipal = currentPrincipal / currentMonths;
      const monthsBeforePrepayment = prepayment.month - currentMonth;
      const principalPaid = monthlyPrincipal * monthsBeforePrepayment;

      // 计算提前还款前的利息
      const monthlyRate = this.fixedRate / 100 / 12;
      const interestBeforePrepayment = this.calculateInterestForPeriod(
        currentPrincipal, monthlyRate, monthsBeforePrepayment
      );

      // 提前还款后的剩余本金
      const remainingAfterPrepayment = currentPrincipal - principalPaid - prepayment.amount;

      if (remainingAfterPrepayment <= 0) {
        // 如果提前还款后剩余本金为0或负数，贷款已还清
        const saveInterest = this.calculateRemainingInterest(currentPrincipal, monthlyRate, currentMonths) - interestBeforePrepayment;
        totalSaveInterest += saveInterest;

        this.prepaymentDetails.push({
          index: this.prepaymentDetails.length + 1,
          amount: this.formatCurrency(prepayment.amount),
          month: prepayment.month,
          type: prepayment.type === 'shorten' ? '缩短期限' : '减少月供',
          saveInterest: this.formatCurrency(saveInterest),
          newEndDate: '贷款已还清'
        });

        finalEndDate = this.getRepaymentDate(prepayment.month);
        break;
      }

      let newMonths = currentMonths - monthsBeforePrepayment;
      let saveInterest = 0;

      if (prepayment.type === 'shorten') {
        // 缩短期限方式：保持月供不变，缩短还款期限
        newMonths = Math.ceil(remainingAfterPrepayment / monthlyPrincipal);
        const originalInterest = this.calculateRemainingInterest(remainingAfterPrepayment, monthlyRate, currentMonths - monthsBeforePrepayment);
        const newInterest = this.calculateRemainingInterest(remainingAfterPrepayment, monthlyRate, newMonths);
        saveInterest = originalInterest - newInterest;
      } else {
        // 减少月供方式：保持期限不变，减少月供金额
        const originalInterest = this.calculateRemainingInterest(remainingAfterPrepayment, monthlyRate, currentMonths - monthsBeforePrepayment);
        const newMonthlyPrincipal = remainingAfterPrepayment / (currentMonths - monthsBeforePrepayment);
        const newInterest = this.calculateRemainingInterestWithNewPrincipal(remainingAfterPrepayment, monthlyRate, currentMonths - monthsBeforePrepayment, newMonthlyPrincipal);
        saveInterest = originalInterest - newInterest;
      }

      totalSaveInterest += saveInterest;
      currentPrincipal = remainingAfterPrepayment;
      currentMonths = newMonths;
      currentMonth = prepayment.month;

      this.prepaymentDetails.push({
        index: this.prepaymentDetails.length + 1,
        amount: this.formatCurrency(prepayment.amount),
        month: prepayment.month,
        type: prepayment.type === 'shorten' ? '缩短期限' : '减少月供',
        saveInterest: this.formatCurrency(saveInterest),
        newEndDate: this.getEndDate(this.startYear, this.startMonth, prepayment.month + newMonths)
      });

      finalEndDate = this.getEndDate(this.startYear, this.startMonth, prepayment.month + newMonths);
    }

    this.totalSaveInterest = totalSaveInterest;
    const finalDateParts = finalEndDate.split('年');
    this.finalEndYear = parseInt(finalDateParts[0]);
    this.finalEndMonth = parseInt(finalDateParts[1].replace('月', ''));
  }

  // 计算指定期间的利息
  calculateInterestForPeriod(principal: number, monthlyRate: number, months: number): number {
    let totalInterest = 0;
    let remainingPrincipal = principal;
    const monthlyPrincipal = principal / (this.calculatedTotalMonths - (this.calculatedTotalMonths - months));

    for (let i = 1; i <= months; i++) {
      const monthlyInterest = remainingPrincipal * monthlyRate;
      totalInterest += monthlyInterest;
      remainingPrincipal -= monthlyPrincipal;
    }

    return totalInterest;
  }

  // 计算剩余利息
  calculateRemainingInterest(principal: number, monthlyRate: number, months: number): number {
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
  calculateRemainingInterestWithNewPrincipal(principal: number, monthlyRate: number, months: number, newMonthlyPrincipal: number): number {
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
  getEndDate(startYear: number, startMonth: number, totalMonths: number): string {
    const endYear = startYear + Math.floor((startMonth + totalMonths - 1) / 12);
    const endMonth = (startMonth + totalMonths - 1) % 12 + 1;
    return `${endYear}年${endMonth}月`;
  }

  // 格式化货币
  formatCurrency(amount: number): string {
    return '¥' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  }

  // 主计算函数
  calculate(): void {
    if (!this.loanAmount || !this.loanYears || !this.startYear || !this.startMonth) {
      this.$message.error('请填写完整的贷款信息');
      return;
    }

    this.totalMonths = this.calculatedTotalMonths;
    this.calculateEndDate();

    // 计算固定利率总利息
    const fixedResult = this.calculateEqualPrincipal(this.loanAmount, this.fixedRate, this.totalMonths);
    this.fixedTotalInterest = fixedResult.totalInterest;
    this.repaymentSchedule = fixedResult.schedule;

    // 计算浮动利率总利息
    this.floatingTotalInterest = this.calculateFloatingInterest();

    // 计算多次提前还款
    this.calculateMultiplePrepayments();

    this.showResults = true;
  }

  // 重置
  reset(): void {
    this.loanAmount = 500000;
    this.loanYears = 20;
    this.startYear = new Date().getFullYear();
    this.startMonth = new Date().getMonth() + 1;
    this.fixedRate = 3.25;
    this.floatingRates = [{ startYear: 1, startMonth: 1, rate: 3.25 }];
    this.prepayments = [{ amount: 0, month: 12, type: 'shorten' }];
    this.showResults = false;
  }
}
</script>

<style lang="scss" scoped>
.housing-fund {
  height: 100%;
  padding: 20px;
  background-color: #f5f7fa;

  .calculator-container {
    max-width: 900px;
    margin: 0 auto;
    background: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    h3 {
      text-align: center;
      color: #409eff;
      margin-bottom: 30px;
    }

    .input-section, .rate-section, .prepayment-section {
      margin-bottom: 30px;

      h4 {
        color: #606266;
        margin-bottom: 15px;
      }

      .form-group {
        margin-bottom: 15px;

        label {
          display: block;
          margin-bottom: 5px;
          color: #606266;
          font-weight: 500;
        }
      }

      .floating-rates {
        .rate-period {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          margin-bottom: 10px;

          .form-group {
            flex: 1;
            margin-bottom: 0;
          }
        }
      }

      .prepayment-list {
        .prepayment-item {
          border: 1px solid #ebeef5;
          border-radius: 4px;
          padding: 15px;
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

          .prepayment-form {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;

            .form-group:last-child {
              grid-column: 1 / -1;
            }
          }
        }
      }
    }

    .action-section {
      text-align: center;
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
      }
    }
  }
}
</style>