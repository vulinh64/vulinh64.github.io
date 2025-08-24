interface InsuranceRates {
  social: number;
  health: number;
  unemployment: number;
}

interface TaxLevel {
  threshold: number;
  rate: number;
}

interface TaxCalculationResult {
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

export const NON_TAXABLE_INCOME_DEDUCTION: number = 11000000;
export const DEDUCTION_PER_DEPENDANT: number = 4400000;
export const PROBATION_TAX_RATE: number = 0.1;
export const MINIMUM_BASIC_SALARY: number = 3450000;
export const MAXIMUM_BASIC_SALARY: number = 46800000;
export const MINIMUM_PROBATION_PERCENTAGE: number = 85;
export const MAXIMUM_PROBATION_PERCENTAGE: number = 100;

export const TAX_LEVELS: TaxLevel[] = [
  { threshold: 0, rate: 0.0 },
  { threshold: 5_000_000, rate: 0.05 },
  { threshold: 10_000_000, rate: 0.10 },
  { threshold: 18_000_000, rate: 0.15 },
  { threshold: 32_000_000, rate: 0.20 },
  { threshold: 52_000_000, rate: 0.25 },
  { threshold: 80_000_000, rate: 0.30 },
  { threshold: Number.MAX_VALUE, rate: 0.35 },
];

// Tax calculation function
export const calculateVietnamTax = (
  baseSalary: number,
  grossSalary: number,
  numberOfDependants: number,
  isProbation: boolean = false,
  probationPercentage: number = 100
): TaxCalculationResult => {
  // Cap basic salary at MAXIMUM_BASIC_SALARY for calculations
  const cappedBaseSalary: number = Math.min(baseSalary, MAXIMUM_BASIC_SALARY);

  if (isProbation) {
    const probationSalary: number = grossSalary * (probationPercentage / 100);
    const taxedAmount: number = probationSalary < 11000000.0
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
  const dependantDeduction: number = numberOfDependants * DEDUCTION_PER_DEPENDANT;

  let taxableIncome: number =
    pretaxSalary - NON_TAXABLE_INCOME_DEDUCTION - dependantDeduction;

  if (taxableIncome < 0) {
    taxableIncome = 0;
  }

  let taxAmount: number = 0;
  let taxLevelOrdinal: number = 0;

  while (taxLevelOrdinal < TAX_LEVELS.length - 1) {
    const currentLevel: TaxLevel = TAX_LEVELS[taxLevelOrdinal];
    const nextLevel: TaxLevel = TAX_LEVELS[taxLevelOrdinal + 1];
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