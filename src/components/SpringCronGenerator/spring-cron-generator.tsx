import React, {SetStateAction, useEffect, useMemo, useRef, useState} from 'react';
import styles from './SpringCronGenerator.module.css';
import clsx from "clsx";
import {CronError, CronPartOptions, CronUtils} from './CronUtils';
import {
    CronPartProps,
    EVERY_EXPRESSION,
    MONTHS,
    NAME_DAY_OF_MONTH,
    NAME_DAY_OF_WEEK,
    NAME_HOUR,
    NAME_MINUTE,
    NAME_MONTH,
    NAME_SECOND,
    NTH_OCCURRENCES,
    TEXT_EMPTY,
    TEXT_ONE,
    TYPE_BETWEEN,
    TYPE_INTERVAL,
    TYPE_NTH,
    TYPE_RANGES,
    TYPE_SPECIFIC,
    TYPE_EVERY,
    WEEK_DAYS
} from "./CronSupport";

const WEEKDAY_MON = 'MON';
const WEEKDAY_SUN = 'SUN';

// Static order mappings
const monthOrder = MONTHS.reduce((acc, month, index) => ({
    ...acc,
    [month]: index + 1
}), {} as Record<string, number>);

const weekdayOrder = WEEK_DAYS.reduce((acc, day, index) => ({
    ...acc,
    [day]: index
}), {} as Record<string, number>);

const CronPart: React.FC<CronPartProps> = ({name, plural, onExpressionChange}) => {
    const isSecond = name === NAME_SECOND;
    const isMinute = name === NAME_MINUTE;
    const isHour = name === NAME_HOUR;
    const isDay = name === NAME_DAY_OF_MONTH;
    const isMonth = name === NAME_MONTH;
    const isWeekday = name === NAME_DAY_OF_WEEK;
    const isSecondOrMinuteOrHourOrDay = isSecond || isMinute || isHour || isDay;
    const [option, setOption] = useState(TYPE_EVERY);
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
    const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([]);
    const [intervalValue, setIntervalValue] = useState(isSecondOrMinuteOrHourOrDay ? TEXT_ONE : TEXT_EMPTY);
    const [fromValue, setFromValue] = useState(isSecondOrMinuteOrHourOrDay ? TEXT_ONE : (isWeekday ? WEEKDAY_SUN : TEXT_EMPTY));
    const [toValue, setToValue] = useState(isSecondOrMinuteOrHourOrDay ? '2' : (isWeekday ? WEEKDAY_MON : TEXT_EMPTY));
    const [specificValues, setSpecificValues] = useState(isSecondOrMinuteOrHourOrDay ? '1,2,3' : TEXT_EMPTY);
    const [weekday, setWeekday] = useState(WEEKDAY_MON);
    const [nthOccurrence, setNthOccurrence] = useState(TEXT_ONE);
    const [error, setError] = useState<string>(TEXT_EMPTY);
    const prevExpressionRef = useRef<string>(EVERY_EXPRESSION);

    // Memoize sorted arrays to prevent recreation on every render
    const sortedSelectedMonths = useMemo(
        () => [...selectedMonths].sort((a, b) => monthOrder[a] - monthOrder[b]),
        [selectedMonths]
    );
    const sortedSelectedWeekdays = useMemo(
        () => [...selectedWeekdays].sort((a, b) => weekdayOrder[a] - weekdayOrder[b]),
        [selectedWeekdays]
    );

    const handleMonthChange = (month: string) => {
        setSelectedMonths((prev) =>
            prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
        );
    };

    const handleWeekdayChange = (weekday: string) => {
        setSelectedWeekdays((prev) =>
            prev.includes(weekday) ? prev.filter((w) => w !== weekday) : [...prev, weekday]
        );
    };

    const handleOptionChange = (newOption: string) => {
        setOption(newOption);
        if (isSecondOrMinuteOrHourOrDay) {
            if (newOption === TYPE_INTERVAL) {
                setIntervalValue(TEXT_ONE);
                setFromValue(TEXT_EMPTY);
                setToValue(TEXT_EMPTY);
                setSpecificValues(TEXT_EMPTY);
            } else if (newOption === TYPE_BETWEEN) {
                setIntervalValue(TEXT_EMPTY);
                setFromValue(TEXT_ONE);
                setToValue('2');
                setSpecificValues(TEXT_EMPTY);
            } else if (newOption === TYPE_SPECIFIC) {
                setIntervalValue(TEXT_EMPTY);
                setFromValue(TEXT_EMPTY);
                setToValue(TEXT_EMPTY);
                setSpecificValues('1,2,3');
            } else if (newOption === TYPE_RANGES) {
                setIntervalValue(TEXT_EMPTY);
                setFromValue(TEXT_EMPTY);
                setToValue(TEXT_EMPTY);
                setSpecificValues('1-5,10-15');
            } else {
                setIntervalValue(TEXT_EMPTY);
                setFromValue(TEXT_EMPTY);
                setToValue(TEXT_EMPTY);
                setSpecificValues(TEXT_EMPTY);
            }
        } else if (isMonth) {
            if (newOption === TYPE_INTERVAL) {
                setIntervalValue(TEXT_ONE);
                setFromValue(TEXT_EMPTY);
                setToValue(TEXT_EMPTY);
                setSelectedMonths([]);
            } else if (newOption === TYPE_BETWEEN) {
                setIntervalValue(TEXT_EMPTY);
                setFromValue(TEXT_ONE);
                setToValue('2');
                setSelectedMonths([]);
            } else if (newOption === TYPE_SPECIFIC) {
                setIntervalValue(TEXT_EMPTY);
                setFromValue(TEXT_EMPTY);
                setToValue(TEXT_EMPTY);
                setSelectedMonths(['JAN']);
            } else {
                setIntervalValue(TEXT_EMPTY);
                setFromValue(TEXT_EMPTY);
                setToValue(TEXT_EMPTY);
                setSelectedMonths([]);
            }
        } else if (isWeekday) {
            if (newOption === TYPE_INTERVAL) {
                setIntervalValue(TEXT_ONE);
                setFromValue(TEXT_EMPTY);
                setToValue(TEXT_EMPTY);
                setSelectedWeekdays([]);
                setWeekday(WEEKDAY_MON);
                setNthOccurrence(TEXT_ONE);
            } else if (newOption === TYPE_BETWEEN) {
                setIntervalValue(TEXT_EMPTY);
                setFromValue(WEEKDAY_SUN);
                setToValue(WEEKDAY_MON);
                setSelectedWeekdays([]);
                setWeekday(WEEKDAY_MON);
                setNthOccurrence(TEXT_ONE);
            } else if (newOption === TYPE_SPECIFIC) {
                setIntervalValue(TEXT_EMPTY);
                setFromValue(TEXT_EMPTY);
                setToValue(TEXT_EMPTY);
                setSelectedWeekdays([WEEKDAY_MON]);
                setWeekday(WEEKDAY_MON);
                setNthOccurrence(TEXT_ONE);
            } else if (newOption === TYPE_NTH) {
                setIntervalValue(TEXT_EMPTY);
                setFromValue(TEXT_EMPTY);
                setToValue(TEXT_EMPTY);
                setSelectedWeekdays([]);
                setWeekday(WEEKDAY_MON);
                setNthOccurrence(TEXT_ONE);
            } else {
                setIntervalValue(TEXT_EMPTY);
                setFromValue(TEXT_EMPTY);
                setToValue(TEXT_EMPTY);
                setSelectedWeekdays([]);
                setWeekday(WEEKDAY_MON);
                setNthOccurrence(TEXT_ONE);
            }
        }
    };

    // Generate cron expression
    useEffect(() => {
        let expression = EVERY_EXPRESSION;
        try {
            if (name === NAME_SECOND) {
                const options: CronPartOptions = {
                    type: option as any,
                    intervalValue: intervalValue ? parseInt(intervalValue) : undefined,
                    fromValue: fromValue ? parseInt(fromValue) : undefined,
                    toValue: toValue ? parseInt(toValue) : undefined,
                    specificValues: specificValues || undefined
                };
                expression = CronUtils.generateSecondExpression(options);
            } else if (name === NAME_MINUTE) {
                const options: CronPartOptions = {
                    type: option as any,
                    intervalValue: intervalValue ? parseInt(intervalValue) : undefined,
                    fromValue: fromValue ? parseInt(fromValue) : undefined,
                    toValue: toValue ? parseInt(toValue) : undefined,
                    specificValues: specificValues || undefined
                };
                expression = CronUtils.generateMinuteExpression(options);
            } else if (name === NAME_HOUR) {
                const options: CronPartOptions = {
                    type: option as any,
                    intervalValue: intervalValue ? parseInt(intervalValue) : undefined,
                    fromValue: fromValue ? parseInt(fromValue) : undefined,
                    toValue: toValue ? parseInt(toValue) : undefined,
                    specificValues: specificValues || undefined
                };
                expression = CronUtils.generateHourExpression(options);
            } else if (name === NAME_DAY_OF_MONTH) {
                const options: CronPartOptions = {
                    type: option as any,
                    intervalValue: intervalValue ? parseInt(intervalValue) : undefined,
                    fromValue: fromValue ? parseInt(fromValue) : undefined,
                    toValue: toValue ? parseInt(toValue) : undefined,
                    specificValues: specificValues || undefined
                };
                expression = CronUtils.generateDayOfMonthExpression(options);
            } else if (name === NAME_MONTH) {
                const options: CronPartOptions = {
                    type: option as any,
                    intervalValue: intervalValue ? parseInt(intervalValue) : undefined,
                    fromValue: fromValue ? parseInt(fromValue) : undefined,
                    toValue: toValue ? parseInt(toValue) : undefined,
                    specificValues: sortedSelectedMonths.length > 0 ? sortedSelectedMonths.join(',') : undefined
                };
                expression = CronUtils.generateMonthExpression(options);
            } else if (name === NAME_DAY_OF_WEEK) {
                const options: CronPartOptions = {
                    type: option as any,
                    intervalValue: intervalValue ? parseInt(intervalValue) : undefined,
                    fromValue: fromValue || undefined,
                    toValue: toValue || undefined,
                    specificValues: sortedSelectedWeekdays.length > 0 ? sortedSelectedWeekdays.join(',') : undefined,
                    weekday: weekday || undefined,
                    nthOccurrence: nthOccurrence || undefined
                };
                expression = CronUtils.generateDayOfWeekExpression(options);
            }

            // Only update if expression has changed
            if (expression !== prevExpressionRef.current) {
                prevExpressionRef.current = expression;
                onExpressionChange(expression);
            }
        } catch (err) {
            if (err instanceof CronError) {
                if (err.message !== error) {
                    setError(err.message);
                }
                if (prevExpressionRef.current !== EVERY_EXPRESSION) {
                    prevExpressionRef.current = EVERY_EXPRESSION;
                    onExpressionChange(EVERY_EXPRESSION);
                }
            }
        }
    }, [name, option, intervalValue, fromValue, toValue, specificValues, sortedSelectedMonths, sortedSelectedWeekdays, weekday, nthOccurrence, onExpressionChange, error]);

    // Separate effect for validation errors
    useEffect(() => {
        if (name === NAME_MONTH && option === TYPE_SPECIFIC && sortedSelectedMonths.length === 0) {
            setError('At least one month must be selected');
        } else if (name === NAME_DAY_OF_WEEK && option === TYPE_SPECIFIC && sortedSelectedWeekdays.length === 0) {
            setError('At least one day of week must be selected');
        } else if (error !== TEXT_EMPTY) {
            setError(TEXT_EMPTY);
        }
    }, [name, option, sortedSelectedMonths, sortedSelectedWeekdays, error]);

    const minVal = (name === NAME_DAY_OF_MONTH) ? 1 : 0;
    const maxVal = (name === NAME_DAY_OF_MONTH) ? 31 : (isHour ? 23 : 59);

    return (
        <fieldset className={styles.cronPart}>
            <legend>{name.charAt(0).toUpperCase() + name.slice(1)} Expression</legend>
            {error && <div className={styles.errorMessage}
                           style={{color: 'var(--ifm-color-danger)', marginBottom: '1em'}}>{error}</div>}

            <div className={styles.optionContainer}>
                <label htmlFor={`${name}-option`}>Option:</label>
                <select
                    id={`${name}-option`}
                    value={option}
                    onChange={(expr: { target: { value: string; }; }) => handleOptionChange(expr.target.value)}
                    className={clsx(styles.optionSelect, "margin-top--md", "margin-bottom--md")}
                >
                    <option value="every">Every {name}</option>
                    <option value="interval">Every N {name}</option>
                    <option value="between">From ... to ... {name}</option>
                    <option value="specific">Specific {plural}</option>
                    {name === NAME_DAY_OF_MONTH && <option value="ranges">Multiple ranges</option>}
                    {isWeekday && <option value="nth">Nth occurrence</option>}
                </select>
            </div>

            {option === TYPE_INTERVAL && (
                <fieldset className={styles.subFieldset}>
                    <legend>Interval</legend>
                    <div className={styles.inputContainer}>
                        <input
                            type="number"
                            min="1"
                            max={isMonth ? 12 : (isWeekday ? 7 : maxVal)}
                            value={intervalValue}
                            onChange={(expr: {
                                target: { value: SetStateAction<string>; };
                            }) => setIntervalValue(expr.target.value)}
                            placeholder={`Enter ${name} interval`}
                            className={styles.numberInput}
                        />
                    </div>
                </fieldset>
            )}

            {option === TYPE_BETWEEN && (
                <div className={styles.betweenContainer}>
                    <fieldset className={styles.subFieldset}>
                        <legend>From</legend>
                        <div className={styles.inputContainer}>
                            {isMonth || isWeekday ? (
                                <select
                                    className={styles.dropdown}
                                    value={fromValue}
                                    onChange={(expr: {
                                        target: { value: SetStateAction<string>; };
                                    }) => setFromValue(expr.target.value)}
                                >
                                    {(isMonth ? MONTHS : WEEK_DAYS).map((item) => (
                                        <option key={item}
                                                value={isMonth ? MONTHS.indexOf(item) + 1 : item}>{item}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="number"
                                    min={minVal}
                                    max={maxVal}
                                    value={fromValue}
                                    onChange={(expr: {
                                        target: { value: SetStateAction<string>; };
                                    }) => setFromValue(expr.target.value)}
                                    placeholder={`From ${name}`}
                                    className={styles.numberInput}
                                />
                            )}
                        </div>
                    </fieldset>
                    <fieldset className={styles.subFieldset}>
                        <legend>To</legend>
                        <div className={styles.inputContainer}>
                            {isMonth || isWeekday ? (
                                <select
                                    className={styles.dropdown}
                                    value={toValue}
                                    onChange={(expr: {
                                        target: { value: SetStateAction<string>; };
                                    }) => setToValue(expr.target.value)}
                                >
                                    {(isMonth ? MONTHS : WEEK_DAYS).map((item) => (
                                        <option key={item}
                                                value={isMonth ? MONTHS.indexOf(item) + 1 : item}>{item}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="number"
                                    min={minVal}
                                    max={maxVal}
                                    value={toValue}
                                    onChange={(expr: {
                                        target: { value: SetStateAction<string>; };
                                    }) => setToValue(expr.target.value)}
                                    placeholder={`To ${name}`}
                                    className={styles.numberInput}
                                />
                            )}
                        </div>
                    </fieldset>
                </div>
            )}

            {option === TYPE_SPECIFIC && (
                <fieldset className={styles.subFieldset}>
                    <legend>{plural.charAt(0).toUpperCase() + plural.slice(1)}</legend>
                    <div className={clsx({
                        [styles.specificContainer]: isMonth || isWeekday,
                        [styles.specificContainerTextInput]: !(isMonth || isWeekday)
                    })}>
                        {isMonth ? (
                            MONTHS.map((month) => (
                                <label key={month} className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={selectedMonths.includes(month)}
                                        onChange={() => handleMonthChange(month)}
                                    />
                                    {month}
                                </label>
                            ))
                        ) : isWeekday ? (
                            WEEK_DAYS.map((day) => (
                                <label key={day} className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={selectedWeekdays.includes(day)}
                                        onChange={() => handleWeekdayChange(day)}
                                    />
                                    {day}
                                </label>
                            ))
                        ) : (
                            <input
                                type="text"
                                value={specificValues}
                                onChange={(expr: {
                                    target: { value: SetStateAction<string>; };
                                }) => setSpecificValues(expr.target.value)}
                                placeholder={`e.g., ${isHour ? '0,1,2' : (isDay ? '1,2,3' : '0,15,30')}`}
                                pattern="^(\d+)(,\d+)*$"
                                title="Comma-separated numbers only"
                                className={styles.textInput}
                            />
                        )}
                    </div>
                </fieldset>
            )}

            {option === TYPE_RANGES && name === NAME_DAY_OF_MONTH && (
                <div className={styles.inputContainer}>
                    <fieldset className={styles.inputGroup}>
                        <legend>Day ranges (separated by comma)</legend>
                        <input
                            type="text"
                            value={specificValues}
                            onChange={(expr: {
                                target: { value: SetStateAction<string>; };
                            }) => setSpecificValues(expr.target.value)}
                            placeholder="e.g., 1-10,12-14,22-25"
                            pattern="^(\d+-\d+)(,\d+-\d+)*$"
                            title="Comma-separated ranges (e.g., 1-10,12-14)"
                            className={styles.textInput}
                        />
                    </fieldset>
                </div>
            )}

            {option === TYPE_NTH && isWeekday && (
                <fieldset className={styles.subFieldset}>
                    <legend>Nth occurrence</legend>
                    <div className={styles.dropdownContainer}>
                        <div className={styles.dropdownUnit}>
                            <label htmlFor="weekday-select">Day of Week:</label>
                            <select
                                id="weekday-select"
                                className={clsx(styles.dropdown, styles.nthDropdown)}
                                value={weekday}
                                onChange={(expr: {
                                    target: { value: SetStateAction<string>; };
                                }) => setWeekday(expr.target.value)}
                            >
                                {WEEK_DAYS.map((weekday) => (
                                    <option key={weekday} value={weekday}>{weekday}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.dropdownUnit}>
                            <label htmlFor="nth-select">nth occurrence:</label>
                            <select
                                id="nth-select"
                                className={clsx(styles.dropdown, styles.nthDropdown)}
                                value={nthOccurrence}
                                onChange={(expr: {
                                    target: { value: SetStateAction<string>; };
                                }) => setNthOccurrence(expr.target.value)}
                            >
                                {NTH_OCCURRENCES.map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>
            )}
        </fieldset>
    );
};

const CronGeneratorPage: React.FC = () => {
    const [copied, setCopied] = useState(false);
    const [cronExpressions, setCronExpressions] = useState({
        second: EVERY_EXPRESSION,
        minute: EVERY_EXPRESSION,
        hour: EVERY_EXPRESSION,
        dayOfMonth: EVERY_EXPRESSION,
        month: EVERY_EXPRESSION,
        dayOfWeek: EVERY_EXPRESSION
    });

    const cronExpression = `${cronExpressions.second} ${cronExpressions.minute} ${cronExpressions.hour} ${cronExpressions.dayOfMonth} ${cronExpressions.month} ${cronExpressions.dayOfWeek}`;

    const handleExpressionChange = (part: keyof typeof cronExpressions, expression: string) => {
        setCronExpressions(prev => ({
            ...prev,
            [part]: expression
        }));
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(cronExpression).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1000);
        });
    };

    return (
        <div className={clsx(styles.pageContainer, "margin-top--xl", "margin-bottom--md")}>
            <h1 className={clsx(styles.textCenter, "margin-top--sm", "margin-bottom--md")}>Spring Cron Expression
                Generator</h1>
            <fieldset className={styles.resultContainer}>
                <legend>Result</legend>
                <div className={styles.codeBlockContainer}>
                    <pre className={styles.resultCode}>
                        <code>{cronExpression}</code>
                        <button
                            className={clsx(styles.copyButton, {[styles.copied]: copied})}
                            onClick={handleCopy}
                            aria-label={copied ? 'Copied' : 'Copy'}
                        />
                    </pre>
                </div>
            </fieldset>
            <CronPart name={NAME_SECOND} plural="seconds"
                      onExpressionChange={(expr: string) => handleExpressionChange(NAME_SECOND, expr)}/>
            <CronPart name={NAME_MINUTE} plural="minutes"
                      onExpressionChange={(expr: string) => handleExpressionChange(NAME_MINUTE, expr)}/>
            <CronPart name={NAME_HOUR} plural="hours"
                      onExpressionChange={(expr: string) => handleExpressionChange(NAME_HOUR, expr)}/>
            <CronPart name={NAME_DAY_OF_MONTH} plural="days"
                      onExpressionChange={(expr: string) => handleExpressionChange('dayOfMonth', expr)}/>
            <CronPart name={NAME_MONTH} plural="months"
                      onExpressionChange={(expr: string) => handleExpressionChange(NAME_MONTH, expr)}/>
            <CronPart name={NAME_DAY_OF_WEEK} plural="days of week"
                      onExpressionChange={(expr: string) => handleExpressionChange('dayOfWeek', expr)}/>
        </div>
    );
};

export default CronGeneratorPage;