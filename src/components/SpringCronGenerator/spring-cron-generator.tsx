import React, {useState, useEffect, useRef} from 'react';
import styles from './SpringCronGenerator.module.css';
import clsx from "clsx";
import {CronUtils, CronPartOptions, CronError} from './CronUtils';

interface CronPartProps {
    name: string;
    plural: string;
    onExpressionChange: (expression: string) => void;
}

const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const nthOccurrences = ['1', '2', '3', '4', '5'];

const CronPart: React.FC<CronPartProps> = ({name, plural, onExpressionChange}) => {
    const isSecond = name === 'second';
    const isMinute = name === 'minute';
    const isHour = name === 'hour';
    const isDay = name === 'day';
    const isMonth = name === 'month';
    const isWeekday = name === 'day of week';
    const isSecondOrMinuteOrHourOrDay = isSecond || isMinute || isHour || isDay;
    const [option, setOption] = useState('every');
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
    const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([]);
    const [intervalValue, setIntervalValue] = useState(isSecondOrMinuteOrHourOrDay ? '1' : '');
    const [fromValue, setFromValue] = useState(isSecondOrMinuteOrHourOrDay ? '1' : (isWeekday ? 'SUN' : ''));
    const [toValue, setToValue] = useState(isSecondOrMinuteOrHourOrDay ? '2' : (isWeekday ? 'MON' : ''));
    const [specificValues, setSpecificValues] = useState(isSecondOrMinuteOrHourOrDay ? '1,2,3' : '');
    const [monthInput, setMonthInput] = useState('');
    const [weekdayInput, setWeekdayInput] = useState('');
    const [weekday, setWeekday] = useState('MON');
    const [nthOccurrence, setNthOccurrence] = useState('1');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showWeekdaySuggestions, setShowWeekdaySuggestions] = useState(false);
    const [error, setError] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);
    const weekdayInputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null); // New ref for suggestions container
    const weekdaySuggestionsRef = useRef<HTMLDivElement>(null); // New ref for weekday suggestions

    const handleMonthChange = (month: string) => {
        setSelectedMonths((prev) =>
            prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
        );
        setMonthInput('');
        setShowSuggestions(false);
    };

    const handleWeekdayChange = (weekday: string) => {
        setSelectedWeekdays((prev) =>
            prev.includes(weekday) ? prev.filter((w) => w !== weekday) : [...prev, weekday]
        );
        setWeekdayInput('');
        setShowWeekdaySuggestions(false);
    };

    const handleOptionChange = (newOption: string) => {
        setOption(newOption);
        if (isSecondOrMinuteOrHourOrDay) {
            if (newOption === 'interval') {
                setIntervalValue('1');
                setFromValue('');
                setToValue('');
                setSpecificValues('');
            } else if (newOption === 'between') {
                setIntervalValue('');
                setFromValue('1');
                setToValue('2');
                setSpecificValues('');
            } else if (newOption === 'specific') {
                setIntervalValue('');
                setFromValue('');
                setToValue('');
                setSpecificValues('1,2,3');
            } else if (newOption === 'ranges') {
                setIntervalValue('');
                setFromValue('');
                setToValue('');
                setSpecificValues('1-5,10-15');
            } else {
                setIntervalValue('');
                setFromValue('');
                setToValue('');
                setSpecificValues('');
            }
        } else if (isMonth) {
            if (newOption === 'interval') {
                setIntervalValue('1');
                setFromValue('');
                setToValue('');
                setSelectedMonths([]);
                setMonthInput('');
                setShowSuggestions(false);
            } else if (newOption === 'between') {
                setIntervalValue('');
                setFromValue('1');
                setToValue('2');
                setSelectedMonths([]);
                setMonthInput('');
                setShowSuggestions(false);
            } else if (newOption === 'specific') {
                setIntervalValue('');
                setFromValue('');
                setToValue('');
                setSelectedMonths(['JAN']);
                setMonthInput('');
                setShowSuggestions(false);
            } else {
                setIntervalValue('');
                setFromValue('');
                setToValue('');
                setSelectedMonths([]);
                setMonthInput('');
                setShowSuggestions(false);
            }
        } else if (isWeekday) {
            if (newOption === 'interval') {
                setIntervalValue('1');
                setFromValue('');
                setToValue('');
                setSelectedWeekdays([]);
                setWeekdayInput('');
                setShowWeekdaySuggestions(false);
                setWeekday('MON');
                setNthOccurrence('1');
            } else if (newOption === 'between') {
                setIntervalValue('');
                setFromValue('SUN');
                setToValue('MON');
                setSelectedWeekdays([]);
                setWeekdayInput('');
                setShowWeekdaySuggestions(false);
                setWeekday('MON');
                setNthOccurrence('1');
            } else if (newOption === 'specific') {
                setIntervalValue('');
                setFromValue('');
                setToValue('');
                setSelectedWeekdays(['MON']);
                setWeekdayInput('');
                setShowWeekdaySuggestions(false);
                setWeekday('MON');
                setNthOccurrence('1');
            } else if (newOption === 'nth') {
                setIntervalValue('');
                setFromValue('');
                setToValue('');
                setSelectedWeekdays([]);
                setWeekdayInput('');
                setShowWeekdaySuggestions(false);
                setWeekday('MON');
                setNthOccurrence('1');
            } else {
                setIntervalValue('');
                setFromValue('');
                setToValue('');
                setSelectedWeekdays([]);
                setWeekdayInput('');
                setShowWeekdaySuggestions(false);
                setWeekday('MON');
                setNthOccurrence('1');
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
            setError('');
            let expression = '*';

            if (name === 'second') {
                const options: CronPartOptions = {
                    type: option as any,
                    intervalValue: intervalValue ? parseInt(intervalValue) : undefined,
                    fromValue: fromValue ? parseInt(fromValue) : undefined,
                    toValue: toValue ? parseInt(toValue) : undefined,
                    specificValues: specificValues || undefined
                };
                expression = CronUtils.generateSecondExpression(options);
            } else if (name === 'minute') {
                const options: CronPartOptions = {
                    type: option as any,
                    intervalValue: intervalValue ? parseInt(intervalValue) : undefined,
                    fromValue: fromValue ? parseInt(fromValue) : undefined,
                    toValue: toValue ? parseInt(toValue) : undefined,
                    specificValues: specificValues || undefined
                };
                expression = CronUtils.generateMinuteExpression(options);
            } else if (name === 'hour') {
                const options: CronPartOptions = {
                    type: option as any,
                    intervalValue: intervalValue ? parseInt(intervalValue) : undefined,
                    fromValue: fromValue ? parseInt(fromValue) : undefined,
                    toValue: toValue ? parseInt(toValue) : undefined,
                    specificValues: specificValues || undefined
                };
                expression = CronUtils.generateHourExpression(options);
            } else if (name === 'day') {
                const options: CronPartOptions = {
                    type: option as any,
                    intervalValue: intervalValue ? parseInt(intervalValue) : undefined,
                    fromValue: fromValue ? parseInt(fromValue) : undefined,
                    toValue: toValue ? parseInt(toValue) : undefined,
                    specificValues: specificValues || undefined
                };
                expression = CronUtils.generateDayOfMonthExpression(options);
            } else if (name === 'month') {
                const options: CronPartOptions = {
                    type: option as any,
                    intervalValue: intervalValue ? parseInt(intervalValue) : undefined,
                    fromValue: fromValue ? parseInt(fromValue) : undefined,
                    toValue: toValue ? parseInt(toValue) : undefined,
                    specificValues: selectedMonths.length > 0 ? selectedMonths.join(',') : undefined
                };
                expression = CronUtils.generateMonthExpression(options);
                if (options.type === 'specific' && selectedMonths.length === 0) {
                    setError('At least one month must be selected');
                    expression = '*';
                }
            } else if (name === 'day of week') {
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
                if (options.type === 'specific' && selectedWeekdays.length === 0) {
                    setError('At least one day of week must be selected');
                    expression = '*';
                }
            }
            onExpressionChange(expression);
        } catch (err) {
            if (err instanceof CronError) {
                setError(err.message);
                onExpressionChange('*');
            }
        }
    }, [name, option, intervalValue, fromValue, toValue, specificValues, selectedMonths, selectedWeekdays, weekday, nthOccurrence, onExpressionChange]);

    const minVal = (name === 'day') ? 1 : 0;
    const maxVal = (name === 'day') ? 31 : (isHour ? 23 : 59);

    const availableMonths = months.filter(month => !selectedMonths.includes(month));
    const availableWeekdays = weekdays.filter(weekday => !selectedWeekdays.includes(weekday));

    const monthOrder = months.reduce((acc, month, index) => ({
        ...acc,
        [month]: index + 1
    }), {} as Record<string, number>);
    const sortedSelectedMonths = [...selectedMonths].sort((a, b) => monthOrder[a] - monthOrder[b]);
    const weekdayOrder = weekdays.reduce((acc, day, index) => ({...acc, [day]: index}), {} as Record<string, number>);
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
                    onChange={(e) => handleOptionChange(e.target.value)}
                    className={clsx(styles.optionSelect, "margin-top--md", "margin-bottom--md")}
                >
                    <option value="every">Every {name}</option>
                    <option value="interval">Every N {name}</option>
                    <option value="between">From ... to ... {name}</option>
                    <option value="specific">Specific {plural}</option>
                    {name === 'day' && <option value="ranges">Multiple ranges</option>}
                    {isWeekday && <option value="nth">Nth occurrence</option>}
                </select>
            </div>

            {option === 'interval' && (
                <fieldset className={styles.subFieldset}>
                    <legend>Interval</legend>
                    <div className={styles.inputContainer}>
                        <input
                            type="number"
                            min="1"
                            max={isMonth ? 12 : (isWeekday ? 7 : maxVal)}
                            value={intervalValue}
                            onChange={(e) => setIntervalValue(e.target.value)}
                            placeholder={`Enter ${name} interval`}
                            className={styles.numberInput}
                        />
                    </div>
                </fieldset>
            )}

            {option === 'between' && (
                <div className={styles.betweenContainer}>
                    <fieldset className={styles.subFieldset}>
                        <legend>From</legend>
                        <div className={styles.inputContainer}>
                            {isMonth || isWeekday ? (
                                <select
                                    className={styles.dropdown}
                                    value={fromValue}
                                    onChange={(e) => setFromValue(e.target.value)}
                                >
                                    {(isMonth ? months : weekdays).map((item) => (
                                        <option key={item}
                                                value={isMonth ? months.indexOf(item) + 1 : item}>{item}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="number"
                                    min={minVal}
                                    max={maxVal}
                                    value={fromValue}
                                    onChange={(e) => setFromValue(e.target.value)}
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
                                    onChange={(e) => setToValue(e.target.value)}
                                >
                                    {(isMonth ? months : weekdays).map((item) => (
                                        <option key={item}
                                                value={isMonth ? months.indexOf(item) + 1 : item}>{item}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="number"
                                    min={minVal}
                                    max={maxVal}
                                    value={toValue}
                                    onChange={(e) => setToValue(e.target.value)}
                                    placeholder={`To ${name}`}
                                    className={styles.numberInput}
                                />
                            )}
                        </div>
                    </fieldset>
                </div>
            )}

            {option === 'specific' && (
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
                                        onChange={(e) => {
                                            setMonthInput(e.target.value.toUpperCase());
                                            setShowSuggestions(e.target.value.length > 0);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && availableMonths.length > 0) {
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
                                        {availableMonths
                                            .filter(month => month.startsWith(monthInput.toUpperCase()))
                                            .map(month => (
                                                <div
                                                    key={month}
                                                    className={styles.suggestionItem}
                                                    onClick={() => handleMonthChange(month)}
                                                >
                                                    {month}
                                                </div>
                                            ))}
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
                                        onChange={(e) => {
                                            setWeekdayInput(e.target.value.toUpperCase());
                                            setShowWeekdaySuggestions(e.target.value.length > 0);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && availableWeekdays.length > 0) {
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
                                        {availableWeekdays
                                            .filter(day => day.startsWith(weekdayInput.toUpperCase()))
                                            .map(day => (
                                                <div
                                                    key={day}
                                                    className={styles.suggestionItem}
                                                    onClick={() => handleWeekdayChange(day)}
                                                >
                                                    {day}
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <input
                                type="text"
                                value={specificValues}
                                onChange={(e) => setSpecificValues(e.target.value)}
                                placeholder={`e.g., ${isHour ? '0,1,2' : (isDay ? '1,2,3' : '0,15,30')}`}
                                pattern="^(\d+)(,\d+)*$"
                                title="Comma-separated numbers only"
                                className={styles.textInput}
                            />
                        )}
                    </div>
                </fieldset>
            )}

            {option === 'ranges' && name === 'day' && (
                <div className={styles.inputContainer}>
                    <fieldset className={styles.inputGroup}>
                        <legend>Day ranges (separated by comma)</legend>
                        <input
                            type="text"
                            value={specificValues}
                            onChange={(e) => setSpecificValues(e.target.value)}
                            placeholder="e.g., 1-10,12-14,22-25"
                            pattern="^(\d+-\d+)(,\d+-\d+)*$"
                            title="Comma-separated ranges (e.g., 1-10,12-14)"
                            className={styles.textInput}
                        />
                    </fieldset>
                </div>
            )}

            {option === 'nth' && isWeekday && (
                <fieldset className={styles.subFieldset}>
                    <legend>Nth occurrence</legend>
                    <div className={styles.dropdownContainer}>
                        <div className={styles.dropdownUnit}>
                            <label htmlFor="weekday-select">Day of Week:</label>
                            <select
                                id="weekday-select"
                                className={styles.dropdown}
                                value={weekday}
                                onChange={(e) => setWeekday(e.target.value)}
                            >
                                {weekdays.map((weekday) => (
                                    <option key={weekday} value={weekday}>{weekday}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.dropdownUnit}>
                            <label htmlFor="nth-select">nth occurrence:</label>
                            <select
                                id="nth-select"
                                className={styles.dropdown}
                                value={nthOccurrence}
                                onChange={(e) => setNthOccurrence(e.target.value)}
                            >
                                {nthOccurrences.map((n) => (
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
        second: '*',
        minute: '*',
        hour: '*',
        dayOfMonth: '*',
        month: '*',
        dayOfWeek: '*'
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
            <h1 className={styles.textCenter}>Spring Cron Expression Generator</h1>
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
            <CronPart name="second" plural="seconds"
                      onExpressionChange={(expr) => handleExpressionChange('second', expr)}/>
            <CronPart name="minute" plural="minutes"
                      onExpressionChange={(expr) => handleExpressionChange('minute', expr)}/>
            <CronPart name="hour" plural="hours" onExpressionChange={(expr) => handleExpressionChange('hour', expr)}/>
            <CronPart name="day" plural="days"
                      onExpressionChange={(expr) => handleExpressionChange('dayOfMonth', expr)}/>
            <CronPart name="month" plural="months"
                      onExpressionChange={(expr) => handleExpressionChange('month', expr)}/>
            <CronPart name="day of week" plural="days of week"
                      onExpressionChange={(expr) => handleExpressionChange('dayOfWeek', expr)}/>
        </div>
    );
};

export default CronGeneratorPage;