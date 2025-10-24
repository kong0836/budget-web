/**
 * 基本贷款信息接口定义
 */
export interface BasicForm {
    loanAmount: number; // 贷款总额（元）
    loanYears: number; // 贷款年限
    repaymentDate: string; // 每月还款日期
    startDate: string; // 首次还款日期
}

/**
 * 提前还款信息接口定义
 */
export interface Prepayment {
    amount: number; // 还款金额
    repaymentDate: string; // 还款时间
    period: number; // 对应期数
    type: string; // 还款方式: 'shorten'(缩短期限)或'reduce'(减少月供)
}

/**
 * 利率列表项接口定义
 */
export interface RateInfo {
    startDate: string;
    endDate: string;
    rate: number;
}
