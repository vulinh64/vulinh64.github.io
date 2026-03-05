import {
    DEDUCTION_PER_DEPENDANT,
    INSURANCE_RATES,
    MAXIMUM_BASIC_SALARY,
    MAXIMUM_PROBATION_PERCENTAGE,
    MINIMUM_BASIC_SALARY,
    MINIMUM_PROBATION_PERCENTAGE,
    NON_TAXABLE_INCOME_DEDUCTION,
    PROBATION_TAX_RATE,
    TAX_LEVELS,
    TaxCalculationResult,
    TaxLevel
} from "./TaxSupport";

// Validation helper functions
export const validateRequiredNumber = (
    value: any,
    errorMessage: string = "Hãy nhập số hợp lệ"
): string | null => {
    return value !== "" && value !== null && value !== undefined && !isNaN(Number(value))
        ? null :
        errorMessage;
};

export const validateRange = (
    value: number,
    min?: number,
    max?: number,
    minMessage?: string,
    maxMessage?: string
): { error?: string; warning?: string } => {
    const result: { error?: string; warning?: string } = {};

    if (min !== undefined && value < min && minMessage) {
        result.error = minMessage;
    }
    if (max !== undefined && value > max && maxMessage) {
        result.warning = maxMessage;
    }

    return result;
};

export const validateNonNegative = (value: any): string | null => {
    const numValue = parseFloat(String(value));
    if (!isNaN(numValue) && numValue < 0) {
        return "Hãy nhập số hợp lệ";
    }
    return null;
};

export const normalizeNumber = (value: any, defaultValue: number = 0, parser: (v: string) => number = parseFloat): number => {
    const parsed = parser(String(value));
    return isNaN(parsed) ? defaultValue : Math.max(0, parsed);
};

// Tax calculation function
export const calculateVietnamTax = (
    baseSalary: number,
    grossSalary: number,
    numberOfDependants: number,
    isProbation: boolean = false,
    probationPercentage: number = 100,
    isNewTaxPeriod: boolean = true,
    otherDeduction: number = 0): TaxCalculationResult => {
    // Validation: Check if baseSalary meets minimum requirement
    if (baseSalary < MINIMUM_BASIC_SALARY) {
        throw new Error(`Base salary must be at least ${MINIMUM_BASIC_SALARY.toLocaleString()} VND`);
    }

    // Cap basic salary at MAXIMUM_BASIC_SALARY for calculations
    const cappedBaseSalary: number = Math.min(baseSalary, MAXIMUM_BASIC_SALARY);

    if (grossSalary < cappedBaseSalary) {
        throw new Error(`Gross salary must not be smaller than base salary of ${cappedBaseSalary} VND`);
    }

    // Validation: Check probation percentage range
    if (probationPercentage < MINIMUM_PROBATION_PERCENTAGE || probationPercentage > MAXIMUM_PROBATION_PERCENTAGE) {
        throw new Error(`Probation percentage must be between ${MINIMUM_PROBATION_PERCENTAGE}% and ${MAXIMUM_PROBATION_PERCENTAGE}%`);
    }

    if (isProbation) {
        const probationSalary: number = grossSalary * (probationPercentage / 100);

        // @ts-ignore
        const taxedAmount: number = probationSalary < NON_TAXABLE_INCOME_DEDUCTION[isNewTaxPeriod]
            ? 0
            : probationSalary * PROBATION_TAX_RATE;

        const netSalary: number = probationSalary - taxedAmount;

        return {
            insuranceAmount: 0,
            taxedAmount: taxedAmount,
            netSalary: netSalary,
            isProbation: true,
            probationSalary: probationSalary,
            cappedBaseSalary: cappedBaseSalary,
        };
    }

    const insuranceAmount: number = cappedBaseSalary * (INSURANCE_RATES.social + INSURANCE_RATES.health + INSURANCE_RATES.unemployment);

    // @ts-ignore
    const dependantDeduction: number = numberOfDependants * DEDUCTION_PER_DEPENDANT[isNewTaxPeriod];

    let taxableIncome: number = grossSalary
        - insuranceAmount
        // @ts-ignore
        - NON_TAXABLE_INCOME_DEDUCTION[isNewTaxPeriod]
        - dependantDeduction
        - otherDeduction;

    if (taxableIncome < 0) {
        taxableIncome = 0;
    }

    let taxAmount: number = 0;
    let taxLevelOrdinal: number = 0;

    // @ts-ignore
    const progressiveTax = TAX_LEVELS[isNewTaxPeriod];

    while (taxLevelOrdinal < progressiveTax.length - 1) {
        const currentLevel: TaxLevel = progressiveTax[taxLevelOrdinal];
        const nextLevel: TaxLevel = progressiveTax[taxLevelOrdinal + 1];
        const deltaToNextLevel: number = taxableIncome - currentLevel.threshold;

        if (deltaToNextLevel <= 0) {
            break;
        }

        const delta: number =
            taxableIncome < nextLevel.threshold
                ? deltaToNextLevel
                : nextLevel.threshold - currentLevel.threshold;

        if (delta > 0) {
            taxAmount += delta * nextLevel.rate;
        }

        taxLevelOrdinal++;
    }

    const netSalary: number = grossSalary - insuranceAmount - taxAmount;

    return {
        insuranceAmount: insuranceAmount,
        taxedAmount: taxAmount,
        netSalary: netSalary,
        isProbation: false,
        cappedBaseSalary: cappedBaseSalary,
    };
};