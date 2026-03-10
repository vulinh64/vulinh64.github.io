import {
    DEDUCTION_PER_DEPENDANT,
    EMPTY,
    FormData,
    INSURANCE_RATES,
    LOWEST_PROBATION_SALARY_TO_BE_TAXED,
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
    return value !== EMPTY && value !== null && value !== undefined && !isNaN(Number(value))
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
    // Validation: Check if baseSalary meets minimum requirement (skip for probation)
    if (!isProbation && baseSalary < MINIMUM_BASIC_SALARY) {
        throw new Error(`Base salary must be at least ${MINIMUM_BASIC_SALARY.toLocaleString()} VND`);
    }

    // Cap basic salary at MAXIMUM_BASIC_SALARY for calculations
    const cappedBaseSalary: number = Math.min(baseSalary, MAXIMUM_BASIC_SALARY);

    // Validation: Check if grossSalary >= cappedBaseSalary (skip for probation)
    if (!isProbation && grossSalary < cappedBaseSalary) {
        throw new Error(`Gross salary must not be smaller than base salary of ${cappedBaseSalary} VND`);
    }

    // Validation: Check probation percentage range
    if (probationPercentage < MINIMUM_PROBATION_PERCENTAGE || probationPercentage > MAXIMUM_PROBATION_PERCENTAGE) {
        throw new Error(`Probation percentage must be between ${MINIMUM_PROBATION_PERCENTAGE}% and ${MAXIMUM_PROBATION_PERCENTAGE}%`);
    }

    if (isProbation) {
        const probationSalary: number = grossSalary * (probationPercentage / 100);

        const taxedAmount: number = probationSalary < LOWEST_PROBATION_SALARY_TO_BE_TAXED
            ? 0
            : probationSalary * PROBATION_TAX_RATE;

        const netSalary: number = probationSalary - taxedAmount;

        return {
            isProbation: true,
            probation: {
                probationPercentage: probationPercentage,
                probationSalary: probationSalary,
            },
            taxedAmount: taxedAmount,
            netSalary: netSalary,
            cappedBaseSalary: cappedBaseSalary,
            grossSalary: grossSalary,
            dependants: numberOfDependants,
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
        isProbation: false,
        nonProbation: {
            insuranceAmount: insuranceAmount,
        },
        taxedAmount: taxAmount,
        netSalary: netSalary,
        cappedBaseSalary: cappedBaseSalary,
        grossSalary: grossSalary,
        dependants: numberOfDependants,
    };
};

export function formatNumber(value: number | string, locale?: string): string {
    if (value === EMPTY || value === null || value === undefined) {
        return EMPTY;
    }
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) {
        return EMPTY;
    }
    return num.toLocaleString(locale);
}

export const parseFormattedNumber = (value: string): number => {
    if (!value) return 0;
    // Remove all non-digit characters except decimal separator
    const cleaned = value.replace(/[^\d]/g, EMPTY);
    return cleaned ? parseInt(cleaned, 10) : 0;
};

export const getInitialState = () => {
    const url = readUrlParams();
    const isVnLocale = url.isVnLocale ?? true;

    const formData: FormData = {
        basicSalary: url.basicSalary ?? 3700000,
        grossSalary: url.grossSalary ?? 15500000,
        dependants: url.dependants ?? 0,
        onProbation: url.onProbation ?? false,
        probationPercentage: url.probationPercentage ?? MINIMUM_PROBATION_PERCENTAGE,
        isNewTaxPeriod: url.isNewTaxPeriod ?? (new Date().getFullYear() >= 2026),
        otherDeduction: url.otherDeduction ?? 0,
    };

    return {formData, isVnLocale, hasUrlParams: Object.keys(url).length > 0};
};

const readUrlParams = (): {
    basicSalary?: number;
    grossSalary?: number;
    otherDeduction?: number;
    dependants?: number;
    onProbation?: boolean;
    isNewTaxPeriod?: boolean;
    probationPercentage?: number;
    isVnLocale?: boolean;
} => {
    if (typeof window === "undefined") return {};
    const params = new URLSearchParams(window.location.search);
    const result: { [key: string]: any } = {};

    if (params.has("grossSalary")) {
        const v = parseInt(params.get("grossSalary")!, 10);

        if (!isNaN(v) && v >= 0) {
            result.grossSalary = v;
        }
    }

    if (params.has("basicSalary")) {
        const v = parseInt(params.get("basicSalary")!, 10);

        if (!isNaN(v) && v >= 0) {
            result.basicSalary = v;
        }
    }

    if (params.has("otherDeduction")) {
        const v = parseInt(params.get("otherDeduction")!, 10);

        if (!isNaN(v) && v >= 0) {
            result.otherDeduction = v;
        }
    }

    if (params.has("dependants")) {
        const v = parseInt(params.get("dependants")!, 10);

        if (!isNaN(v) && v >= 0) {
            result.dependants = v;
        }
    }

    if (params.has("onProbation")) {
        result.onProbation = params.get("onProbation") === "true";
    }

    if (params.has("isPost2026")) {
        result.isNewTaxPeriod = params.get("isPost2026") === "true";
    }

    if (params.has("probationPercentage")) {
        const v = parseInt(params.get("probationPercentage")!, 10);

        if (!isNaN(v)) {
            result.probationPercentage = v;
        }
    }

    if (params.has("isVnLocale")) {
        result.isVnLocale = params.get("isVnLocale") !== "false";
    }

    return result;
};