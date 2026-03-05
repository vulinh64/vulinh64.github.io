import React, {ChangeEvent, JSX, useEffect, useState} from "react";
import clsx from "clsx";
import styles from "./TaxCalculator.module.css";
import Link from "@docusaurus/Link";
import {
    calculateVietnamTax,
    normalizeNumber,
    validateNonNegative,
    validateRange,
    validateRequiredNumber
} from "./TaxUtils";
import {
    MAXIMUM_BASIC_SALARY,
    MAXIMUM_PROBATION_PERCENTAGE,
    MINIMUM_BASIC_SALARY,
    MINIMUM_PROBATION_PERCENTAGE,
    TaxCalculationResult
} from "./TaxSupport";

interface FormData {
    basicSalary: number;
    grossSalary: number;
    dependants: number;
    onProbation: boolean;
    probationPercentage: number;
    isNewTaxPeriod: boolean;
    otherDeduction: number;
}

interface Errors {
    [key: string]: string;
}

interface Warnings {
    [key: string]: string;
}

function inputTopBottom() {
    return clsx(styles.input, "margin-bottom--xs", "margin-bottom--xs");
}

export default function TaxCalculator(): JSX.Element {
    const [formData, setFormData] = useState<FormData>({
        basicSalary: 0,
        grossSalary: 0,
        dependants: 0,
        onProbation: false,
        probationPercentage: MINIMUM_PROBATION_PERCENTAGE,
        isNewTaxPeriod: new Date().getFullYear() >= 2026,
        otherDeduction: 0
    });
    const [errors, setErrors] = useState<Errors>({});
    const [warnings, setWarnings] = useState<Warnings>({});
    const [result, setResult] = useState<TaxCalculationResult | null>(null);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const {name, value, type, checked} = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : type === "radio" ? value === "true" : value,
        }));

        if (errors[name]) {
            setErrors((prev) => ({...prev, [name]: ""}));
        }
        if (warnings[name]) {
            setWarnings((prev) => ({...prev, [name]: ""}));
        }
    };

    useEffect(() => {
        setResult(null);
    }, [formData.onProbation, formData.isNewTaxPeriod]);

    const validateForm = (): boolean => {
        const newErrors: Errors = {};
        const newWarnings: Warnings = {};

        const basicSalaryError = validateRequiredNumber(formData.basicSalary, "basicSalary");

        if (basicSalaryError) {
            newErrors.basicSalary = basicSalaryError;
        } else {
            const rangeValidation = validateRange(
                parseFloat(String(formData.basicSalary)),
                MINIMUM_BASIC_SALARY,
                MAXIMUM_BASIC_SALARY,
                `Lương đóng BHXH không được thấp hơn ${MINIMUM_BASIC_SALARY.toLocaleString()} VNĐ`,
                `Mức lương đóng BH tối đa là ${MAXIMUM_BASIC_SALARY.toLocaleString()} VNĐ`
            );
            if (rangeValidation.error) {
                newErrors.basicSalary = rangeValidation.error;
            }

            if (rangeValidation.warning) {
                newWarnings.basicSalary = rangeValidation.warning;
            }
        }

        const grossSalaryError = validateRequiredNumber(formData.grossSalary, "grossSalary");
        if (grossSalaryError) {
            newErrors.grossSalary = grossSalaryError;
        } else if (parseFloat(String(formData.grossSalary)) < parseFloat(String(formData.basicSalary))) {
            newErrors.grossSalary = "Tổng thu nhập trước thuế phải lớn hơn lương đóng BH";
        }

        const dependantsError = validateNonNegative(formData.dependants);

        if (dependantsError) {
            newErrors.dependants = "Số người phụ thuộc không được nhỏ hơn 0";
        }

        if (formData.onProbation) {
            const probationError = validateRequiredNumber(formData.probationPercentage, "probationPercentage");
            if (probationError) {
                newErrors.probationPercentage = probationError;
            } else {
                const percentage = parseInt(String(formData.probationPercentage));
                if (percentage < MINIMUM_PROBATION_PERCENTAGE || percentage > MAXIMUM_PROBATION_PERCENTAGE) {
                    newErrors.probationPercentage = `Mức % lương thử việc là từ ${MINIMUM_PROBATION_PERCENTAGE}% đến ${MAXIMUM_PROBATION_PERCENTAGE}%`;
                }
            }
        }

        const otherDeductionError = validateNonNegative(formData.otherDeduction);

        if (otherDeductionError) {
            newErrors.otherDeduction = otherDeductionError;
        }

        setErrors(newErrors);
        setWarnings(newWarnings);

        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
        e.preventDefault();

        if (validateForm()) {
            const result = calculateVietnamTax(
                parseFloat(String(formData.basicSalary)),
                parseFloat(String(formData.grossSalary)),
                normalizeNumber(formData.dependants, 0, parseInt),
                formData.onProbation,
                formData.onProbation ? parseFloat(String(formData.probationPercentage)) : MAXIMUM_PROBATION_PERCENTAGE,
                formData.isNewTaxPeriod,
                normalizeNumber(formData.otherDeduction)
            );
            setResult(result);
        }
    };

    return (
        <div className={clsx(styles.container, "margin-top--xl", "margin-bottom--xl")}>
            <h1 className={clsx(styles.textCenter, "margin-bottom--lg")}>Tính thuế TNCN</h1>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputWrapper}>
                    <fieldset
                        className={clsx(
                            styles.formGroup,
                            errors.basicSalary && styles.borderRed,
                            warnings.basicSalary && styles.borderYellow
                        )}
                    >
                        <legend className={styles.legend}>Mức lương đóng BH</legend>
                        <input
                            type="number"
                            name="basicSalary"
                            value={formData.basicSalary}
                            onChange={handleInputChange}
                            className={inputTopBottom()}
                        />
                    </fieldset>
                    {errors.basicSalary && (
                        <p className={styles.error}>{errors.basicSalary}</p>
                    )}
                    {warnings.basicSalary && (
                        <p className={styles.warning}>{warnings.basicSalary}</p>
                    )}
                </div>

                <div className={clsx(styles.inputWrapper, "margin-top--lg", "margin-bottom--lg")}>
                    <fieldset
                        className={clsx(
                            styles.formGroup,
                            errors.grossSalary && styles.borderRed
                        )}
                    >
                        <legend className={styles.legend}>Tổng thu nhập trước thuế</legend>
                        <input
                            type="number"
                            name="grossSalary"
                            value={formData.grossSalary}
                            onChange={handleInputChange}
                            className={inputTopBottom()}
                        />
                    </fieldset>
                    {errors.grossSalary && (
                        <p className={styles.error}>{errors.grossSalary}</p>
                    )}
                </div>

                <div className={clsx(styles.inputWrapper, "margin-top--lg", "margin-bottom--lg")}>
                    <fieldset
                        className={clsx(
                            styles.formGroup,
                            errors.otherDeduction && styles.borderRed
                        )}
                    >
                        <legend className={clsx(styles.legend, styles.legendGreen)}>Phụ cấp không tính thuế</legend>
                        <input
                            type="number"
                            name="otherDeduction"
                            value={formData.otherDeduction}
                            onChange={handleInputChange}
                            className={inputTopBottom()}
                        />
                    </fieldset>
                    {errors.otherDeduction && (
                        <p className={styles.error}>{errors.otherDeduction}</p>
                    )}
                </div>

                <div className={styles.inputWrapper}>
                    <fieldset
                        className={clsx(
                            styles.formGroup,
                            errors.dependants && styles.borderRed
                        )}
                    >
                        <legend className={styles.legend}>Số người phụ thuộc</legend>
                        <input
                            type="number"
                            name="dependants"
                            value={formData.dependants}
                            onChange={handleInputChange}
                            className={inputTopBottom()}
                        />
                    </fieldset>
                    {errors.dependants && (
                        <p className={styles.error}>{errors.dependants}</p>
                    )}
                </div>

                <div className={clsx(styles.checkboxWrapper, "margin-top--md", "margin-bottom--md")}>
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
                    <div className={styles.inputWrapper}>
                        <fieldset
                            className={clsx(
                                styles.formGroup,
                                errors.probationPercentage && styles.borderRed
                            )}
                        >
                            <legend className={styles.legend}>
                                % mức lương cơ bản (85-100)
                            </legend>
                            <input
                                type="number"
                                name="probationPercentage"
                                value={formData.probationPercentage}
                                onChange={handleInputChange}
                                className={inputTopBottom()}
                            />
                        </fieldset>
                        {errors.probationPercentage && (
                            <p className={styles.error}>{errors.probationPercentage}</p>
                        )}
                    </div>
                )}

                <div className={clsx(styles.inputWrapper, "margin-top--md", "margin-bottom--md")}>
                    <fieldset className={styles.formGroup}>
                        <legend className={styles.legend}>Kỳ tính thuế</legend>
                        <div className={styles.radioWrapper}>
                            <label className={styles.radioLabel}>
                                <input
                                    type="radio"
                                    name="isNewTaxPeriod"
                                    value="false"
                                    checked={!formData.isNewTaxPeriod}
                                    onChange={handleInputChange}
                                    className={styles.radio}
                                />
                                Trước 2026
                            </label>
                            <label className={styles.radioLabel}>
                                <input
                                    type="radio"
                                    name="isNewTaxPeriod"
                                    value="true"
                                    checked={formData.isNewTaxPeriod}
                                    onChange={handleInputChange}
                                    className={styles.radio}
                                />
                                Từ 2026
                            </label>
                        </div>
                    </fieldset>
                </div>

                <button
                    type="submit"
                    className="button button--outline button--primary button--lg button--block margin-bottom--lg margin-top--lg"
                >
                    Tính thuế TNCN
                </button>

                {result && (
                    <details
                        className={clsx(
                            styles.details,
                            "margin-top--lg",
                            "margin-bottom--lg"
                        )}
                        open
                    >
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
                        <hr/>
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

                <Link to="/vietnam-tax-calculation">
                    <i>Tham khảo cách tính thuế TNCN tại đây</i>
                </Link>
            </form>
        </div>
    );
}
