import React, { useState, useEffect, ChangeEvent } from "react";
import clsx from "clsx";
import styles from "./styles.module.css";
import Link from "@docusaurus/Link";
import { calculateVietnamTax, TaxCalculationResult } from "./TaxUtils";

interface FormData {
  basicSalary: string;
  grossSalary: string;
  dependants: number;
  onProbation: boolean;
  probationPercentage: string;
}

interface Errors {
  [key: string]: string;
}

interface Warnings {
  [key: string]: string;
}

export default function TaxCalculator(): JSX.Element {
  const [formData, setFormData] = useState<FormData>({
    basicSalary: "",
    grossSalary: "",
    dependants: 0,
    onProbation: false,
    probationPercentage: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [warnings, setWarnings] = useState<Warnings>({});
  const [result, setResult] = useState<TaxCalculationResult | null>(null);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement>
  ): void => {
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

  const validateForm = (): boolean => {
    const newErrors: Errors = {};
    const newWarnings: Warnings = {};

    if (
      !formData.basicSalary ||
      isNaN(Number(formData.basicSalary)) ||
      formData.basicSalary === ""
    ) {
      newErrors.basicSalary = "Hãy nhập số hợp lệ";
    } else if (parseFloat(formData.basicSalary) < 3450000) {
      newErrors.basicSalary = `Lương đóng BHXH không được thấp hơn ${3450000..toLocaleString()}`;
    } else if (parseFloat(formData.basicSalary) > 46800000) {
      newWarnings.basicSalary = `Mức lương đóng BH tối đa là ${46800000..toLocaleString()} VNĐ`;
    }

    if (
      !formData.grossSalary ||
      isNaN(Number(formData.grossSalary)) ||
      formData.grossSalary === ""
    ) {
      newErrors.grossSalary = "Hãy nhập số hợp lệ";
    } else if (
      parseFloat(formData.grossSalary) < parseFloat(formData.basicSalary || "0")
    ) {
      newErrors.grossSalary =
        "Tổng thu nhập trước thuế phải lớn hơn lương đóng BH";
    }

    if (formData.dependants && parseInt(String(formData.dependants)) < 0) {
      newErrors.dependants = "Số người phụ thuộc không được nhỏ hơn 0";
    }

    if (formData.onProbation) {
      if (
        !formData.probationPercentage ||
        isNaN(Number(formData.probationPercentage)) ||
        formData.probationPercentage === ""
      ) {
        newErrors.probationPercentage = "Hãy nhập số hợp lệ";
      } else {
        const percentage = parseFloat(formData.probationPercentage);
        if (
          percentage < 85 ||
          percentage > 100
        ) {
          newErrors.probationPercentage = `Mức % lương thử việc là từ 85% đến 100%`;
        }
      }
    }

    setErrors(newErrors);
    setWarnings(newWarnings);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    if (validateForm()) {
      const result = calculateVietnamTax(
        parseFloat(formData.basicSalary),
        parseFloat(formData.grossSalary),
        parseInt(String(formData.dependants)) || 0,
        formData.onProbation,
        formData.onProbation ? parseFloat(formData.probationPercentage) : 100
      );
      setResult(result);
    }
  };

  return (
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
                {formData.grossSalary && !isNaN(Number(formData.grossSalary))
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

        <hr className={styles.hr} />

        <Link to='/vietnam-tax-calculation'><i>Tham khảo cách tính thuế TNCN tại đây</i></Link>
      </form>
    </div>
  );
}