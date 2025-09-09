import React, {SetStateAction, useEffect, useRef, useState} from 'react';
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
    const [monthInput, setMonthInput] = useState(TEXT_EMPTY);
    const [weekdayInput, setWeekdayInput] = useState(TEXT_EMPTY);
    const [weekday, setWeekday] = useState(WEEKDAY_MON);
    const [nthOccurrence, setNthOccurrence] = useState(TEXT_ONE);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showWeekdaySuggestions, setShowWeekdaySuggestions] = useState(false);
    const [error, setError] = useState<string>(TEXT_EMPTY);
    const inputRef = useRef<HTMLInputElement>(null);
    const weekdayInputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const weekdaySuggestionsRef = useRef<HTMLDivElement>(null);

    const handleMonthChange = (month: string) => {
        setSelectedMonths((prev) =>
            prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
        );
        setMonthInput(TEXT_EMPTY);
        setShowSuggestions(false);
    };

    const handleWeekdayChange = (weekday: string) => {
        setSelectedWeekdays((prev) =>
            prev.includes(weekday) ? prev.filter((w) => w !== weekday) : [...prev, weekday]
        );
        setWeekdayInput(TEXT_EMPTY);
        setShowWeekdaySuggestions(false);
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
                setMonthInput(TEXT_EMPTY);
                setShowSuggestions(false);
            } else if (newOption === TYPE_BETWEEN) {
                setIntervalValue(TEXT_EMPTY);
                setFromValue(TEXT_ONE);
                setToValue('2');
                setSelectedMonths([]);
                setMonthInput(TEXT_EMPTY);
                setShowSuggestions(false);
            } else if (newOption === TYPE_SPECIFIC) {
                setIntervalValue(TEXT_EMPTY);
                setFromValue(TEXT_EMPTY);
                setToValue(TEXT_EMPTY);
                setSelectedMonths(['JAN']);
                setMonthInput(TEXT_EMPTY);
                setShowSuggestions(false);
            } else {
                setIntervalValue(TEXT_EMPTY);
                setFromValue(TEXT_EMPTY);
                setToValue(TEXT_EMPTY);
                setSelectedMonths([]);
                setMonthInput(TEXT_EMPTY);
                setShowSuggestions(false);
            }
        } else if (isWeekday) {
            if (newOption === TYPE_INTERVAL) {
                setIntervalValue(TEXT_ONE);
                setFromValue(TEXT_EMPTY);
                setToValue(TEXT_EMPTY);
                setSelectedWeekdays([]);
                setWeekdayInput(TEXT_EMPTY);
                setShowWeekdaySuggestions(false);
                setWeekday(WEEKDAY_MON);
                setNthOccurrence(TEXT_ONE);
            } else if (newOption === TYPE_BETWEEN) {
                setIntervalValue(TEXT_EMPTY);
                setFromValue(WEEKDAY_SUN);
                setToValue(WEEKDAY_MON);
                setSelectedWeekdays([]);
                setWeekdayInput(TEXT_EMPTY);
                setShowWeekdaySuggestions(false);
                setWeekday(WEEKDAY_MON);
                setNthOccurrence(TEXT_ONE);
            } else if (newOption === TYPE_SPECIFIC) {
                setIntervalValue(TEXT_EMPTY);
                setFromValue(TEXT_EMPTY);
                setToValue(TEXT_EMPTY);
                setSelectedWeekdays([WEEKDAY_MON]);
                setWeekdayInput(TEXT_EMPTY);
                setShowWeekdaySuggestions(false);
                setWeekday(WEEKDAY_MON);
                setNthOccurrence(TEXT_ONE);
            } else if (newOption === TYPE_NTH) {
                setIntervalValue(TEXT_EMPTY);
                setFromValue(TEXT_EMPTY);
                setToValue(TEXT_EMPTY);
                setSelectedWeekdays([]);
                setWeekdayInput(TEXT_EMPTY);
                setShowWeekdaySuggestions(false);
                setWeekday(WEEKDAY_MON);
                setNthOccurrence(TEXT_ONE);
            } else {
                setIntervalValue(TEXT_EMPTY);
                setFromValue(TEXT_EMPTY);
                setToValue(TEXT_EMPTY);
                setSelectedWeekdays([]);
                setWeekdayInput(TEXT_EMPTY);
                setShowWeekdaySuggestions(false);
                setWeekday(WEEKDAY_MON);
                setNthOccurrence(TEXT_ONE);
            }
        }
    };

    // Handle clicks outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const isOutsideMonthInput =
                inputRef.current && !inputRef.current.contains(target) &&
                suggestionsRef.current && !suggestionsRef.current.contains(target);
            const isOutsideWeekdayInput =
                weekdayInputRef.current && !weekdayInputRef.current.contains(target) &&
                weekdaySuggestionsRef.current && !weekdaySuggestionsRef.current.contains(target);

            if (isOutsideMonthInput) {
                setShowSuggestions(false);
            }
            if (isOutsideWeekdayInput) {
                setShowWeekdaySuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        try {
            setError(TEXT_EMPTY);
            let expression = EVERY_EXPRESSION;

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
                    specificValues: selectedMonths.length > 0 ? selectedMonths.join(',') : undefined
                };
                expression = CronUtils.generateMonthExpression(options);
                if (options.type === TYPE_SPECIFIC && selectedMonths.length === 0) {
                    setError('At least one month must be selected');
                    expression = EVERY_EXPRESSION;
                }
            } else if (name === NAME_DAY_OF_WEEK) {
                const options: CronPartOptions = {
                    type: option as any,
                    intervalValue: intervalValue ? parseInt(intervalValue) : undefined,
                    fromValue: fromValue || undefined,
                    toValue: toValue || undefined,
                    specificValues: selectedWeekdays.length > 0 ? selectedWeekdays.join(',') : undefined,
                    weekday: weekday || undefined,
                    nthOccurrence: nthOccurrence || undefined
                };
                expression = CronUtils.generateDayOfWeekExpression(options);
                if (options.type === TYPE_SPECIFIC && selectedWeekdays.length === 0) {
                    setError('At least one day of week must be selected');
                    expression = EVERY_EXPRESSION;
                }
            }
            onExpressionChange(expression);
        } catch (err) {
            if (err instanceof CronError) {
                setError(err.message);
                onExpressionChange(EVERY_EXPRESSION);
            }
        }
    }, [name, option, intervalValue, fromValue, toValue, specificValues, selectedMonths, selectedWeekdays, weekday, nthOccurrence, onExpressionChange]);

    const minVal = (name === NAME_DAY_OF_MONTH) ? 1 : 0;
    const maxVal = (name === NAME_DAY_OF_MONTH) ? 31 : (isHour ? 23 : 59);

    const availableMonths = MONTHS.filter(month => !selectedMonths.includes(month));
    const availableWeekdays = WEEK_DAYS.filter(weekday => !selectedWeekdays.includes(weekday));

    const monthOrder = MONTHS.reduce((acc, month, index) => ({
        ...acc,
        [month]: index + 1
    }), {} as Record<string, number>);
    const sortedSelectedMonths = [...selectedMonths].sort((a, b) => monthOrder[a] - monthOrder[b]);
    const weekdayOrder = WEEK_DAYS.reduce((acc, day, index) => ({...acc, [day]: index}), {} as Record<string, number>);
    const sortedSelectedWeekdays = [...selectedWeekdays].sort((a, b) => weekdayOrder[a] - weekdayOrder[b]);

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
                    <div className={styles.inputContainer}>
                        {isMonth ? (
                            <div className={styles.chipsContainer}>
                                <div className={styles.chips}>
                                    {sortedSelectedMonths.map((month) => (
                                        <div key={month} className={styles.chip}>
                                            {month}
                                            <span
                                                className={styles.chipRemove}
                                                onClick={() => handleMonthChange(month)}
                                            >
                                                ×
                                            </span>
                                        </div>
                                    ))}
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={monthInput}
                                        onChange={(expr: { target: { value: string; }; }) => {
                                            setMonthInput(expr.target.value.toUpperCase());
                                            setShowSuggestions(expr.target.value.length > 0);
                                        }}
                                        onKeyDown={(expr: { key: string; }) => {
                                            if (expr.key === 'Enter' && availableMonths.length > 0) {
                                                const firstMatch = availableMonths.find(month =>
                                                    month.startsWith(monthInput.toUpperCase())
                                                );
                                                if (firstMatch) {
                                                    handleMonthChange(firstMatch);
                                                }
                                            }
                                        }}
                                        placeholder="Type a month..."
                                        className={styles.chipInput}
                                    />
                                </div>
                                {showSuggestions && (
                                    <div ref={suggestionsRef} className={styles.suggestions}>
                                        {availableMonths.length > 0 ? (
                                            availableMonths
                                                .filter(month => month.startsWith(monthInput.toUpperCase()))
                                                .map(month => (
                                                    <div
                                                        key={month}
                                                        className={styles.suggestionItem}
                                                        onClick={() => handleMonthChange(month)}
                                                    >
                                                        {month}
                                                    </div>
                                                ))
                                        ) : (
                                            <div className={styles.noSuggestions}>
                                                No items available...
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : isWeekday ? (
                            <div className={styles.chipsContainer}>
                                <div className={styles.chips}>
                                    {sortedSelectedWeekdays.map((weekday) => (
                                        <div key={weekday} className={styles.chip}>
                                            {weekday}
                                            <span
                                                className={styles.chipRemove}
                                                onClick={() => handleWeekdayChange(weekday)}
                                            >
                                                ×
                                            </span>
                                        </div>
                                    ))}
                                    <input
                                        ref={weekdayInputRef}
                                        type="text"
                                        value={weekdayInput}
                                        onChange={(expr: { target: { value: string; }; }) => {
                                            setWeekdayInput(expr.target.value.toUpperCase());
                                            setShowWeekdaySuggestions(expr.target.value.length > 0);
                                        }}
                                        onKeyDown={(expr: { key: string; }) => {
                                            if (expr.key === 'Enter' && availableWeekdays.length > 0) {
                                                const firstMatch = availableWeekdays.find(day =>
                                                    day.startsWith(weekdayInput.toUpperCase())
                                                );
                                                if (firstMatch) {
                                                    handleWeekdayChange(firstMatch);
                                                }
                                            }
                                        }}
                                        placeholder="Type a day of week..."
                                        className={styles.chipInput}
                                    />
                                </div>
                                {showWeekdaySuggestions && (
                                    <div ref={weekdaySuggestionsRef} className={styles.suggestions}>
                                        {availableWeekdays.length > 0 ? (
                                            availableWeekdays
                                                .filter(day => day.startsWith(weekdayInput.toUpperCase()))
                                                .map(day => (
                                                    <div
                                                        key={day}
                                                        className={styles.suggestionItem}
                                                        onClick={() => handleWeekdayChange(day)}
                                                    >
                                                        {day}
                                                    </div>
                                                ))
                                        ) : (
                                            <div className={styles.noSuggestions}>
                                                No items available...
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
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