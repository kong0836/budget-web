/**
 * 基本贷款信息接口定义
 */
export interface BasicForm {
    loanAmount: number; // 贷款总额（元）
    loanYears: number; // 贷款年限
    repaymentDate: string; // 每月还款日期
    startDate: string; // 首次还款日期
}
