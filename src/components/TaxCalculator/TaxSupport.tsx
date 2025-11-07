interface InsuranceRates {
    social: number;
    health: number;
    unemployment: number;
}

export interface TaxLevel {
    threshold: number;
    rate: number;
}

export interface TaxCalculationResult {
    insuranceAmount: number;
    taxedAmount: number;
    netSalary: number;
    isProbation: boolean;
    probationSalary?: number;
    cappedBaseSalary: number;
}

// Constants
export const INSURANCE_RATES: InsuranceRates = {
    social: 0.08,
    health: 0.015,
    unemployment: 0.01,
};

export const NON_TAXABLE_INCOME_DEDUCTION = {
    false: 11000000,
    true: 15500000,
};

export const DEDUCTION_PER_DEPENDANT = {
    false: 4400000,
    true: 6200000,
};

export const PROBATION_TAX_RATE: number = 0.1;
// TODO: update new value when the laws are finalized
export const MINIMUM_BASIC_SALARY: number = 3450000;

// TODO: update new value when the laws are finalized
export const MAXIMUM_BASIC_SALARY: number = 46800000;

export const MINIMUM_PROBATION_PERCENTAGE: number = 85;
export const MAXIMUM_PROBATION_PERCENTAGE: number = 100;
export const MIN_PROBATION_PERCENTAGE = 85;
export const MAX_PROBATION_PERCENTAGE = 100;

// @ts-ignore
export const TAX_LEVELS: Record<boolean, TaxLevel> = {
    false: [
        {
            threshold: 0,
            rate: 0.0
        },
        {
            threshold: 5_000_000,
            rate: 0.05
        },
        {
            threshold: 10_000_000,
            rate: 0.10
        },
        {
            threshold: 18_000_000,
            rate: 0.15
        },
        {
            threshold: 32_000_000,
            rate: 0.20
        },
        {
            threshold: 52_000_000,
            rate: 0.25
        },
        {
            threshold: 80_000_000,
            rate: 0.30
        },
        {
            threshold: Number.MAX_VALUE,
            rate: 0.35
        },
    ],
    true: [
        {
            threshold: 0,
            rate: 0.0
        },
        {
            threshold: 10_000_000,
            rate: 0.05
        },
        {
            threshold: 30_000_000,
            rate: 0.15
        },
        {
            threshold: 60_000_000,
            rate: 0.25
        },
        {
            threshold: 100_000_000,
            rate: 0.30
        },
        {
            threshold: Number.MAX_VALUE,
            rate: 0.35
        },
    ]
};