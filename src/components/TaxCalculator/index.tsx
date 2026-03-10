import React, {ChangeEvent, JSX, useEffect, useRef, useState} from "react";
import clsx from "clsx";
import styles from "./TaxCalculator.module.css";
import Link from "@docusaurus/Link";
import {
    calculateVietnamTax, formatNumber,
    getInitialState,
    normalizeNumber,
    parseFormattedNumber,
    validateNonNegative,
    validateRange,
    validateRequiredNumber
} from "./TaxUtils";
import {
    EMPTY,
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

// Nudge

function inputTopBottom() {
    return clsx(styles.input, "margin-bottom--xs", "margin-bottom--xs");
}

const EXIT_DURATION = 450;
const ENTER_DURATION = 500;

type DisplayMode = "normal" | "probation";
type AnimState = "idle" | "exiting" | "entering";

export default function TaxCalculator(): JSX.Element {
    const [
        {
            formData: initFormData,
            isVnLocale: initIsVnLocale,
            hasUrlParams: initHasUrlParams
        }
    ] = useState(getInitialState);

    const [formData, setFormData] = useState<FormData>(initFormData);
    const [errors, setErrors] = useState<Errors>({});
    const [warnings, setWarnings] = useState<Warnings>({});
    const [result, setResult] = useState<TaxCalculationResult | null>(null);
    const [hasCalculated, setHasCalculated] = useState<boolean>(initHasUrlParams);
    const [urlActive, setUrlActive] = useState(initHasUrlParams);

    // Animation state machine
    const [displayMode, setDisplayMode] = useState<DisplayMode>(
        formData.onProbation
            ? "probation"
            : "normal"
    );
    const [animationState, setAnimationState] = useState<AnimState>("idle");
    const prevOnProbation = useRef(formData.onProbation);
    const animTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

    const [useVietnameseLocale, setUseVietnameseLocale] = useState(initIsVnLocale);

    const locale = useVietnameseLocale
        ? "vi-VN"
        : undefined;

    // Formatted display values
    const [displayValues, setDisplayValues] = useState({
        basicSalary: formatNumber(initFormData.basicSalary, locale),
        grossSalary: formatNumber(initFormData.grossSalary, locale),
        otherDeduction: formatNumber(initFormData.otherDeduction, locale),
        probationPercentage: String(initFormData.probationPercentage)
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
            setDisplayValues((prev) => ({...prev, [name]: formatNumber(rawValue, locale)}));
        } else if (name === "probationPercentage") {
            const numericValue = parseFloat(value);
            setFormData((prev) => ({...prev, [name]: numericValue}));
            setDisplayValues((prev) => ({...prev, [name]: value}));
        } else {
            setFormData((prev) => ({...prev, [name]: value}));
        }

        if (errors[name]) {
            setErrors((prev) => ({...prev, [name]: EMPTY}));
        }
        if (warnings[name]) {
            setWarnings((prev) => ({...prev, [name]: EMPTY}));
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
                `Lương đóng BHXH không được thấp hơn ${MINIMUM_BASIC_SALARY.toLocaleString(locale)} VNĐ`,
                `Mức lương đóng BH tối đa là ${MAXIMUM_BASIC_SALARY.toLocaleString(locale)} VNĐ`
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
            newWarnings.grossSalary = `Thử việc dưới 3 tháng có mức lương thấp hơn ${LOWEST_PROBATION_SALARY_TO_BE_TAXED.toLocaleString(locale)} VNĐ không bị khấu trừ thuế`;
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
            setResult(calculateVietnamTax(
                parseFloat(String(formData.basicSalary)),
                parseFloat(String(formData.grossSalary)),
                normalizeNumber(formData.dependants, 0, parseInt),
                formData.onProbation,
                formData.onProbation
                    ? parseFloat(String(formData.probationPercentage))
                    : MAXIMUM_PROBATION_PERCENTAGE,
                formData.isNewTaxPeriod,
                normalizeNumber(formData.otherDeduction)
            ));
        } else if (autoCalculate && !isValid) {
            setResult(null);
        }

        return isValid;
    };

    useEffect(() => {
        validateAndCalculate(true);
    }, [formData.onProbation, formData.isNewTaxPeriod, locale]);

    // Sequence: exit old fields → swap display → enter new fields
    useEffect(() => {
        if (formData.onProbation === prevOnProbation.current) {
            return;
        }

        prevOnProbation.current = formData.onProbation;

        // Cancel any in-flight timers from rapid toggling
        animTimers.current.forEach(clearTimeout);
        animTimers.current = [];

        setAnimationState("exiting");

        const t1 = setTimeout(() => {
            // Swap the rendered group and start enter animation in one batch
            setDisplayMode(formData.onProbation
                ? "probation"
                : "normal");
            setAnimationState("entering");

            const t2 = setTimeout(() => {
                setAnimationState("idle");
            }, ENTER_DURATION);
            animTimers.current.push(t2);
        }, EXIT_DURATION);
        animTimers.current.push(t1);
    }, [formData.onProbation]);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => animTimers.current.forEach(clearTimeout);
    }, []);

    // Reformat input display values when locale changes
    useEffect(() => {
        setDisplayValues((prev) => ({
            ...prev,
            basicSalary: formatNumber(formData.basicSalary, locale),
            grossSalary: formatNumber(formData.grossSalary, locale),
            otherDeduction: formatNumber(formData.otherDeduction, locale),
        }));
    }, [useVietnameseLocale]);

    // Sync form state to URL parameters
    useEffect(() => {
        if (typeof window === "undefined" || !urlActive) {
            return;
        }

        const params = new URLSearchParams();

        params.set("grossSalary", String(formData.grossSalary));
        params.set("onProbation", String(formData.onProbation));
        params.set("isVnLocale", String(useVietnameseLocale));

        if (formData.onProbation) {
            params.set("probationPercentage", String(formData.probationPercentage));
        } else {
            params.set("basicSalary", String(formData.basicSalary));
            params.set("otherDeduction", String(formData.otherDeduction));
            params.set("dependants", String(formData.dependants));
            params.set("isPost2026", String(formData.isNewTaxPeriod));
        }

        window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    }, [formData, useVietnameseLocale, urlActive]);

    const validateForm = (): boolean => {
        return validateAndCalculate(false);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        setUrlActive(true);

        if (validateForm()) {
            setResult(calculateVietnamTax(
                parseFloat(String(formData.basicSalary)),
                parseFloat(String(formData.grossSalary)),
                normalizeNumber(formData.dependants, 0, parseInt),
                formData.onProbation,
                formData.onProbation
                    ? parseFloat(String(formData.probationPercentage))
                    : MAXIMUM_PROBATION_PERCENTAGE,
                formData.isNewTaxPeriod,
                normalizeNumber(formData.otherDeduction)
            ));

            setHasCalculated(true);
        }
    };

    return (
        <div className={clsx(styles.container, "margin-top--xl", "margin-bottom--xl")}>
            <h1 className={clsx(styles.textCenter, "margin-bottom--lg")}>Tính thuế TNCN</h1>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={clsx(styles.toggleRow, "margin-bottom--md")}>
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

                    <label className={styles.toggleLabel}>
                        <label className={styles.toggleSwitch}>
                            <input
                                type="checkbox"
                                checked={useVietnameseLocale}
                                onChange={(e: {
                                    target: { checked: boolean | ((prevState: boolean) => boolean); };
                                }) => setUseVietnameseLocale(e.target.checked)}
                            />
                            <span className={styles.slider}></span>
                        </label>
                        🇻🇳
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
                        animationState === "exiting"
                            ? styles.fieldGroupExit
                            : animationState === "entering"
                                ? styles.fieldGroupEnter
                                : undefined
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
                        animationState === "exiting"
                            ? styles.fieldGroupExit
                            : animationState === "entering"
                                ? styles.fieldGroupEnter
                                : undefined
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
                                        ? `${Number(result.cappedBaseSalary).toLocaleString(locale)} đ`
                                        : "N/A"}
                                </span>
                            </div>
                        )}

                        <div className={styles.resultItem}>
                            <span>Lương trước thuế:</span>
                            <span className={styles.resultValue}>
                                {result.grossSalary && !isNaN(Number(result.grossSalary))
                                    ? `${Number(result.grossSalary).toLocaleString(locale)} đ`
                                    : "N/A"}
                            </span>
                        </div>

                        {!result.isProbation && (
                            <div className={styles.resultItem}>
                                <span>Số người phụ thuộc:</span>
                                <span className={styles.resultValue}>
                                    {Number(result.dependants).toLocaleString(locale)}
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
                                        {`${result.probation.probationSalary.toLocaleString(locale)} đ`}
                                    </span>
                                </div>
                            </>
                        )}

                        <hr/>

                        {!result.isProbation && result.nonProbation && (
                            <div className={styles.resultItem}>
                                <span>Tổng đóng BH:</span>
                                <span className={styles.resultValue}>
                                    {`${result.nonProbation.insuranceAmount.toLocaleString(locale)} đ`}
                                </span>
                            </div>
                        )}

                        <div className={styles.resultItem}>
                            <span>Thuế phải nộp:</span>
                            <span className={styles.resultValue}>
                                {`${result.taxedAmount.toLocaleString(locale)} đ`}
                            </span>
                        </div>

                        <div className={styles.resultItem}>
                            <span>Thực lãnh:</span>
                            <span className={styles.netSalary}>
                                {`${result.netSalary.toLocaleString(locale)} đ`}
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