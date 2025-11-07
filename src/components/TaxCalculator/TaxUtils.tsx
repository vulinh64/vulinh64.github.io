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

// Tax calculation function
export const calculateVietnamTax = (
    baseSalary: number,
    grossSalary: number,
    numberOfDependants: number,
    isProbation: boolean = false,
    probationPercentage: number = 100,
    isNewTaxPeriod: boolean = true
): TaxCalculationResult => {
    // Validation: Check if baseSalary meets minimum requirement
    if (baseSalary < MINIMUM_BASIC_SALARY) {
        throw new Error(`Base salary must be at least ${MINIMUM_BASIC_SALARY.toLocaleString()} VND`);
    }

    // Validation: Check probation percentage range
    if (probationPercentage < MINIMUM_PROBATION_PERCENTAGE || probationPercentage > MAXIMUM_PROBATION_PERCENTAGE) {
        throw new Error(`Probation percentage must be between ${MINIMUM_PROBATION_PERCENTAGE}% and ${MAXIMUM_PROBATION_PERCENTAGE}%`);
    }

    // Cap basic salary at MAXIMUM_BASIC_SALARY for calculations
    const cappedBaseSalary: number = Math.min(baseSalary, MAXIMUM_BASIC_SALARY);

    if (isProbation) {
        const probationSalary: number = grossSalary * (probationPercentage / 100);

        // @ts-ignore
        const taxedAmount: number = probationSalary < NON_TAXABLE_INCOME_DEDUCTION[isNewTaxPeriod]
            ? 0
            : Math.round(probationSalary * PROBATION_TAX_RATE);
        const netSalary: number = probationSalary - taxedAmount;

        return {
            insuranceAmount: 0,
            taxedAmount,
            netSalary: Math.round(netSalary),
            isProbation: true,
            probationSalary: Math.round(probationSalary),
            cappedBaseSalary: Math.round(cappedBaseSalary),
        };
    }

    const socialInsurance: number = cappedBaseSalary * INSURANCE_RATES.social;
    const healthInsurance: number = cappedBaseSalary * INSURANCE_RATES.health;
    const unemploymentInsurance: number = cappedBaseSalary * INSURANCE_RATES.unemployment;
    const insuranceAmount: number =
        socialInsurance + healthInsurance + unemploymentInsurance;

    const pretaxSalary: number = grossSalary - insuranceAmount;

    // @ts-ignore
    const dependantDeduction: number = numberOfDependants * DEDUCTION_PER_DEPENDANT[isNewTaxPeriod];

    // @ts-ignore
    let taxableIncome: number = pretaxSalary - NON_TAXABLE_INCOME_DEDUCTION[isNewTaxPeriod] - dependantDeduction;

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
        insuranceAmount: Math.round(insuranceAmount),
        taxedAmount: Math.round(taxAmount),
        netSalary: Math.round(netSalary),
        isProbation: false,
        cappedBaseSalary: Math.round(cappedBaseSalary),
    };
};