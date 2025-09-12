import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {CronUtils, getInitialStateFromUrl, isAnyNilOrEmpty, updateUrlParams} from "./CronUtils";
import styles from "./SpringCronGenerator.module.css";
import clsx from "clsx";

export const WEEK_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const MONTH_JAN = 'JAN';
export const MONTH_FEB = 'FEB';

export const MONTHS = [MONTH_JAN, MONTH_FEB, 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export const NTH_OCCURRENCES = ['1', '2', '3', '4', '5'];

export const EVERY_EXPRESSION = '*';

export const NAME_SECOND = 'second';
export const NAME_MINUTE = 'minute';
export const NAME_HOUR = 'hour';
export const NAME_DAY_OF_MONTH = 'day';
export const NAME_MONTH = 'month';
export const NAME_DAY_OF_WEEK = 'day of week';

export const TEXT_EMPTY = '';
export const TEXT_ONE = '1';

export const TYPE_SPECIFIC = 'specific';
export const TYPE_INTERVAL = 'interval';
export const TYPE_BETWEEN = 'between';
export const TYPE_RANGES = 'ranges';
export const TYPE_NTH = 'nth';
export const TYPE_EVERY = 'every';
export const TYPE_LAST = 'last';
export const TYPE_LAST_WEEKDAY = 'lastWeekday';

export const WEEKDAY_MON = 'MON';
export const WEEKDAY_SUN = 'SUN';

export const CASE_EVERY = 'every';
export const CASE_INTERVAL = 'interval';
export const CASE_BETWEEN = 'between';
export const CASE_SPECIFIC = 'specific';
export const CASE_RANGES = 'ranges';
export const CASE_LAST_DAY = 'last';
export const CASE_NTH = 'nth';
export const CASE_LAST_WEEKDAY = 'lastWeekday';

export const MAX_MONTHS = 12;
export const MAX_DAYS_OF_WEEK = 7;
export const MAX_DAYS_OF_MONTH = 31;
export const MIN_ONE = 1;

export const PART_SECOND = 'Second';
export const PART_MINUTE = 'Minute';
export const PART_HOUR = 'Hour'

export const PART_DAY = 'Day';
export const PART_MONTH = 'Month';
export const PART_DAY_OF_WEEK = 'Day of Week';
export const PART_LAST_DAY_OFFSET = 'Last day offset';

export const SPACED_COMMA = ', ';
export const COMMA_DELIMITER = ',';
export const HYPHEN_DELIMITER = '-';

export const FROM_VALUE_INPUT_FIELD = 'fromValue';
export const TO_VALUE_INPUT_FIELD = 'toValue';
export const INTERVAL_INPUT_FIELD = 'intervalValue';
export const SPECIFIC_VALUE_INPUT_FIELD = 'specificValues';
export const WEEKDAY_INPUT_FIELD = 'weekday';
export const NTH_OCCURRENCE_INPUT_FIELD = 'nthOccurrence';
export const LAST_INPUT_FIELD = 'lastValue';
export const LAST_WEEKDAY_INPUT_FIELD = 'lastWeekday';

export const REGEX_SPECIFIC = /^[\d\s,]+$/;
export const REGEX_WHITESPACES = /\s+/g;
export const REGEX_RANGES = /^[\d\s,-]+$/;

export const DEFAULT_RADIX = 10;

export const monthOrder = Object.fromEntries(
    MONTHS.map((month, index) => [month, index + 1])
) as Record<string, number>;

export const weekdayOrder = Object.fromEntries(
    WEEK_DAYS.map((day, index) => [day, index])
) as Record<string, number>;

export const dayOrder = WEEK_DAYS.reduce((acc, day, index) => ({...acc, [day]: index}), {} as Record<string, number>);

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
    type: 'every' | 'interval' | 'between' | 'specific' | 'ranges' | 'nth' | 'last' | 'lastWeekday';
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

export type OptionType = typeof TYPE_EVERY | typeof TYPE_INTERVAL | typeof TYPE_BETWEEN |
    typeof TYPE_SPECIFIC | typeof TYPE_RANGES | typeof TYPE_NTH | typeof TYPE_LAST | typeof TYPE_LAST_WEEKDAY;

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
    const isSecond = name === NAME_SECOND;
    const isMinute = name === NAME_MINUTE;
    const isHour = name === NAME_HOUR;
    const isDay = name === NAME_DAY_OF_MONTH;
    const isMonth = name === NAME_MONTH;
    const isWeekday = name === NAME_DAY_OF_WEEK;
    const isSecondOrMinuteOrHour = isSecond || isMinute || isHour;
    const isSecondOrMinuteOrHourOrDay = isSecond || isMinute || isHour || isDay;

    const urlConfig: UrlParamConfig = useMemo(() => ({
        optionParam: isSecond ? 's' : isMinute ? 'm' : isHour ? 'h' : isDay ? 'dm' : isMonth ? 'mm' : isWeekday ? 'dw' : '',
        argParams: isSecond ? ['a0', 'b0'] : isMinute ? ['a1', 'b1'] : isHour ? ['a2', 'b2'] : isDay ? ['a3', 'b3'] : isMonth ? ['a4', 'b4'] : isWeekday ? ['a5', 'b5'] : [],
        validOptions: isDay
            ? [TYPE_EVERY, TYPE_INTERVAL, TYPE_BETWEEN, TYPE_SPECIFIC, TYPE_RANGES, TYPE_LAST]
            : isWeekday
                ? [TYPE_EVERY, TYPE_INTERVAL, TYPE_BETWEEN, TYPE_SPECIFIC, TYPE_NTH, TYPE_LAST_WEEKDAY]
                : isSecondOrMinuteOrHour ? [TYPE_EVERY, TYPE_INTERVAL, TYPE_BETWEEN, TYPE_SPECIFIC, TYPE_RANGES]
                    : [TYPE_EVERY, TYPE_INTERVAL, TYPE_BETWEEN, TYPE_SPECIFIC],
        maxVal: isMonth ? 12 : isWeekday ? 7 : isSecond || isMinute ? 59 : isHour ? 23 : 31
    }), [isSecond, isMinute, isHour, isDay, isMonth, isWeekday]);

    const [state, setState] = useState<CronPartState>(() =>
        getInitialStateFromUrl(name, isSecondOrMinuteOrHourOrDay, isMonth, isWeekday, urlConfig)
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

    const {minVal, maxVal} = useMemo(() => ({
        minVal: isDay ? 1 : 0,
        maxVal: isDay ? 31 : (isHour ? 23 : 59)
    }), [isDay, isHour]);

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

            if (isSecondOrMinuteOrHourOrDay) {
                return {
                    ...baseState,
                    intervalValue: newOption === TYPE_INTERVAL ? TEXT_ONE : TEXT_EMPTY,
                    fromValue: newOption === TYPE_BETWEEN ? TEXT_ONE : TEXT_EMPTY,
                    toValue: newOption === TYPE_BETWEEN ? '2' : TEXT_EMPTY,
                    specificValues: newOption === TYPE_SPECIFIC ? '1,2,3' :
                        newOption === TYPE_RANGES ? (isHour ? '1-2,3-4' : isSecondOrMinuteOrHour ? '0-10,15-25' : '1-5,10-15') : TEXT_EMPTY,
                    lastValue: newOption === TYPE_LAST ? TEXT_EMPTY : TEXT_EMPTY
                };
            }

            if (isMonth) {
                return {
                    ...baseState,
                    intervalValue: newOption === TYPE_INTERVAL ? TEXT_ONE : TEXT_EMPTY,
                    fromValue: newOption === TYPE_BETWEEN ? MONTH_JAN : TEXT_EMPTY,
                    toValue: newOption === TYPE_BETWEEN ? MONTH_FEB : TEXT_EMPTY,
                    selectedMonths: newOption === TYPE_SPECIFIC ? [MONTH_JAN] : []
                };
            }

            if (isWeekday) {
                return {
                    ...baseState,
                    intervalValue: newOption === TYPE_INTERVAL ? TEXT_ONE : TEXT_EMPTY,
                    fromValue: newOption === TYPE_BETWEEN ? WEEKDAY_SUN : TEXT_EMPTY,
                    toValue: newOption === TYPE_BETWEEN ? WEEKDAY_MON : TEXT_EMPTY,
                    selectedWeekdays: newOption === TYPE_SPECIFIC ? [WEEKDAY_MON] : [],
                    weekday: WEEKDAY_MON,
                    nthOccurrence: TEXT_ONE,
                    lastWeekday: WEEKDAY_MON
                };
            }

            return baseState;
        });
    }, [isSecondOrMinuteOrHourOrDay, isMonth, isWeekday]);

    const createInputHandler = useCallback((field: keyof CronPartState) =>
        (value: string) => {
            setState(prev => ({...prev, [field]: value}));
        }, []
    );

    useEffect(() => {
        let expression = EVERY_EXPRESSION;
        let newError = TEXT_EMPTY;

        try {
            if (name === NAME_MONTH && state.option === TYPE_SPECIFIC && sortedSelectedMonths.length === 0) {
                newError = 'At least one month must be selected';
            } else if (name === NAME_DAY_OF_WEEK && state.option === TYPE_SPECIFIC && sortedSelectedWeekdays.length === 0) {
                newError = 'At least one day of week must be selected';
            } else {
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

                if (name === NAME_MONTH && sortedSelectedMonths.length > 0) {
                    options.specificValues = sortedSelectedMonths.join(',');
                } else if (name === NAME_DAY_OF_WEEK && sortedSelectedWeekdays.length > 0) {
                    options.specificValues = sortedSelectedWeekdays.join(',');
                }

                const expressionGenerators = {
                    [NAME_SECOND]: () => CronUtils.generateSecondExpression(options),
                    [NAME_MINUTE]: () => CronUtils.generateMinuteExpression(options),
                    [NAME_HOUR]: () => CronUtils.generateHourExpression(options),
                    [NAME_DAY_OF_MONTH]: () => CronUtils.generateDayOfMonthExpression(options),
                    [NAME_MONTH]: () => CronUtils.generateMonthExpression(options),
                    [NAME_DAY_OF_WEEK]: () => CronUtils.generateDayOfWeekExpression(options)
                };

                const generator = expressionGenerators[name as keyof typeof expressionGenerators];
                if (generator) {
                    expression = generator();
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
        min: number = minVal,
        max: number = maxVal
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
                    <option value={TYPE_BETWEEN}>From ... to ... {name}</option>
                    <option value={TYPE_SPECIFIC}>Specific {plural}</option>
                    {(isSecondOrMinuteOrHour || isDay) && (
                        <option value={TYPE_RANGES}>Multiple ranges</option>
                    )}
                    {isDay && (
                        <option value={TYPE_LAST}>N-to-last day of month</option>
                    )}
                    {isWeekday && (
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
                            1,
                            isMonth ? 12 : (isWeekday ? 7 : maxVal)
                        )}
                    </div>
                </fieldset>
            )}

            {state.option === TYPE_BETWEEN && (
                <div className={styles.betweenContainer}>
                    <fieldset className={styles.subFieldset}>
                        <legend>From</legend>
                        <div className={styles.inputContainer}>
                            {isMonth || isWeekday ? (
                                renderDropdown(
                                    state.fromValue,
                                    createInputHandler(FROM_VALUE_INPUT_FIELD),
                                    isMonth ? MONTHS : WEEK_DAYS,
                                )
                            ) : (
                                renderNumberInput(
                                    state.fromValue,
                                    createInputHandler(FROM_VALUE_INPUT_FIELD),
                                    `From ${name}`
                                )
                            )}
                        </div>
                    </fieldset>
                    <fieldset className={styles.subFieldset}>
                        <legend>To</legend>
                        <div className={styles.inputContainer}>
                            {isMonth || isWeekday ? (
                                renderDropdown(
                                    state.toValue,
                                    createInputHandler(TO_VALUE_INPUT_FIELD),
                                    isMonth ? MONTHS : WEEK_DAYS,
                                )
                            ) : (
                                renderNumberInput(
                                    state.toValue,
                                    createInputHandler(TO_VALUE_INPUT_FIELD),
                                    `To ${name}`
                                )
                            )}
                        </div>
                    </fieldset>
                </div>
            )}

            {state.option === TYPE_SPECIFIC && (
                <fieldset className={styles.subFieldset}>
                    <legend>{plural.charAt(0).toUpperCase() + plural.slice(1)}</legend>
                    <div className={clsx({
                        [styles.specificContainer]: isMonth || isWeekday,
                        [styles.specificContainerTextInput]: !(isMonth || isWeekday)
                    })}>
                        {isMonth ? (
                            MONTHS.map(month => (
                                <label key={month} className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={state.selectedMonths.includes(month)}
                                        onChange={() => handleMonthChange(month)}
                                    />
                                    {month}
                                </label>
                            ))
                        ) : isWeekday ? (
                            WEEK_DAYS.map(day => (
                                <label key={day} className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={state.selectedWeekdays.includes(day)}
                                        onChange={() => handleWeekdayChange(day)}
                                    />
                                    {day}
                                </label>
                            ))
                        ) : (
                            <input
                                type="text"
                                value={state.specificValues}
                                onChange={(e: {
                                    target: { value: string; };
                                }) => createInputHandler(SPECIFIC_VALUE_INPUT_FIELD)(e.target.value)}
                                placeholder={`e.g., ${isHour ? '0,1,2' : (isDay ? '1,2,3' : '0,15,30')}`}
                                pattern="^(\d+)(,\d+)*$"
                                title="Comma-separated numbers only"
                                className={styles.textInput}
                            />
                        )}
                    </div>
                </fieldset>
            )}

            {state.option === TYPE_RANGES && (isSecondOrMinuteOrHour || isDay) && (
                <div className={styles.inputContainer}>
                    <fieldset className={styles.inputGroup}>
                        <legend>Ranges (separated by comma)</legend>
                        <input
                            type="text"
                            value={state.specificValues}
                            onChange={(e: {
                                target: { value: string; };
                            }) => createInputHandler(SPECIFIC_VALUE_INPUT_FIELD)(e.target.value)}
                            placeholder={isHour ? "e.g., 1-2,3-4" : isSecondOrMinuteOrHour ? "e.g., 0-10,15-25" : "e.g., 1-10,12-14,22-25"}
                            pattern="^(\d+-\d+)(,\d+-\d+)*$"
                            title="Comma-separated ranges (e.g., 1-10,12-14)"
                            className={styles.textInput}
                        />
                    </fieldset>
                </div>
            )}

            {state.option === TYPE_NTH && isWeekday && (
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

            {state.option === TYPE_LAST && name === NAME_DAY_OF_MONTH && (
                <fieldset className={styles.subFieldset}>
                    <legend>N-to-last day of month</legend>
                    <div className={styles.inputContainer}>
                        {renderNumberInput(
                            state.lastValue,
                            createInputHandler(LAST_INPUT_FIELD),
                            "Enter days from last day (optional, e.g., 1 for L-1)",
                            1,
                            31
                        )}
                    </div>
                </fieldset>
            )}

            {state.option === TYPE_LAST_WEEKDAY && isWeekday && (
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