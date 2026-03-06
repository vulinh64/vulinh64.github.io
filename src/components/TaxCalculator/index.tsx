import React, {ChangeEvent, JSX, useEffect, useRef, useState} from "react";
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
    Errors,
    FormData,
    LOWEST_PROBATION_SALARY_TO_BE_TAXED,
    MAXIMUM_BASIC_SALARY,
    MAXIMUM_PROBATION_PERCENTAGE,
    MINIMUM_BASIC_SALARY,
    MINIMUM_PROBATION_PERCENTAGE,
    TaxCalculationResult,
    Warnings
} from "./TaxSupport";

function inputTopBottom() {
    return clsx(styles.input, "margin-bottom--xs", "margin-bottom--xs");
}

const EXIT_DURATION = 450;
const ENTER_DURATION = 500;

type DisplayMode = "normal" | "probation";
type AnimState = "idle" | "exiting" | "entering";

function formatNumber(value: number | string): string {
    if (value === "" || value === null || value === undefined) {
        return "";
    }
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) {
        return "";
    }
    return num.toLocaleString();
}

function parseFormattedNumber(value: string): number {
    if (!value) return 0;
    // Remove all non-digit characters except decimal separator
    const cleaned = value.replace(/[^\d]/g, "");
    return cleaned ? parseInt(cleaned, 10) : 0;
}

export default function TaxCalculator(): JSX.Element {
    const [formData, setFormData] = useState<FormData>({
        basicSalary: 3700000,
        grossSalary: 15500000,
        dependants: 0,
        onProbation: false,
        probationPercentage: MINIMUM_PROBATION_PERCENTAGE,
        isNewTaxPeriod: new Date().getFullYear() >= 2026,
        otherDeduction: 0
    });
    const [errors, setErrors] = useState<Errors>({});
    const [warnings, setWarnings] = useState<Warnings>({});
    const [result, setResult] = useState<TaxCalculationResult | null>(null);
    const [hasCalculated, setHasCalculated] = useState<boolean>(false);

    // Animation state machine
    const [displayMode, setDisplayMode] = useState<DisplayMode>(
        formData.onProbation ? "probation" : "normal"
    );
    const [animState, setAnimState] = useState<AnimState>("idle");
    const prevOnProbation = useRef(formData.onProbation);
    const animTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

    // Formatted display values
    const [displayValues, setDisplayValues] = useState({
        basicSalary: formatNumber(3700000),
        grossSalary: formatNumber(15500000),
        otherDeduction: formatNumber(0),
        probationPercentage: "85"
    });

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const {name, value, type, checked} = e.target;

        if (type === "checkbox") {
            setFormData((prev) => ({...prev, [name]: checked}));
        } else if (type === "radio") {
            setFormData((prev) => ({...prev, [name]: value === "true"}));
        } else if (name === "basicSalary" || name === "grossSalary" || name === "otherDeduction") {
            // Handle number inputs with real-time formatting
            const rawValue = parseFormattedNumber(value);
            setFormData((prev) => ({...prev, [name]: rawValue}));
            // Format immediately as user types
            setDisplayValues((prev) => ({...prev, [name]: formatNumber(rawValue)}));
        } else if (name === "probationPercentage") {
            // Handle percentage without formatting
            setFormData((prev) => ({...prev, [name]: value}));
            setDisplayValues((prev) => ({...prev, [name]: value}));
        } else {
            setFormData((prev) => ({...prev, [name]: value}));
        }

        if (errors[name]) {
            setErrors((prev) => ({...prev, [name]: ""}));
        }
        if (warnings[name]) {
            setWarnings((prev) => ({...prev, [name]: ""}));
        }
    };

    const validateAndCalculate = (autoCalculate: boolean = false): boolean => {
        const newErrors: Errors = {};
        const newWarnings: Warnings = {};

        const basicSalaryError = validateRequiredNumber(formData.basicSalary, "basicSalary");

        if (basicSalaryError) {
            newErrors.basicSalary = basicSalaryError;
        } else if (!formData.onProbation) {
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
        } else if (!formData.onProbation && parseFloat(String(formData.grossSalary)) < parseFloat(String(formData.basicSalary))) {
            newErrors.grossSalary = "Tổng thu nhập trước thuế phải lớn hơn lương đóng BH";
        } else if (formData.onProbation && parseFloat(String(formData.grossSalary)) < LOWEST_PROBATION_SALARY_TO_BE_TAXED) {
            newWarnings.grossSalary = `Thử việc dưới 3 tháng có mức lương thấp hơn ${LOWEST_PROBATION_SALARY_TO_BE_TAXED.toLocaleString()} VNĐ không bị khấu trừ thuế`;
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

        const isValid = Object.keys(newErrors).length === 0;

        if (autoCalculate && isValid && hasCalculated) {
            const calculationResult = calculateVietnamTax(
                parseFloat(String(formData.basicSalary)),
                parseFloat(String(formData.grossSalary)),
                normalizeNumber(formData.dependants, 0, parseInt),
                formData.onProbation,
                formData.onProbation ? parseFloat(String(formData.probationPercentage)) : MAXIMUM_PROBATION_PERCENTAGE,
                formData.isNewTaxPeriod,
                normalizeNumber(formData.otherDeduction)
            );
            setResult(calculationResult);
        } else if (autoCalculate && !isValid) {
            setResult(null);
        }

        return isValid;
    };

    useEffect(() => {
        validateAndCalculate(true);
    }, [formData.onProbation, formData.isNewTaxPeriod]);

    // Sequence: exit old fields → swap display → enter new fields
    useEffect(() => {
        if (formData.onProbation === prevOnProbation.current) return;
        prevOnProbation.current = formData.onProbation;

        // Cancel any in-flight timers from rapid toggling
        animTimers.current.forEach(clearTimeout);
        animTimers.current = [];

        setAnimState("exiting");

        const t1 = setTimeout(() => {
            // Swap the rendered group and start enter animation in one batch
            setDisplayMode(formData.onProbation ? "probation" : "normal");
            setAnimState("entering");

            const t2 = setTimeout(() => {
                setAnimState("idle");
            }, ENTER_DURATION);
            animTimers.current.push(t2);
        }, EXIT_DURATION);
        animTimers.current.push(t1);
    }, [formData.onProbation]);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => animTimers.current.forEach(clearTimeout);
    }, []);

    const validateForm = (): boolean => {
        return validateAndCalculate(false);
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
            setHasCalculated(true);
        }
    };

    return (
        <div className={clsx(styles.container, "margin-top--xl", "margin-bottom--xl")}>
            <h1 className={clsx(styles.textCenter, "margin-bottom--lg")}>Tính thuế TNCN</h1>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={clsx(styles.toggleWrapper, "margin-bottom--md")}>
                    <label className={styles.toggleLabel}>
                        <label className={styles.toggleSwitch}>
                            <input
                                type="checkbox"
                                name="onProbation"
                                checked={formData.onProbation}
                                onChange={handleInputChange}
                            />
                            <span className={styles.slider}></span>
                        </label>
                        Đang thử việc
                    </label>
                </div>

                <div className={clsx(styles.inputWrapper, "margin-top--lg", "margin-bottom--lg")}>
                    <fieldset
                        className={clsx(
                            styles.formGroup,
                            errors.grossSalary && styles.borderRed,
                            warnings.grossSalary && styles.borderYellow
                        )}
                    >
                        <legend className={styles.legend}>Tổng thu nhập trước thuế</legend>
                        <input
                            type="text"
                            name="grossSalary"
                            value={displayValues.grossSalary}
                            onChange={handleInputChange}
                            className={inputTopBottom()}
                        />
                    </fieldset>
                    {errors.grossSalary && (
                        <p className={styles.error}>{errors.grossSalary}</p>
                    )}
                    {warnings.grossSalary && (
                        <p className={styles.warning}>{warnings.grossSalary}</p>
                    )}
                </div>

                {displayMode === "normal" && (
                    <div className={clsx(
                        styles.fieldGroupAnimWrapper,
                        animState === "exiting" ? styles.fieldGroupExit :
                            animState === "entering" ? styles.fieldGroupEnter :
                                undefined
                    )}>
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
                                    type="text"
                                    name="basicSalary"
                                    value={displayValues.basicSalary}
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
                                    errors.otherDeduction && styles.borderRed
                                )}
                            >
                                <legend className={clsx(styles.legend, styles.legendGreen)}>Phụ cấp không tính thuế</legend>
                                <input
                                    type="text"
                                    name="otherDeduction"
                                    value={displayValues.otherDeduction}
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
                    </div>
                )}

                {displayMode === "probation" && (
                    <div className={clsx(
                        styles.fieldGroupAnimWrapper,
                        animState === "exiting" ? styles.fieldGroupExit :
                            animState === "entering" ? styles.fieldGroupEnter :
                                undefined
                    )}>
                        <div className={clsx(styles.inputWrapper, "margin-bottom--md")}>
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
                                    value={displayValues.probationPercentage}
                                    onChange={handleInputChange}
                                    className={inputTopBottom()}
                                />
                            </fieldset>
                            {errors.probationPercentage && (
                                <p className={styles.error}>
                                    {errors.probationPercentage}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    className="button button--outline button--primary button--lg button--block margin-bottom--lg margin-top--lg"
                >
                    Tính thuế TNCN
                </button>

                {result && (
                    <details
                        className={clsx(styles.resultDetails, "margin-top--lg", "margin-bottom--lg")}
                        open
                    >
                        <summary className={styles.resultSummary}>
                            Kết quả
                        </summary>

                        {!result.isProbation && (
                            <div className={styles.resultItem}>
                                <span>Lương đóng BH:</span>
                                <span className={styles.resultValue}>
                                    {result.cappedBaseSalary && !isNaN(result.cappedBaseSalary)
                                        ? `${Number(result.cappedBaseSalary).toLocaleString()} đ`
                                        : "N/A"}
                                </span>
                            </div>
                        )}

                        <div className={styles.resultItem}>
                            <span>Lương trước thuế:</span>
                            <span className={styles.resultValue}>
                                {result.grossSalary && !isNaN(Number(result.grossSalary))
                                    ? `${Number(result.grossSalary).toLocaleString()} đ`
                                    : "N/A"}
                            </span>
                        </div>

                        {!result.isProbation && (
                            <div className={styles.resultItem}>
                                <span>Số người phụ thuộc:</span>
                                <span className={styles.resultValue}>
                                    {Number(result.dependants).toLocaleString()}
                                </span>
                            </div>
                        )}

                        {result.isProbation && (
                            <>
                                <div className={styles.resultItem}>
                                    <span>% mức lương thử việc:</span>
                                    <span className={styles.resultValue}>
                                        {`${result.probation.probationPercentage}%`}
                                    </span>
                                </div>
                                <div className={styles.resultItem}>
                                    <span>Lương thử việc:</span>
                                    <span className={styles.resultValue}>
                                        {`${result.probation.probationSalary.toLocaleString()} đ`}
                                    </span>
                                </div>
                            </>
                        )}

                        <hr/>

                        {!result.isProbation && (
                            <div className={styles.resultItem}>
                                <span>Tổng đóng BH:</span>
                                <span className={styles.resultValue}>
                                    {`${result.nonProbation.insuranceAmount.toLocaleString()} đ`}
                                </span>
                            </div>
                        )}

                        <div className={styles.resultItem}>
                            <span>Thuế phải nộp:</span>
                            <span className={styles.resultValue}>
                                {`${result.taxedAmount.toLocaleString()} đ`}
                            </span>
                        </div>

                        <div className={styles.resultItem}>
                            <span>Thực lãnh:</span>
                            <span className={styles.netSalary}>
                                {`${result.netSalary.toLocaleString()} đ`}
                            </span>
                        </div>
                    </details>
                )}

                <ul>
                    <li>
                        <Link to="/vietnam-tax-calculation">
                            Tham khảo cách tính thuế TNCN tại đây
                        </Link>
                    </li>

                    <li>
                        <Link href="https://www.meinvoice.vn/tin-tuc/41039/cac-khoan-thu-nhap-khong-chiu-thue-tncn/">
                            Tham khảo danh mục phụ cấp không tính thuế TNCN
                        </Link>
                    </li>
                </ul>
            </form>
        </div>
    );
}