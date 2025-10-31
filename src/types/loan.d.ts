// 贷款基本信息
export interface BasicForm {
    loanAmount: number; // 贷款总额（元）
    loanYears: number; // 贷款年限
    repaymentDate: string; // 每月还款日期
    repaymentType: string; // 还款方式
    principal: number; // 等额本金还款额（元）
    interest: number; // 等额本息还款额（元）
    startDate: string; // 首次还款日期
    endDate: string; // 结束还款日期
}

// 提前还款信息
export interface PrepaymentInfo {
    amount: number; // 还款金额
    date: string; // 还款时间
    period: number; // 对应期数
    type: string; // 还款方式: 'shorten'(缩短期限)或'reduce'(减少月供)
}

// 利率信息
export interface RateInfo {
    startDate: string;
    endDate: string;
    rate: number;
}

// 还款计划信息
export interface RepaymentInfo {
    date: string; // 还款时间
    period: number; // 还款期数
    amount: number; // 还款金额（元）
    principal: number; // 本金还款额（元）
    interest: number; // 利息还款额（元）
    remainingPrincipal: number; // 剩余本金（元）
}
