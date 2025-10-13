<template>
  <div class="housing-fund">
    <div class="calculator-container">
      <h3>公积金贷款利息计算器</h3>

      <!-- 基本信息输入 -->
      <div class="input-section">
        <div class="form-group">
          <label>贷款总额（元）</label>
          <el-input v-model="loanAmount"
                    placeholder="请输入贷款总额"
                    type="number"></el-input>
        </div>

        <div class="form-group">
          <label>贷款年限（年）</label>
          <el-input v-model="loanYears"
                    placeholder="请输入贷款年限"
                    type="number"></el-input>
        </div>

        <div class="form-group">
          <label>首次还款年份</label>
          <el-input v-model="startYear"
                    placeholder="如：2024"
                    type="number"></el-input>
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
                    placeholder="如：3.25"
                    type="number"></el-input>
        </div>

        <div v-if="rateType === 'floating'" class="floating-rates">
          <div v-for="(period, index) in floatingRates"
               :key="index"
               class="rate-period">
            <div class="form-group">
              <label>开始期数</label>
              <el-input v-model="period.startMonth"
                        :max="calculatedTotalMonths"
                        :min="1"
                        placeholder="如：1"
                        type="number"></el-input>
            </div>
            <div class="form-group">
              <label>年利率（%）</label>
              <el-input v-model="period.rate"
                        placeholder="如：3.25"
                        type="number"></el-input>
            </div>
            <el-button v-if="floatingRates.length > 1"
                       size="small"
                       type="danger"
                       @click="removeRatePeriod(index)">删除
            </el-button>
          </div>
          <el-button size="small"
                     type="primary"
                     @click="addRatePeriod">添加利率期间
          </el-button>
          <p class="rate-tip">提示：可以设置多个利率期间，每个期间指定开始期数和对应的年利率</p>
        </div>
      </div>

      <!-- 多次提前还款设置 -->
      <div class="prepayment-section">
        <h4>提前还款设置（可选）</h4>
        <div class="prepayment-list">
          <div v-for="(prepayment, index) in prepayments"
               :key="index"
               class="prepayment-item">
            <div class="prepayment-header">
              <h5>第{{ index + 1 }}次提前还款</h5>
              <el-button v-if="prepayments.length > 1"
                         size="small"
                         type="danger"
                         @click="removePrepayment(index)">删除
              </el-button>
            </div>
            <div class="prepayment-form">
              <div class="form-group">
                <label>还款金额（元）</label>
                <el-input v-model="prepayment.amount"
                          placeholder="请输入还款金额"
                          type="number"></el-input>
              </div>
              <div class="form-group">
                <label>还款时间（还款后第几个月）</label>
                <el-input v-model="prepayment.month"
                          placeholder="如：12"
                          type="number"></el-input>
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
          <el-button size="small"
                     type="primary"
                     @click="addPrepayment">添加提前还款
          </el-button>
        </div>
      </div>

      <!-- 计算按钮 -->
      <div class="action-section">
        <el-button size="large"
                   type="primary"
                   @click="calculate">计算
        </el-button>
        <el-button size="large"
                   type="default"
                   @click="reset">重置
        </el-button>
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
              <el-table-column label="序号"
                               prop="index"
                               width="60"></el-table-column>
              <el-table-column label="还款金额"
                               prop="amount"
                               width="120"></el-table-column>
              <el-table-column label="还款时间"
                               prop="month"
                               width="100"></el-table-column>
              <el-table-column label="还款方式"
                               prop="type"
                               width="120"></el-table-column>
              <el-table-column label="节省利息"
                               prop="saveInterest"
                               width="120"></el-table-column>
              <el-table-column label="新结束日期"
                               prop="newEndDate"
                               width="120"></el-table-column>
            </el-table>
          </div>
        </div>

        <div class="repayment-schedule">
          <h5>完整还款计划</h5>
          <div class="schedule-controls">
            <el-input v-model="searchTerm"
                      clearable
                      placeholder="搜索期数或日期"
                      style="width: 200px; margin-right: 10px;"></el-input>
            <el-select v-model="pageSize"
                       placeholder="每页显示条数"
                       style="width: 120px;">
              <el-option :value="12" label="12条"></el-option>
              <el-option :value="24" label="24条"></el-option>
              <el-option :value="50" label="50条"></el-option>
              <el-option :value="100" label="100条"></el-option>
            </el-select>
          </div>

          <el-table :data="paginatedSchedule"
                    :default-sort="{prop: 'month', order: 'ascending'}"
                    border
                    style="width: 100%; margin-top: 15px;">
            <el-table-column label="期数"
                             prop="month"
                             sortable
                             width="80"></el-table-column>
            <el-table-column label="还款日期"
                             prop="date"
                             sortable
                             width="120"></el-table-column>
            <el-table-column label="本金"
                             prop="principal"
                             sortable
                             width="120"></el-table-column>
            <el-table-column label="利息"
                             prop="interest"
                             sortable
                             width="120"></el-table-column>
            <el-table-column label="月供"
                             prop="total"
                             sortable
                             width="120"></el-table-column>
            <el-table-column label="剩余本金"
                             prop="remaining"
                             sortable
                             width="120"></el-table-column>
            <el-table-column label="操作" width="100">
              <template slot-scope="scope">
                <el-button size="small"
                           type="text"
                           @click="viewDetail(scope.row)">详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-container">
            <el-pagination
                :current-page="currentPage"
                :page-size="pageSize"
                :page-sizes="[12, 24, 50, 100]"
                :total="filteredSchedule.length"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange">
            </el-pagination>
          </div>
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

  // 浮动利率设置（按期数）
  floatingRates: Array<{ startMonth: number, rate: number }> = [
    { startMonth: 1, rate: 3.25 }
  ];

  // 多次提前还款设置
  prepayments: Array<{ amount: number, month: number, type: string }> = [
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

  // 分页相关
  currentPage = 1;

  pageSize = 12;

  searchTerm = '';

  // 计算总月数
  get calculatedTotalMonths(): number {
    return this.loanYears * 12;
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
    const nextMonth = lastPeriod.startMonth + 12; // 默认间隔12个月
    this.floatingRates.push({
      startMonth: nextMonth,
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
        remaining: this.formatCurrency(Math.max(0, remainingPrincipal)),
        rawPrincipal: monthlyPrincipal,
        rawInterest: monthlyInterest,
        rawTotal: monthlyPayment,
        rawRemaining: Math.max(0, remainingPrincipal)
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

  // 计算浮动利率总利息（按期数）
  calculateFloatingInterest(): number {
    let totalInterest = 0;
    let remainingPrincipal = this.loanAmount;
    const monthlyPrincipal = this.loanAmount / this.calculatedTotalMonths;

    // 对利率期间按开始期数排序
    const sortedRates = [...this.floatingRates].sort((a, b) => a.startMonth - b.startMonth);

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

  handleSizeChange(val: number): void {
    this.pageSize = val;
    this.currentPage = 1;
  }

  handleCurrentChange(val: number): void {
    this.currentPage = val;
  }

  // 查看详情
  viewDetail(row: any): void {
    this.$message({
      message: `第${row.month}期详情：本金${row.principal}，利息${row.interest}，月供${row.total}，剩余本金${row.remaining}`,
      type: 'info'
    });
  }

  // 主计算函数
  calculate(): void {
    if (!this.loanAmount || !this.loanYears || !this.startYear || !this.startMonth) {
      this.$message.error('请填写完整的贷款信息');
      return;
    }

    // 验证浮动利率设置
    if (this.rateType === 'floating') {
      const validRates = this.floatingRates.filter(period => period.startMonth > 0 && period.rate > 0);
      if (validRates.length === 0) {
        this.$message.error('请至少设置一个有效的浮动利率期间');
        return;
      }
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

    // 重置分页
    this.currentPage = 1;
    this.searchTerm = '';

    this.showResults = true;
  }

  // 重置
  reset(): void {
    this.loanAmount = 500000;
    this.loanYears = 20;
    this.startYear = new Date().getFullYear();
    this.startMonth = new Date().getMonth() + 1;
    this.fixedRate = 3.25;
    this.floatingRates = [{ startMonth: 1, rate: 3.25 }];
    this.prepayments = [{ amount: 0, month: 12, type: 'shorten' }];
    this.showResults = false;
    this.currentPage = 1;
    this.pageSize = 12;
    this.searchTerm = '';
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
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 10px;
          align-items: end;
          margin-bottom: 15px;
          padding: 15px;
          border: 1px solid #ebeef5;
          border-radius: 4px;

          .form-group {
            margin-bottom: 0;
          }
        }

        .rate-tip {
          font-size: 12px;
          color: #909399;
          margin-top: 5px;
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

        .schedule-controls {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }

        .pagination-container {
          margin-top: 15px;
          text-align: center;
        }
      }
    }
  }
}
</style>
