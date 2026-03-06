interface InsuranceRates {
    social: number;
    health: number;
    unemployment: number;
}

export interface TaxLevel {
    threshold: number;
    rate: number;
}

interface ProbationDetails {
    probationPercentage: number;
    probationSalary: number;
}

interface NonProbationDetails {
    insuranceAmount: number;
}

export type TaxCalculationResult = {
    cappedBaseSalary: number;
    grossSalary: number;
    dependants: number;
    netSalary: number;
    taxedAmount: number;
} & (
    | {
          isProbation: true;
          probation: ProbationDetails;
      }
    | {
          isProbation: false;
          nonProbation: NonProbationDetails;
      }
);

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

export const PROBATION_TAX_RATE = 0.1;
export const MINIMUM_BASIC_SALARY = 3700000;
export const MAXIMUM_BASIC_SALARY = 46800000;
export const MINIMUM_PROBATION_PERCENTAGE = 85;
export const MAXIMUM_PROBATION_PERCENTAGE = 100;
export const LOWEST_PROBATION_SALARY_TO_BE_TAXED = 2000000;

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
            rate: 0.10
        },
        {
            threshold: 60_000_000,
            rate: 0.20
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

export interface FormData {
    basicSalary: number;
    grossSalary: number;
    dependants: number;
    onProbation: boolean;
    probationPercentage: number;
    isNewTaxPeriod: boolean;
    otherDeduction: number;
}

export interface Errors {
    [key: string]: string;
}

export interface Warnings {
    [key: string]: string;
}