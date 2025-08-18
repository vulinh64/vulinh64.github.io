import React, { useState, useEffect } from "react";
import Layout from "@theme/Layout";
import clsx from "clsx";
import styles from "./tax-calculator.styles.module.css";

// Constants for tax calculation
const INSURANCE_RATES = {
  social: 0.08,
  health: 0.015,
  unemployment: 0.01,
};

const NON_TAXABLE_INCOME_DEDUCTION = 11000000;
const DEDUCTION_PER_DEPENDANT = 4400000;
const PROBATION_TAX_RATE = 0.1;
const MINIMUM_BASIC_SALARY = 3450000;
const MAXIMUM_BASIC_SALARY = 46800000;
const MINIMUM_PROBATION_PERCENTAGE = 85;
const MAXIMUM_PROBATION_PERCENTAGE = 100;

const TAX_LEVELS = [
    { threshold: 0, rate: 0.0 },
    { threshold: 5_000_000, rate: 0.05 },
    { threshold: 10_000_000, rate: 0.10 },
    { threshold: 18_000_000, rate: 0.15 },
    { threshold: 32_000_000, rate: 0.20 },
    { threshold: 52_000_000, rate: 0.25 },
    { threshold: 80_000_000, rate: 0.30 },
    { threshold: Number.MAX_VALUE, rate: 0.35 }
];

export default function TaxCalculator() {
  const [formData, setFormData] = useState({
    basicSalary: "",
    grossSalary: "",
    dependants: 0,
    onProbation: false,
    probationPercentage: "",
  });
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const [result, setResult] = useState(null);

  const calculateVietnamTax = (
    baseSalary,
    grossSalary,
    numberOfDependants,
    isProbation = false,
    probationPercentage = 100
  ) => {
    // Cap basic salary at MAXIMUM_BASIC_SALARY for calculations
    const cappedBaseSalary = Math.min(baseSalary, MAXIMUM_BASIC_SALARY);

    if (isProbation) {
      const probationSalary = grossSalary * (probationPercentage / 100);
      const taxedAmount = Math.round(probationSalary * PROBATION_TAX_RATE);
      const netSalary = probationSalary - taxedAmount;

      return {
        insuranceAmount: 0,
        taxedAmount: taxedAmount,
        netSalary: Math.round(netSalary),
        isProbation: true,
        probationSalary: Math.round(probationSalary),
        cappedBaseSalary: Math.round(cappedBaseSalary),
      };
    }

    const socialInsurance = cappedBaseSalary * INSURANCE_RATES.social;
    const healthInsurance = cappedBaseSalary * INSURANCE_RATES.health;
    const unemploymentInsurance = cappedBaseSalary * INSURANCE_RATES.unemployment;
    const insuranceAmount =
      socialInsurance + healthInsurance + unemploymentInsurance;

    const pretaxSalary = grossSalary - insuranceAmount;
    const dependantDeduction = numberOfDependants * DEDUCTION_PER_DEPENDANT;

    let taxableIncome =
      pretaxSalary - NON_TAXABLE_INCOME_DEDUCTION - dependantDeduction;

    if (taxableIncome < 0) {
      taxableIncome = 0;
    }

    let taxAmount = 0;
    let taxLevelOrdinal = 0;

    while (taxLevelOrdinal < TAX_LEVELS.length - 1) {
      const currentLevel = TAX_LEVELS[taxLevelOrdinal];
      const nextLevel = TAX_LEVELS[taxLevelOrdinal + 1];
      const deltaToNextLevel = taxableIncome - currentLevel.threshold;

      if (deltaToNextLevel <= 0) {
        break;
      }

      const delta =
        taxableIncome < nextLevel.threshold
          ? deltaToNextLevel
          : nextLevel.threshold - currentLevel.threshold;

      if (delta > 0) {
        taxAmount += delta * nextLevel.rate;
      }

      taxLevelOrdinal++;
    }

    const netSalary = grossSalary - insuranceAmount - taxAmount;

    return {
      insuranceAmount: Math.round(insuranceAmount),
      taxedAmount: Math.round(taxAmount),
      netSalary: Math.round(netSalary),
      isProbation: false,
      cappedBaseSalary: Math.round(cappedBaseSalary),
    };
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (warnings[name]) {
      setWarnings((prev) => ({ ...prev, [name]: "" }));
    }
  };

  useEffect(() => {
    setResult(null);
  }, [formData.onProbation]);

  const validateForm = () => {
    const newErrors = {};
    const newWarnings = {};

    if (
      !formData.basicSalary ||
      isNaN(formData.basicSalary) ||
      formData.basicSalary === ""
    ) {
      newErrors.basicSalary = "Hãy nhập số hợp lệ";
    } else if (parseFloat(formData.basicSalary) < MINIMUM_BASIC_SALARY) {
      newErrors.basicSalary = `Lương đóng BHXH không được thấp hơn ${MINIMUM_BASIC_SALARY.toLocaleString()}`;
    } else if (parseFloat(formData.basicSalary) > MAXIMUM_BASIC_SALARY) {
      newWarnings.basicSalary = `Mức lương đóng BH tối đa là ${MAXIMUM_BASIC_SALARY.toLocaleString()} VNĐ`;
    }

    if (
      !formData.grossSalary ||
      isNaN(formData.grossSalary) ||
      formData.grossSalary === ""
    ) {
      newErrors.grossSalary = "Hãy nhập số hợp lệ";
    } else if (
      parseFloat(formData.grossSalary) < parseFloat(formData.basicSalary || 0)
    ) {
      newErrors.grossSalary =
        "Tổng thu nhập trước thuế phải lớn hơn lương đóng BH";
    }

    if (formData.dependants && parseInt(formData.dependants) < 0) {
      newErrors.dependants = "Số người phụ thuộc không được nhỏ hơn 0";
    }

    if (formData.onProbation) {
      if (
        !formData.probationPercentage ||
        isNaN(formData.probationPercentage) ||
        formData.probationPercentage === ""
      ) {
        newErrors.probationPercentage = "Hãy nhập số hợp lệ";
      } else {
        const percentage = parseFloat(formData.probationPercentage);
        if (
          percentage < MINIMUM_PROBATION_PERCENTAGE ||
          percentage > MAXIMUM_PROBATION_PERCENTAGE
        ) {
          newErrors.probationPercentage = `Mức % lương thử việc là từ ${MINIMUM_PROBATION_PERCENTAGE}% đến ${MAXIMUM_PROBATION_PERCENTAGE}%`;
        }
      }
    }

    setErrors(newErrors);
    setWarnings(newWarnings);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      const result = calculateVietnamTax(
        parseFloat(formData.basicSalary),
        parseFloat(formData.grossSalary),
        parseInt(formData.dependants) || 0,
        formData.onProbation,
        formData.onProbation ? parseFloat(formData.probationPercentage) : 100
      );
      setResult(result);
    }
  };

  return (
    <Layout title="Tính thuế TNCN" description="Tính thuế TNCN">
      <div className={styles.container}>
        <h1 className={styles.textCenter}>Tính thuế TNCN</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Mức lương đóng BH</label>
            <input
              type="number"
              name="basicSalary"
              value={formData.basicSalary}
              onChange={handleInputChange}
              className={clsx(
                styles.input,
                errors.basicSalary && styles.borderRed,
                warnings.basicSalary && styles.borderYellow
              )}
            />
            {errors.basicSalary && (
              <p className={styles.error}>{errors.basicSalary}</p>
            )}
            {warnings.basicSalary && (
              <p className={styles.warning}>{warnings.basicSalary}</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Tổng thu nhập trước thuế</label>
            <input
              type="number"
              name="grossSalary"
              value={formData.grossSalary}
              onChange={handleInputChange}
              className={clsx(
                styles.input,
                errors.grossSalary && styles.borderRed
              )}
            />
            {errors.grossSalary && (
              <p className={styles.error}>{errors.grossSalary}</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Số người phụ thuộc</label>
            <input
              type="number"
              name="dependants"
              value={formData.dependants}
              onChange={handleInputChange}
              className={clsx(
                styles.input,
                errors.dependants && styles.borderRed
              )}
            />
            {errors.dependants && (
              <p className={styles.error}>{errors.dependants}</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="onProbation"
                checked={formData.onProbation}
                onChange={handleInputChange}
                className={styles.checkbox}
              />
              Đang thử việc
            </label>
          </div>

          {formData.onProbation && (
            <div className={styles.formGroup}>
              <label className={styles.label}>% mức lương cơ bản (85-100)</label>
              <input
                type="number"
                name="probationPercentage"
                value={formData.probationPercentage}
                onChange={handleInputChange}
                className={clsx(
                  styles.input,
                  errors.probationPercentage && styles.borderRed
                )}
              />
              {errors.probationPercentage && (
                <p className={styles.error}>{errors.probationPercentage}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            className="button button--outline button--primary button--lg button--block"
          >
            Tính thuế TNCN
          </button>

          {result && (
            <details className={styles.details} open>
              <summary className={styles.summary}>Kết quả</summary>
              <div className={styles.resultItem}>
                <span>Lương đóng BH:</span>
                <span className={styles.resultValue}>
                  {result.cappedBaseSalary && !isNaN(result.cappedBaseSalary)
                    ? `${Number(result.cappedBaseSalary).toLocaleString()} đ`
                    : "N/A"}
                </span>
              </div>
              <div className={styles.resultItem}>
                <span>Lương trước thuế:</span>
                <span className={styles.resultValue}>
                  {formData.grossSalary && !isNaN(formData.grossSalary)
                    ? `${Number(formData.grossSalary).toLocaleString()} đ`
                    : "N/A"}
                </span>
              </div>
              <div className={styles.resultItem}>
                <span>Số người phụ thuộc:</span>
                <span className={styles.resultValue}>
                  {Number(formData.dependants).toLocaleString()}
                </span>
              </div>
              {formData.onProbation && result.probationSalary !== undefined && (
                <div className={styles.resultItem}>
                  <span>Lương thử việc:</span>
                  <span className={styles.resultValue}>
                    {`${result.probationSalary.toLocaleString()} đ`}
                  </span>
                </div>
              )}
              <hr className={styles.hr} />
              <div className={styles.resultItem}>
                <span>Tổng đóng BH:</span>
                <span className={styles.resultValue}>
                  {result.insuranceAmount !== undefined
                    ? `${result.insuranceAmount.toLocaleString()} đ`
                    : "N/A"}
                </span>
              </div>
              <div className={styles.resultItem}>
                <span>Thuế phải nộp:</span>
                <span className={styles.resultValue}>
                  {result.taxedAmount !== undefined
                    ? `${result.taxedAmount.toLocaleString()} đ`
                    : "N/A"}
                </span>
              </div>
              <div className={styles.resultItem}>
                <span>Thực lãnh:</span>
                <span className={styles.netSalary}>
                  {result.netSalary !== undefined
                    ? `${result.netSalary.toLocaleString()} đ`
                    : "N/A"}
                </span>
              </div>
            </details>
          )}
        </form>
      </div>
    </Layout>
  );
}