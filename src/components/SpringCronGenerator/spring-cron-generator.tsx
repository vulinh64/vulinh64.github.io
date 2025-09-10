import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import styles from './SpringCronGenerator.module.css';
import clsx from 'clsx';
import {CronError, CronPartOptions, CronUtils, monthOrder, weekdayOrder} from './CronUtils';
import {
    CronExpressions,
    CronPartProps,
    CronPartState,
    EVERY_EXPRESSION,
    MONTHS,
    NAME_DAY_OF_MONTH,
    NAME_DAY_OF_WEEK,
    NAME_HOUR,
    NAME_MINUTE,
    NAME_MONTH,
    NAME_SECOND,
    NTH_OCCURRENCES,
    OptionType,
    TEXT_EMPTY,
    TEXT_ONE,
    TYPE_BETWEEN,
    TYPE_EVERY,
    TYPE_INTERVAL,
    TYPE_NTH,
    TYPE_RANGES,
    TYPE_SPECIFIC,
    WEEK_DAYS,
    WEEKDAY_MON,
    WEEKDAY_SUN
} from './CronSupport';

const CronPart: React.FC<CronPartProps> = ({name, plural, onExpressionChange}) => {
    // Type guards for better readability
    const isSecond = name === NAME_SECOND;
    const isMinute = name === NAME_MINUTE;
    const isHour = name === NAME_HOUR;
    const isDay = name === NAME_DAY_OF_MONTH;
    const isMonth = name === NAME_MONTH;
    const isWeekday = name === NAME_DAY_OF_WEEK;
    const isSecondOrMinuteOrHourOrDay = isSecond || isMinute || isHour || isDay;

    // Initial state factory
    const createInitialState = (): CronPartState => ({
        option: TYPE_EVERY,
        selectedMonths: [],
        selectedWeekdays: [],
        intervalValue: isSecondOrMinuteOrHourOrDay ? TEXT_ONE : TEXT_EMPTY,
        fromValue: isSecondOrMinuteOrHourOrDay ? TEXT_ONE : (isWeekday ? WEEKDAY_SUN : TEXT_EMPTY),
        toValue: isSecondOrMinuteOrHourOrDay ? '2' : (isWeekday ? WEEKDAY_MON : TEXT_EMPTY),
        specificValues: isSecondOrMinuteOrHourOrDay ? '1,2,3' : TEXT_EMPTY,
        weekday: WEEKDAY_MON,
        nthOccurrence: TEXT_ONE,
        error: TEXT_EMPTY
    });

    const [state, setState] = useState<CronPartState>(createInitialState);
    const prevExpressionRef = useRef<string>(EVERY_EXPRESSION);
    const prevErrorRef = useRef<string>(TEXT_EMPTY);

    // Memoized sorted arrays
    const sortedSelectedMonths = useMemo(
        () => [...state.selectedMonths].sort((a, b) => monthOrder[a] - monthOrder[b]),
        [state.selectedMonths]
    );

    const sortedSelectedWeekdays = useMemo(
        () => [...state.selectedWeekdays].sort((a, b) => weekdayOrder[a] - weekdayOrder[b]),
        [state.selectedWeekdays]
    );

    // Memoized min/max values
    const {minVal, maxVal} = useMemo(() => ({
        minVal: isDay ? 1 : 0,
        maxVal: isDay ? 31 : (isHour ? 23 : 59)
    }), [isDay, isHour]);

    // Event handlers with useCallback for optimization
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

    // Option change handler with cleaner state updates
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
                        newOption === TYPE_RANGES ? '1-5,10-15' : TEXT_EMPTY
                };
            }

            if (isMonth) {
                return {
                    ...baseState,
                    intervalValue: newOption === TYPE_INTERVAL ? TEXT_ONE : TEXT_EMPTY,
                    fromValue: newOption === TYPE_BETWEEN ? TEXT_ONE : TEXT_EMPTY,
                    toValue: newOption === TYPE_BETWEEN ? '2' : TEXT_EMPTY,
                    selectedMonths: newOption === TYPE_SPECIFIC ? ['JAN'] : []
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
                    nthOccurrence: TEXT_ONE
                };
            }

            return baseState;
        });
    }, [isSecondOrMinuteOrHourOrDay, isMonth, isWeekday]);

    // Generic input change handler
    const createInputHandler = useCallback((field: keyof CronPartState) =>
        (value: string) => {
            setState(prev => ({...prev, [field]: value}));
        }, []
    );

    // Expression generation effect
    useEffect(() => {
        let expression = EVERY_EXPRESSION;
        let newError = TEXT_EMPTY;

        try {
            // Validation
            if (name === NAME_MONTH && state.option === TYPE_SPECIFIC && sortedSelectedMonths.length === 0) {
                newError = 'At least one month must be selected';
            } else if (name === NAME_DAY_OF_WEEK && state.option === TYPE_SPECIFIC && sortedSelectedWeekdays.length === 0) {
                newError = 'At least one day of week must be selected';
            } else {
                const options: CronPartOptions = {
                    type: state.option as any,
                    intervalValue: state.intervalValue ? parseInt(state.intervalValue, 10) : undefined,
                    fromValue: state.fromValue || undefined,
                    toValue: state.toValue || undefined,
                    specificValues: state.specificValues || undefined,
                    weekday: state.weekday || undefined,
                    nthOccurrence: state.nthOccurrence || undefined
                };

                // Set specific values for months and weekdays
                if (name === NAME_MONTH && sortedSelectedMonths.length > 0) {
                    options.specificValues = sortedSelectedMonths.join(',');
                } else if (name === NAME_DAY_OF_WEEK && sortedSelectedWeekdays.length > 0) {
                    options.specificValues = sortedSelectedWeekdays.join(',');
                }

                // Generate expression based on name
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

            // Update expression only if changed
            if (expression !== prevExpressionRef.current) {
                prevExpressionRef.current = expression;
                onExpressionChange(expression);
            }
        } catch (err) {
            if (err instanceof CronError) {
                newError = err.message;
                if (prevExpressionRef.current !== EVERY_EXPRESSION) {
                    prevExpressionRef.current = EVERY_EXPRESSION;
                    onExpressionChange(EVERY_EXPRESSION);
                }
            }
        }

        // Update error only if changed
        if (newError !== prevErrorRef.current) {
            prevErrorRef.current = newError;
            setState(prev => ({...prev, error: newError}));
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
        onExpressionChange
    ]);

    // Render helper for number inputs
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
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className={styles.numberInput}
        />
    );

    // Render helper for dropdowns
    const renderDropdown = (
        value: string,
        onChange: (value: string) => void,
        options: readonly string[],
        isMonth: boolean = false,
        className?: string
    ) => (
        <select
            className={clsx(styles.dropdown, className)}
            value={value}
            onChange={e => onChange(e.target.value)}
        >
            {options.map(item => (
                <option
                    key={item}
                    value={isMonth ? MONTHS.indexOf(item) + 1 : item}
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
                    style={{color: 'var(--ifm-color-danger)', marginBottom: '1em'}}
                >
                    {state.error}
                </div>
            )}

            <div className={styles.optionContainer}>
                <label htmlFor={`${name}-option`}>Option:</label>
                <select
                    id={`${name}-option`}
                    value={state.option}
                    onChange={e => handleOptionChange(e.target.value as OptionType)}
                    className={clsx(styles.optionSelect, 'margin-top--md', 'margin-bottom--md')}
                >
                    <option value={TYPE_EVERY}>Every {name}</option>
                    <option value={TYPE_INTERVAL}>Every N {name}</option>
                    <option value={TYPE_BETWEEN}>From ... to ... {name}</option>
                    <option value={TYPE_SPECIFIC}>Specific {plural}</option>
                    {name === NAME_DAY_OF_MONTH && (
                        <option value={TYPE_RANGES}>Multiple ranges</option>
                    )}
                    {isWeekday && <option value={TYPE_NTH}>Nth occurrence</option>}
                </select>
            </div>

            {state.option === TYPE_INTERVAL && (
                <fieldset className={styles.subFieldset}>
                    <legend>Interval</legend>
                    <div className={styles.inputContainer}>
                        {renderNumberInput(
                            state.intervalValue,
                            createInputHandler('intervalValue'),
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
                                    createInputHandler('fromValue'),
                                    isMonth ? MONTHS : WEEK_DAYS,
                                    isMonth
                                )
                            ) : (
                                renderNumberInput(
                                    state.fromValue,
                                    createInputHandler('fromValue'),
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
                                    createInputHandler('toValue'),
                                    isMonth ? MONTHS : WEEK_DAYS,
                                    isMonth
                                )
                            ) : (
                                renderNumberInput(
                                    state.toValue,
                                    createInputHandler('toValue'),
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
                                onChange={e => createInputHandler('specificValues')(e.target.value)}
                                placeholder={`e.g., ${isHour ? '0,1,2' : (isDay ? '1,2,3' : '0,15,30')}`}
                                pattern="^(\d+)(,\d+)*$"
                                title="Comma-separated numbers only"
                                className={styles.textInput}
                            />
                        )}
                    </div>
                </fieldset>
            )}

            {state.option === TYPE_RANGES && name === NAME_DAY_OF_MONTH && (
                <div className={styles.inputContainer}>
                    <fieldset className={styles.inputGroup}>
                        <legend>Day ranges (separated by comma)</legend>
                        <input
                            type="text"
                            value={state.specificValues}
                            onChange={e => createInputHandler('specificValues')(e.target.value)}
                            placeholder="e.g., 1-10,12-14,22-25"
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
                                createInputHandler('weekday'),
                                WEEK_DAYS,
                                false,
                                clsx(styles.nthDropdown)
                            )}
                        </div>
                        <div className={styles.dropdownUnit}>
                            <label htmlFor="nth-select">nth occurrence:</label>
                            {renderDropdown(
                                state.nthOccurrence,
                                createInputHandler('nthOccurrence'),
                                NTH_OCCURRENCES,
                                false,
                                clsx(styles.nthDropdown)
                            )}
                        </div>
                    </div>
                </fieldset>
            )}
        </fieldset>
    );
};

const CronGeneratorPage: React.FC = () => {
    const [copied, setCopied] = useState(false);
    const [cronExpressions, setCronExpressions] = useState<CronExpressions>({
        second: EVERY_EXPRESSION,
        minute: EVERY_EXPRESSION,
        hour: EVERY_EXPRESSION,
        dayOfMonth: EVERY_EXPRESSION,
        month: EVERY_EXPRESSION,
        dayOfWeek: EVERY_EXPRESSION
    });

    const cronExpression = useMemo(() =>
            `${cronExpressions.second} ${cronExpressions.minute} ${cronExpressions.hour} ${cronExpressions.dayOfMonth} ${cronExpressions.month} ${cronExpressions.dayOfWeek}`,
        [cronExpressions]
    );

    const handleExpressionChange = useCallback((part: keyof CronExpressions, expression: string) => {
        setCronExpressions(prev => ({
            ...prev,
            [part]: expression
        }));
    }, []);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(cronExpression);
            setCopied(true);
            setTimeout(() => setCopied(false), 1000);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    }, [cronExpression]);

    return (
        <div className={clsx(styles.pageContainer, 'margin-top--xl', 'margin-bottom--md')}>
            <h1 className={clsx(styles.textCenter, 'margin-top--sm', 'margin-bottom--md')}>
                Spring Cron Expression Generator
            </h1>

            <fieldset className={styles.resultContainer}>
                <legend>Result</legend>
                <div className={styles.codeBlockContainer}>
          <pre className={styles.resultCode}>
            <code>{cronExpression}</code>
            <button
                className={clsx(styles.copyButton, {[styles.copied]: copied})}
                onClick={handleCopy}
                aria-label={copied ? 'Copied' : 'Copy'}
                type="button"
            />
          </pre>
                </div>
            </fieldset>

            <CronPart
                name={NAME_SECOND}
                plural="seconds"
                onExpressionChange={(expr: string) => handleExpressionChange(NAME_SECOND, expr)}
            />
            <CronPart
                name={NAME_MINUTE}
                plural="minutes"
                onExpressionChange={(expr: string) => handleExpressionChange(NAME_MINUTE, expr)}
            />
            <CronPart
                name={NAME_HOUR}
                plural="hours"
                onExpressionChange={(expr: string) => handleExpressionChange(NAME_HOUR, expr)}
            />
            <CronPart
                name={NAME_DAY_OF_MONTH}
                plural="days"
                onExpressionChange={(expr: string) => handleExpressionChange('dayOfMonth', expr)}
            />
            <CronPart
                name={NAME_MONTH}
                plural="months"
                onExpressionChange={(expr: string) => handleExpressionChange(NAME_MONTH, expr)}
            />
            <CronPart
                name={NAME_DAY_OF_WEEK}
                plural="days of week"
                onExpressionChange={(expr: string) => handleExpressionChange('dayOfWeek', expr)}
            />
        </div>
    );
};

export default CronGeneratorPage;