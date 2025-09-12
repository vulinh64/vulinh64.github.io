import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
    CronUtils,
    dayOrder,
    getInitialState,
    getMaxVal,
    handleSpecificSelection,
    isAnyNilOrEmpty,
    isDayOfMonth,
    isDayOfWeek,
    isMonth,
    isOptionTypeBetween,
    isOptionTypeInterval,
    isOptionTypeIntervalBetween,
    isOptionTypeLastOf,
    isOptionTypeSpecific,
    monthOrder,
    updateUrlParams,
    weekdayOrder
} from "./CronUtils";
import styles from "./SpringCronGenerator.module.css";
import clsx from "clsx";
import {
    END_DAY_OF_WEEK,
    EVERY_EXPRESSION,
    FROM_VALUE_INPUT_FIELD,
    INTERVAL_INPUT_FIELD,
    LAST_INPUT_FIELD,
    LAST_WEEKDAY_INPUT_FIELD,
    MAX_DAYS_OF_MONTH,
    MAX_DAYS_OF_WEEK,
    MAX_HOUR,
    MAX_MONTHS,
    MAX_SECONDS_MINUTES,
    MIN_ONE,
    MIN_TIME,
    MIN_ZERO,
    MONTH_FEB,
    MONTH_JAN,
    MONTHS,
    NAME_DAY_OF_MONTH,
    NAME_DAY_OF_WEEK,
    NAME_HOUR,
    NAME_MINUTE,
    NAME_MONTH,
    NAME_SECOND,
    NTH_OCCURRENCE_INPUT_FIELD,
    NTH_OCCURRENCES,
    PART_DAY,
    PART_DAY_OF_WEEK,
    PART_HOUR,
    PART_LAST_DAY_OFFSET,
    PART_MINUTE,
    PART_MONTH,
    PART_SECOND,
    SPACED_COMMA,
    SPECIFIC_VALUE_INPUT_FIELD,
    TEXT_EMPTY,
    TEXT_ONE,
    TEXT_TWO,
    TO_VALUE_INPUT_FIELD,
    TYPE_BETWEEN,
    TYPE_EVERY,
    TYPE_INTERVAL,
    TYPE_INTERVAL_BETWEEN,
    TYPE_LAST,
    TYPE_LAST_WEEKDAY,
    TYPE_NTH,
    TYPE_RANGES,
    TYPE_SPECIFIC,
    WEEK_DAYS,
    WEEKDAY_INPUT_FIELD,
    WEEKDAY_MON,
    WEEKDAY_SUN
} from "./Const";

export class CronError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CronError';
    }
}

export type CronExpressions = {
    readonly second: string;
    readonly minute: string;
    readonly hour: string;
    readonly dayOfMonth: string;
    readonly month: string;
    readonly dayOfWeek: string;
};

export interface CronPartOptions {
    type: OptionType;
    intervalValue?: number;
    fromValue?: number | string;
    toValue?: number | string;
    specificValues?: string;
    weekday?: string;
    nthOccurrence?: string;
    lastValue?: number;
    lastWeekday?: string;
}

export interface CronPartProps {
    name: string;
    plural: string;
    onExpressionChange: (expression: string) => void;
}

export type OptionType = typeof TYPE_EVERY
    | typeof TYPE_INTERVAL
    | typeof TYPE_BETWEEN
    | typeof TYPE_SPECIFIC
    | typeof TYPE_RANGES
    | typeof TYPE_NTH
    | typeof TYPE_LAST
    | typeof TYPE_LAST_WEEKDAY
    | typeof TYPE_INTERVAL_BETWEEN;

export interface CronPartState {
    option: OptionType;
    selectedMonths: readonly string[];
    selectedWeekdays: readonly string[];
    intervalValue: string;
    fromValue: string;
    toValue: string;
    specificValues: string;
    weekday: string;
    nthOccurrence: string;
    lastValue: string;
    lastWeekday: string;
    error: string;
}

export interface UrlParamConfig {
    optionParam: string;
    argParams: string[];
    validOptions: OptionType[];
    maxVal: number;
}

export const CronPart: React.FC<CronPartProps> = ({name, plural, onExpressionChange}) => {
    const config = cronPartConfig[name];

    const urlConfig: UrlParamConfig = useMemo(() => ({
        optionParam: config.url.optionParam,
        argParams: config.url.argParams,
        validOptions: config.validOptions,
        maxVal: config.maxVal
    }), [config]);

    const [state, setState] = useState<CronPartState>(() =>
        getInitialState(name, urlConfig)
    );

    const prevExpressionRef = useRef<string>(EVERY_EXPRESSION);
    const prevErrorRef = useRef<string>(TEXT_EMPTY);

    const sortedSelectedMonths = useMemo(
        () => [...state.selectedMonths].sort((a, b) => monthOrder[a] - monthOrder[b]),
        [state.selectedMonths]
    );

    const sortedSelectedWeekdays = useMemo(
        () => [...state.selectedWeekdays].sort((a, b) => weekdayOrder[a] - weekdayOrder[b]),
        [state.selectedWeekdays]
    );

    const handleMonthChange = useCallback((month: string) => {
        setState(prev => ({
            ...prev,
            selectedMonths: prev.selectedMonths.includes(month)
                ? prev.selectedMonths.filter(m => m !== month)
                : [...prev.selectedMonths, month]
        }));
    }, []);

    const handleWeekdayChange = useCallback((weekday: string) => {
        setState(prev => ({
            ...prev,
            selectedWeekdays: prev.selectedWeekdays.includes(weekday)
                ? prev.selectedWeekdays.filter(w => w !== weekday)
                : [...prev.selectedWeekdays, weekday]
        }));
    }, []);

    const handleOptionChange = useCallback((newOption: OptionType) => {
        setState(prev => {
            const baseState = {
                ...prev,
                option: newOption,
                error: TEXT_EMPTY
            };

            switch (name) {
                case NAME_MONTH:
                    return {
                        ...baseState,
                        intervalValue: isOptionTypeInterval(newOption) ? config.defaults.interval : TEXT_EMPTY,
                        fromValue: isOptionTypeBetween(newOption) ? config.defaults.from : TEXT_EMPTY,
                        toValue: isOptionTypeBetween(newOption) ? config.defaults.to : TEXT_EMPTY,
                        selectedMonths: isOptionTypeSpecific(newOption) ? config.defaults.specific as string[] : []
                    };
                case NAME_DAY_OF_WEEK:
                    return {
                        ...baseState,
                        intervalValue: isOptionTypeInterval(newOption) ? config.defaults.interval : TEXT_EMPTY,
                        fromValue: isOptionTypeBetween(newOption) ? config.defaults.from : TEXT_EMPTY,
                        toValue: isOptionTypeBetween(newOption) ? config.defaults.to : TEXT_EMPTY,
                        selectedWeekdays: isOptionTypeSpecific(newOption) ? config.defaults.specific as string[] : [],
                        weekday: config.defaults.nthWeekday,
                        nthOccurrence: config.defaults.nthOccurrence,
                        lastWeekday: config.defaults.lastWeekday
                    };
                default:
                    return {
                        ...baseState,
                        intervalValue: (isOptionTypeInterval(newOption) || isOptionTypeIntervalBetween(newOption)) ? config.defaults.interval : TEXT_EMPTY,
                        fromValue: (isOptionTypeBetween(newOption) || isOptionTypeIntervalBetween(newOption)) ? config.defaults.from : TEXT_EMPTY,
                        toValue: (isOptionTypeBetween(newOption) || isOptionTypeIntervalBetween(newOption)) ? config.defaults.to : TEXT_EMPTY,
                        specificValues: getSpecificValuesForOption(newOption, config.defaults),
                        lastValue: isOptionTypeLastOf(newOption) ? config.defaults.last : TEXT_EMPTY
                    };
            }
        });
    }, [name, config]);

    const getSpecificValuesForOption = (option: OptionType, defaults: any) => {
        switch (option) {
            case TYPE_SPECIFIC:
                return defaults.specific;
            case TYPE_RANGES:
                return defaults.ranges;
            default:
                return TEXT_EMPTY;
        }
    };

    const createInputHandler = useCallback((field: keyof CronPartState) =>
        (value: string) => {
            setState(prev => ({...prev, [field]: value}));
        }, []
    );

    useEffect(() => {
        let expression = EVERY_EXPRESSION;
        let newError = TEXT_EMPTY;

        try {
            const options: CronPartOptions = {
                type: state.option as any,
                intervalValue: isAnyNilOrEmpty(state.intervalValue) ? undefined : parseInt(state.intervalValue, 10),
                fromValue: isAnyNilOrEmpty(state.fromValue) ? undefined : state.fromValue,
                toValue: isAnyNilOrEmpty(state.toValue) ? undefined : state.toValue,
                specificValues: isAnyNilOrEmpty(state.specificValues) ? undefined : state.specificValues,
                weekday: isAnyNilOrEmpty(state.weekday) ? undefined : state.weekday,
                nthOccurrence: isAnyNilOrEmpty(state.nthOccurrence) ? undefined : state.nthOccurrence,
                lastValue: isAnyNilOrEmpty(state.lastValue) ? undefined : parseInt(state.lastValue, 10),
                lastWeekday: isAnyNilOrEmpty(state.lastWeekday) ? undefined : state.lastWeekday
            };

            switch (name) {
                case NAME_MONTH:
                    newError = handleSpecificSelection(state, sortedSelectedMonths, NAME_MONTH, options);
                    break;
                case NAME_DAY_OF_WEEK:
                    newError = handleSpecificSelection(state, sortedSelectedWeekdays, NAME_DAY_OF_WEEK, options);
                    break;
            }

            if (isAnyNilOrEmpty(newError)) {
                const generator = expressionGeneratorMatrix[name]?.[options.type];

                if (generator) {
                    expression = generator(options);
                } else {
                    throw new CronError(`Invalid option '${options.type}' for cron part '${name}'`);
                }
            }

            if (expression !== prevExpressionRef.current) {
                prevExpressionRef.current = expression;
                onExpressionChange(expression);
            }

            if (newError !== prevErrorRef.current) {
                prevErrorRef.current = newError;
                setState(prev => ({...prev, error: newError}));
            }

            updateUrlParams(name, state, urlConfig);
        } catch (error) {
            if (error instanceof CronError) {
                if (error.message !== prevErrorRef.current) {
                    prevErrorRef.current = error.message;
                    setState(prev => ({...prev, error: error.message}));
                }
            } else {
                console.error('Unexpected error:', error);
            }
        }
    }, [
        name,
        state.option,
        state.intervalValue,
        state.fromValue,
        state.toValue,
        state.specificValues,
        sortedSelectedMonths,
        sortedSelectedWeekdays,
        state.weekday,
        state.nthOccurrence,
        state.lastValue,
        state.lastWeekday,
        onExpressionChange,
        urlConfig
    ]);

    const renderNumberInput = (
        value: string,
        onChange: (value: string) => void,
        placeholder: string,
        min: number = config.minVal,
        max: number = config.maxVal
    ) => (
        <input
            type="number"
            min={min}
            max={max}
            value={value}
            onChange={(e: { target: { value: string; }; }) => onChange(e.target.value)}
            placeholder={placeholder}
            className={styles.numberInput}
        />
    );

    const renderDropdown = (
        value: string,
        onChange: (value: string) => void,
        options: readonly string[],
        className?: string
    ) => (
        <select
            className={clsx(styles.dropdown, className)}
            value={value}
            onChange={(e: { target: { value: string; }; }) => onChange(e.target.value)}
        >
            {options.map(item => (
                <option
                    key={item}
                    value={item}
                >
                    {item}
                </option>
            ))}
        </select>
    );

    const isFieldMonth = isMonth(name);
    const isFieldDayOfWeek = isDayOfWeek(name);

    return (
        <fieldset className={styles.cronPart}>
            <legend>{name.charAt(0).toUpperCase() + name.slice(1)} Expression</legend>

            {state.error && (
                <div
                    className={styles.errorMessage}
                    style={{color: 'var(--ifm-color-danger)'}}
                >
                    {state.error}
                </div>
            )}

            <div className={styles.optionContainer}>
                <label htmlFor={`${name}-option`}>Option:</label>
                <select
                    id={`${name}-option`}
                    value={state.option}
                    onChange={(e: { target: { value: string; }; }) => handleOptionChange(e.target.value as OptionType)}
                    className={clsx(styles.optionSelect, 'margin-top--md', 'margin-bottom--md')}
                >
                    <option value={TYPE_EVERY}>Every {name}</option>
                    <option value={TYPE_INTERVAL}>Every N {name}</option>
                    <option value={TYPE_BETWEEN}>Between {name} range</option>
                    <option value={TYPE_SPECIFIC}>Specific {plural}</option>
                    {config.isNumeric && (
                        <option value={TYPE_RANGES}>Multiple ranges</option>
                    )}
                    {config.isNumeric && (
                        <option value={TYPE_INTERVAL_BETWEEN}>Every N {name} between range</option>
                    )}
                    {isDayOfMonth(name) && (
                        <option value={TYPE_LAST}>N-to-last day of month</option>
                    )}
                    {isFieldDayOfWeek && (
                        <>
                            <option value={TYPE_NTH}>Nth occurrence</option>
                            <option value={TYPE_LAST_WEEKDAY}>Last weekday of month</option>
                        </>
                    )}
                </select>
            </div>

            {state.option === TYPE_INTERVAL && (
                <fieldset className={styles.subFieldset}>
                    <legend>Interval</legend>
                    <div className={styles.inputContainer}>
                        {renderNumberInput(
                            state.intervalValue,
                            createInputHandler(INTERVAL_INPUT_FIELD),
                            `Enter ${name} interval`,
                            MIN_ONE,
                            getMaxVal(name, config)
                        )}
                    </div>
                </fieldset>
            )}

            {state.option === TYPE_BETWEEN && (

                <fieldset className={styles.subFieldset}>
                    <legend>From ... to ... {name}</legend>
                    <div className={styles.betweenContainer}>
                        <legend>From</legend>
                        <div className={styles.inputContainer}>
                            {!config.isNumeric ? (
                                renderDropdown(
                                    state.fromValue,
                                    createInputHandler(FROM_VALUE_INPUT_FIELD),
                                    isFieldMonth ? MONTHS : WEEK_DAYS,
                                )
                            ) : (
                                renderNumberInput(
                                    state.fromValue,
                                    createInputHandler(FROM_VALUE_INPUT_FIELD),
                                    `From ${name}`
                                )
                            )}
                        </div>
                        <legend>To</legend>
                        <div className={styles.inputContainer}>
                            {!config.isNumeric ? (
                                renderDropdown(
                                    state.toValue,
                                    createInputHandler(TO_VALUE_INPUT_FIELD),
                                    isFieldMonth ? MONTHS : WEEK_DAYS,
                                )
                            ) : (
                                renderNumberInput(
                                    state.toValue,
                                    createInputHandler(TO_VALUE_INPUT_FIELD),
                                    `To ${name}`
                                )
                            )}
                        </div>
                    </div>
                </fieldset>
            )}

            {state.option === TYPE_INTERVAL_BETWEEN && (
                <fieldset className={styles.subFieldset}>
                    <legend>Every N {name}(s) from ... to ... {name}</legend>
                    <div className={styles.betweenContainer}>
                        <legend>Interval</legend>
                        <div className={styles.inputContainer}>
                            {renderNumberInput(
                                state.intervalValue,
                                createInputHandler(INTERVAL_INPUT_FIELD),
                                'Enter interval value, e.g., 5',
                                MIN_ONE,
                                config.maxVal
                            )}
                        </div>
                        <legend>From</legend>
                        <div className={styles.inputContainer}>
                            {renderNumberInput(
                                state.fromValue,
                                createInputHandler(FROM_VALUE_INPUT_FIELD),
                                'Enter start value, e.g., 0',
                                config.minVal,
                                config.maxVal
                            )}
                        </div>
                        <legend>To</legend>
                        <div className={styles.inputContainer}>
                            {renderNumberInput(
                                state.toValue,
                                createInputHandler(TO_VALUE_INPUT_FIELD),
                                'Enter end value, e.g., 59',
                                config.minVal,
                                config.maxVal
                            )}
                        </div>
                    </div>
                </fieldset>
            )}

            {state.option === TYPE_SPECIFIC && (
                <fieldset className={styles.subFieldset}>
                    <legend>{plural.charAt(0).toUpperCase() + plural.slice(1)}</legend>
                    <div className={clsx({
                        [styles.specificContainer]: !config.isNumeric,
                        [styles.specificContainerTextInput]: config.isNumeric
                    })}>
                        {(() => {
                            switch (name) {
                                case NAME_MONTH:
                                    return MONTHS.map(month => (
                                        <label key={month} className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={state.selectedMonths.includes(month)}
                                                onChange={() => handleMonthChange(month)}
                                            />
                                            {month}
                                        </label>
                                    ));
                                case NAME_DAY_OF_WEEK:
                                    return WEEK_DAYS.map(day => (
                                        <label key={day} className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={state.selectedWeekdays.includes(day)}
                                                onChange={() => handleWeekdayChange(day)}
                                            />
                                            {day}
                                        </label>
                                    ));
                                default:
                                    return <input
                                        type="text"
                                        value={state.specificValues}
                                        onChange={(e: {
                                            target: { value: string; };
                                        }) => createInputHandler(SPECIFIC_VALUE_INPUT_FIELD)(e.target.value)}
                                        placeholder={`e.g., ${config.defaults.specific}`}
                                        pattern="^(\d+)(,\d+)*$"
                                        title="Comma-separated numbers only"
                                        className={styles.textInput}
                                    />;
                            }
                        })()}
                    </div>
                </fieldset>
            )}

            {state.option === TYPE_RANGES && config.isNumeric && (
                <div className={styles.inputContainer}>
                    <fieldset className={styles.inputGroup}>
                        <legend>Ranges (separated by comma)</legend>
                        <input
                            type="text"
                            value={state.specificValues}
                            onChange={(e: {
                                target: { value: string; };
                            }) => createInputHandler(SPECIFIC_VALUE_INPUT_FIELD)(e.target.value)}
                            placeholder={`e.g., ${config.defaults.ranges}`}
                            pattern="^(\d+-\d+)(,\d+-\d+)*$"
                            title="Comma-separated ranges (e.g., 1-10,12-14)"
                            className={styles.textInput}
                        />
                    </fieldset>
                </div>
            )}

            {state.option === TYPE_NTH && isFieldDayOfWeek && (
                <fieldset className={styles.subFieldset}>
                    <legend>Nth occurrence</legend>
                    <div className={styles.dropdownContainer}>
                        <div className={styles.dropdownUnit}>
                            <label htmlFor="weekday-select">Day of Week:</label>
                            {renderDropdown(
                                state.weekday,
                                createInputHandler(WEEKDAY_INPUT_FIELD),
                                WEEK_DAYS,
                                clsx(styles.nthDropdown)
                            )}
                        </div>
                        <div className={styles.dropdownUnit}>
                            <label htmlFor="nth-select">nth occurrence:</label>
                            {renderDropdown(
                                state.nthOccurrence,
                                createInputHandler(NTH_OCCURRENCE_INPUT_FIELD),
                                NTH_OCCURRENCES,
                                clsx(styles.nthDropdown)
                            )}
                        </div>
                    </div>
                </fieldset>
            )}

            {state.option === TYPE_LAST && isDayOfMonth(name) && (
                <fieldset className={styles.subFieldset}>
                    <legend>N-to-last day of month</legend>
                    <div className={styles.inputContainer}>
                        {renderNumberInput(
                            state.lastValue,
                            createInputHandler(LAST_INPUT_FIELD),
                            "Enter days from last day (optional, e.g., 1 for L-1)",
                            MIN_ONE,
                            MAX_DAYS_OF_MONTH
                        )}
                    </div>
                </fieldset>
            )}

            {state.option === TYPE_LAST_WEEKDAY && isFieldDayOfWeek && (
                <fieldset className={styles.subFieldset}>
                    <legend>Last weekday of month</legend>
                    <div className={styles.inputContainer}>
                        {renderDropdown(
                            state.lastWeekday,
                            createInputHandler(LAST_WEEKDAY_INPUT_FIELD),
                            WEEK_DAYS,
                            clsx(styles.nthDropdown)
                        )}
                    </div>
                </fieldset>
            )}
        </fieldset>
    );
};

const cronPartConfig = {
    [NAME_SECOND]: {
        plural: 'seconds',
        url: {optionParam: 's', argParams: ['a0', 'b0', 'c0']},
        validOptions: [TYPE_EVERY, TYPE_INTERVAL, TYPE_BETWEEN, TYPE_SPECIFIC, TYPE_RANGES, TYPE_INTERVAL_BETWEEN] as OptionType[],
        minVal: MIN_TIME, maxVal: MAX_SECONDS_MINUTES,
        defaults: {
            interval: TEXT_ONE, from: TEXT_ONE, to: TEXT_TWO,
            specific: '0,1,2', ranges: '0-1,2-3'
        },
        isNumeric: true,
    },
    [NAME_MINUTE]: {
        plural: 'minutes',
        url: {optionParam: 'm', argParams: ['a1', 'b1', 'c1']},
        validOptions: [TYPE_EVERY, TYPE_INTERVAL, TYPE_BETWEEN, TYPE_SPECIFIC, TYPE_RANGES, TYPE_INTERVAL_BETWEEN] as OptionType[],
        minVal: MIN_TIME, maxVal: MAX_SECONDS_MINUTES,
        defaults: {
            interval: TEXT_ONE, from: TEXT_ONE, to: TEXT_TWO,
            specific: '0,1,2', ranges: '0-1,2-3'
        },
        isNumeric: true,
    },
    [NAME_HOUR]: {
        plural: 'hours',
        url: {optionParam: 'h', argParams: ['a2', 'b2', 'c2']},
        validOptions: [TYPE_EVERY, TYPE_INTERVAL, TYPE_BETWEEN, TYPE_SPECIFIC, TYPE_RANGES, TYPE_INTERVAL_BETWEEN] as OptionType[],
        minVal: MIN_TIME, maxVal: MAX_HOUR,
        defaults: {
            interval: TEXT_ONE, from: TEXT_ONE, to: TEXT_TWO,
            specific: '0,1,2', ranges: '0-1,2-3'
        },
        isNumeric: true,
    },
    [NAME_DAY_OF_MONTH]: {
        plural: 'days of month',
        url: {optionParam: 'dm', argParams: ['a3', 'b3', 'c3']},
        validOptions: [TYPE_EVERY, TYPE_INTERVAL, TYPE_BETWEEN, TYPE_SPECIFIC, TYPE_RANGES, TYPE_LAST, TYPE_INTERVAL_BETWEEN] as OptionType[],
        minVal: MIN_ONE, maxVal: MAX_DAYS_OF_MONTH,
        defaults: {
            interval: TEXT_ONE, from: TEXT_ONE, to: TEXT_TWO,
            specific: '1,2,3', ranges: '1-2,3-4', last: TEXT_EMPTY
        },
        isNumeric: true,
    },
    [NAME_MONTH]: {
        plural: 'months',
        url: {optionParam: 'mm', argParams: ['a4', 'b4']},
        validOptions: [TYPE_EVERY, TYPE_INTERVAL, TYPE_BETWEEN, TYPE_SPECIFIC] as OptionType[],
        minVal: MIN_ONE, maxVal: MAX_MONTHS,
        defaults: {
            interval: TEXT_ONE, from: MONTH_JAN, to: MONTH_FEB,
            specific: [MONTH_JAN]
        },
        isNumeric: false,
    },
    [NAME_DAY_OF_WEEK]: {
        plural: 'days of week',
        url: {optionParam: 'dw', argParams: ['a5', 'b5']},
        validOptions: [TYPE_EVERY, TYPE_INTERVAL, TYPE_BETWEEN, TYPE_SPECIFIC, TYPE_NTH, TYPE_LAST_WEEKDAY] as OptionType[],
        minVal: MIN_ZERO, maxVal: END_DAY_OF_WEEK,
        defaults: {
            interval: TEXT_ONE, from: WEEKDAY_SUN, to: WEEKDAY_MON,
            specific: [WEEKDAY_MON], nthWeekday: WEEKDAY_MON, nthOccurrence: TEXT_ONE, lastWeekday: WEEKDAY_MON
        },
        isNumeric: false,
    }
};

const expressionGeneratorMatrix = {
    [NAME_SECOND]: {
        [TYPE_EVERY]: (opts: CronPartOptions) =>
            CronUtils.generateTimePartExpression(opts, PART_SECOND, MAX_SECONDS_MINUTES),
        [TYPE_INTERVAL]: (opts: CronPartOptions) =>
            CronUtils.generateTimePartExpression(opts, PART_SECOND, MAX_SECONDS_MINUTES),
        [TYPE_BETWEEN]: (opts: CronPartOptions) =>
            CronUtils.generateTimePartExpression(opts, PART_SECOND, MAX_SECONDS_MINUTES),
        [TYPE_SPECIFIC]: (opts: CronPartOptions) =>
            CronUtils.generateTimePartExpression(opts, PART_SECOND, MAX_SECONDS_MINUTES),
        [TYPE_RANGES]: (opts: CronPartOptions) =>
            CronUtils.generateTimePartExpression(opts, PART_SECOND, MAX_SECONDS_MINUTES),
        [TYPE_INTERVAL_BETWEEN]: (opts: CronPartOptions) =>
            CronUtils.generateTimePartExpression(opts, PART_SECOND, MAX_SECONDS_MINUTES),
    },
    [NAME_MINUTE]: {
        [TYPE_EVERY]: (opts: CronPartOptions) =>
            CronUtils.generateTimePartExpression(opts, PART_MINUTE, MAX_SECONDS_MINUTES),
        [TYPE_INTERVAL]: (opts: CronPartOptions) =>
            CronUtils.generateTimePartExpression(opts, PART_MINUTE, MAX_SECONDS_MINUTES),
        [TYPE_BETWEEN]: (opts: CronPartOptions) =>
            CronUtils.generateTimePartExpression(opts, PART_MINUTE, MAX_SECONDS_MINUTES),
        [TYPE_SPECIFIC]: (opts: CronPartOptions) =>
            CronUtils.generateTimePartExpression(opts, PART_MINUTE, MAX_SECONDS_MINUTES),
        [TYPE_RANGES]: (opts: CronPartOptions) =>
            CronUtils.generateTimePartExpression(opts, PART_MINUTE, MAX_SECONDS_MINUTES),
        [TYPE_INTERVAL_BETWEEN]: (opts: CronPartOptions) =>
            CronUtils.generateTimePartExpression(opts, PART_MINUTE, MAX_SECONDS_MINUTES),
    },
    [NAME_HOUR]: {
        [TYPE_EVERY]: (opts: CronPartOptions) =>
            CronUtils.generateTimePartExpression(opts, PART_HOUR, MAX_HOUR),
        [TYPE_INTERVAL]: (opts: CronPartOptions) =>
            CronUtils.generateTimePartExpression(opts, PART_HOUR, MAX_HOUR),
        [TYPE_BETWEEN]: (opts: CronPartOptions) =>
            CronUtils.generateTimePartExpression(opts, PART_HOUR, MAX_HOUR),
        [TYPE_SPECIFIC]: (opts: CronPartOptions) =>
            CronUtils.generateTimePartExpression(opts, PART_HOUR, MAX_HOUR),
        [TYPE_RANGES]: (opts: CronPartOptions) =>
            CronUtils.generateTimePartExpression(opts, PART_HOUR, MAX_HOUR),
        [TYPE_INTERVAL_BETWEEN]: (opts: CronPartOptions) =>
            CronUtils.generateTimePartExpression(opts, PART_HOUR, MAX_HOUR),
    },
    [NAME_DAY_OF_MONTH]: {
        [TYPE_EVERY]: (opts: CronPartOptions) =>
            CronUtils.generateNumericExpression(opts, PART_DAY, MIN_ONE, MAX_DAYS_OF_MONTH, 1),
        [TYPE_INTERVAL]: (opts: CronPartOptions) =>
            CronUtils.generateNumericExpression(opts, PART_DAY, MIN_ONE, MAX_DAYS_OF_MONTH, 1),
        [TYPE_BETWEEN]: (opts: CronPartOptions) =>
            CronUtils.generateNumericExpression(opts, PART_DAY, MIN_ONE, MAX_DAYS_OF_MONTH, 1),
        [TYPE_SPECIFIC]: (opts: CronPartOptions) =>
            CronUtils.generateNumericExpression(opts, PART_DAY, MIN_ONE, MAX_DAYS_OF_MONTH, 1),
        [TYPE_RANGES]: (opts: { specificValues: string; }) => {
            if (isAnyNilOrEmpty(opts.specificValues)) {
                throw new CronError('Range values are required for ranges type');
            }

            return CronUtils.parseRanges(opts.specificValues, PART_DAY, MIN_ONE, MAX_DAYS_OF_MONTH);
        },
        [TYPE_LAST]: (opts: { lastValue: number; }) => {
            if (opts.lastValue === undefined || opts.lastValue === 0) {
                return 'L';
            }

            CronUtils.validateRange(opts.lastValue, PART_LAST_DAY_OFFSET, MIN_ONE, MAX_DAYS_OF_MONTH);

            return `L-${opts.lastValue}`;
        },
        [TYPE_INTERVAL_BETWEEN]: (opts: CronPartOptions) =>
            CronUtils.generateIntervalBetweenExpression(opts, PART_DAY, MIN_ONE, MAX_DAYS_OF_MONTH),
    },
    [NAME_MONTH]: {
        [TYPE_EVERY]: (opts: CronPartOptions) =>
            CronUtils.generateNumericExpression(opts, PART_MONTH, MIN_ONE, MAX_MONTHS, 1),
        [TYPE_INTERVAL]: (opts: CronPartOptions) =>
            CronUtils.generateNumericExpression(opts, PART_MONTH, MIN_ONE, MAX_MONTHS, 1),
        [TYPE_SPECIFIC]: (opts: CronPartOptions) =>
            CronUtils.parseSpecificTextValues(opts, PART_MONTH, MONTHS, monthOrder),
        [TYPE_BETWEEN]: (opts: CronPartOptions) =>
            CronUtils.generateTextRangeExpression(opts, PART_MONTH, MONTHS),
    },
    [NAME_DAY_OF_WEEK]: {
        [TYPE_EVERY]: (opts: CronPartOptions) =>
            CronUtils.generateNumericExpression(opts, PART_DAY_OF_WEEK, MIN_ONE, MAX_DAYS_OF_WEEK),
        [TYPE_INTERVAL]: (opts: CronPartOptions) =>
            CronUtils.generateNumericExpression(opts, PART_DAY_OF_WEEK, MIN_ONE, MAX_DAYS_OF_WEEK),
        [TYPE_BETWEEN]: (opts: CronPartOptions) =>
            CronUtils.generateTextRangeExpression(opts, PART_DAY_OF_WEEK, WEEK_DAYS),
        [TYPE_SPECIFIC]: (opts: CronPartOptions) =>
            CronUtils.parseSpecificTextValues(opts, PART_DAY_OF_WEEK, WEEK_DAYS, dayOrder),
        [TYPE_NTH]: (opts: { weekday: string; nthOccurrence: string; }) => {
            if (isAnyNilOrEmpty(opts.weekday, opts.nthOccurrence)) {
                throw new CronError('Weekday and nth occurrence are required for nth type');
            }

            if (!WEEK_DAYS.includes(opts.weekday)) {
                throw new CronError(`Invalid weekday: ${opts.weekday}. Must be one of ${WEEK_DAYS.join(SPACED_COMMA)}`);
            }

            if (!NTH_OCCURRENCES.includes(opts.nthOccurrence)) {
                throw new CronError(`Invalid nth occurrence: ${opts.nthOccurrence}. Must be one of ${NTH_OCCURRENCES.join(SPACED_COMMA)}`);
            }

            return `${opts.weekday}#${opts.nthOccurrence}`;
        },
        [TYPE_LAST_WEEKDAY]: (opts: { lastWeekday: string; }) => {
            if (isAnyNilOrEmpty(opts.lastWeekday)) {
                throw new CronError('Weekday is required for last weekday type');
            }

            return CronUtils.validateLastWeekday(opts.lastWeekday);
        },
    }
};