import {
    CASE_BETWEEN,
    CASE_EVERY,
    CASE_INTERVAL,
    CASE_LAST_DAY,
    CASE_LAST_WEEKDAY,
    CASE_NTH,
    CASE_RANGES,
    CASE_SPECIFIC,
    COMMA_DELIMITER,
    dayOrder,
    EVERY_EXPRESSION,
    MAX_DAYS_OF_MONTH,
    MAX_DAYS_OF_WEEK,
    MAX_MONTHS,
    MIN_ONE,
    monthOrder,
    MONTHS,
    NAME_DAY_OF_MONTH,
    NAME_DAY_OF_WEEK,
    NAME_HOUR,
    NAME_MINUTE,
    NAME_MONTH,
    NAME_SECOND,
    NTH_OCCURRENCES,
    PART_DAY,
    PART_DAY_OF_WEEK,
    PART_HOUR,
    PART_LAST_DAY_OFFSET,
    PART_MINUTE,
    PART_MONTH,
    PART_SECOND,
    SPACED_COMMA,
    TEXT_EMPTY,
    TEXT_ONE,
    TYPE_BETWEEN,
    TYPE_EVERY,
    TYPE_INTERVAL,
    TYPE_LAST,
    TYPE_LAST_WEEKDAY,
    TYPE_NTH,
    TYPE_RANGES,
    TYPE_SPECIFIC,
    WEEK_DAYS,
    WEEKDAY_MON,
    WEEKDAY_SUN,
    weekdayOrder
} from "./CronSupport";
import {CronError} from "./components/CronError";
import {CronPartState} from "./components/CronPartState";
import {CronPartOptions} from "./components/CronPartOptions";
import {UrlParamConfig} from "./components/UrlParamConfig";

export class CronUtils {

    private static validateRange(value: number, part: string, min: number, max: number): void {
        if (value < min || value > max) {
            throw new CronError(`${part} value ${value} is outside the valid range (${min}-${max})`);
        }
    }

    private static parseSpecificValues(input: string, part: string, min: number, max: number): string {
        if (!/^[\d\s,]+$/.test(input)) {
            throw new CronError(`Specific ${part} values can only contain numbers, commas, and whitespace`);
        }

        const values = input.replace(/\s+/g, TEXT_EMPTY).split(COMMA_DELIMITER);
        const numbers: number[] = [];

        for (const value of values) {
            if (value === TEXT_EMPTY) {
                continue;
            }

            const num = parseInt(value, 10);

            if (isNaN(num)) {
                throw new CronError(`Invalid ${part} number: ${value}`);
            }

            this.validateRange(num, part, min, max);

            numbers.push(num);
        }

        if (numbers.length === 0) {
            throw new CronError(`At least one valid ${part} value is required`);
        }

        const uniqueSorted = [...new Set(numbers)].sort((a, b) => a - b);

        return uniqueSorted.join(COMMA_DELIMITER);
    }

    private static parseSpecificMonthValues(input: string): string {
        const values = input.replace(/\s+/g, TEXT_EMPTY).split(COMMA_DELIMITER);
        const validValues: string[] = [];

        for (const value of values) {
            if (value === TEXT_EMPTY) {
                continue;
            }

            const upperValue = value.toUpperCase();

            if (!MONTHS.includes(upperValue)) {
                throw new CronError(`Invalid month value: ${value}. Must be one of ${MONTHS.join(SPACED_COMMA)}`);
            }

            validValues.push(upperValue);
        }

        if (validValues.length === 0) {
            throw new CronError('At least one valid month value is required');
        }

        const uniqueSorted = [...new Set(validValues)].sort((a, b) => monthOrder[a] - monthOrder[b]);

        return uniqueSorted.join(COMMA_DELIMITER);
    }

    private static parseSpecificDayOfWeekValues(input: string): string {
        const values = input.replace(/\s+/g, TEXT_EMPTY).split(COMMA_DELIMITER);
        const validValues: string[] = [];

        for (const value of values) {
            if (value === TEXT_EMPTY) {
                continue;
            }

            const upperValue = value.toUpperCase();

            if (!WEEK_DAYS.includes(upperValue)) {
                throw new CronError(`Invalid day of week value: ${value}. Must be one of ${WEEK_DAYS.join(SPACED_COMMA)}`);
            }

            validValues.push(upperValue);
        }

        if (validValues.length === 0) {
            throw new CronError('At least one valid day of week value is required');
        }

        const uniqueSorted = [...new Set(validValues)].sort((a, b) => dayOrder[a] - dayOrder[b]);

        return uniqueSorted.join(COMMA_DELIMITER);
    }

    private static parseRanges(input: string, part: string, min: number, max: number): string {
        if (!/^[\d\s,-]+$/.test(input)) {
            throw new CronError(`Ranges for ${part} can only contain numbers, commas, hyphens, and whitespace`);
        }

        const values = input.replace(/\s+/g, TEXT_EMPTY).split(COMMA_DELIMITER);
        const ranges: string[] = [];

        for (const value of values) {
            if (value === TEXT_EMPTY) {
                continue;
            }

            const parts = value.split('-');

            if (parts.length !== 2) {
                throw new CronError(`Invalid range format in ${part}: '${value}' must be in the form 'num-num'`);
            }

            const start = parseInt(parts[0], 10);
            const end = parseInt(parts[MIN_ONE], 10);

            if (isNaN(start) || isNaN(end)) {
                throw new CronError(`Invalid numbers in ${part} range: '${value}'`);
            }

            this.validateRange(start, part, min, max);
            this.validateRange(end, part, min, max);

            if (start > end) {
                throw new CronError(`Start must be less than or equal to end in ${part} range: '${value}'`);
            }

            ranges.push(`${start}-${end}`);
        }

        if (ranges.length === 0) {
            throw new CronError(`At least one valid ${part} range is required`);
        }

        ranges.sort((a, b) => parseInt(a.split('-')[0], 10) - parseInt(b.split('-')[0], 10));

        return ranges.join(COMMA_DELIMITER);
    }

    private static validateDayOfWeekRange(fromValue: string, toValue: string): string {
        const fromUpper = fromValue.toUpperCase();
        const toUpper = toValue.toUpperCase();

        if (!WEEK_DAYS.includes(fromUpper)) {
            throw new CronError(`Invalid from day of week: ${fromValue}. Must be one of ${WEEK_DAYS.join(SPACED_COMMA)}`);
        }

        if (!WEEK_DAYS.includes(toUpper)) {
            throw new CronError(`Invalid to day of week: ${toValue}. Must be one of ${WEEK_DAYS.join(SPACED_COMMA)}`);
        }

        return `${fromUpper}-${toUpper}`;
    }

    private static validateLastWeekday(weekday: string): string {
        const upperWeekday = weekday.toUpperCase();

        if (!WEEK_DAYS.includes(upperWeekday)) {
            throw new CronError(`Invalid weekday for last weekday: ${weekday}. Must be one of ${WEEK_DAYS.join(SPACED_COMMA)}`);
        }

        return `${upperWeekday}L`;
    }

    private static validateMonthRange(fromValue: string, toValue: string): string {
        const fromUpper = fromValue.toUpperCase();
        const toUpper = toValue.toUpperCase();

        if (!MONTHS.includes(fromUpper)) {
            throw new CronError(`Invalid from month: ${fromValue}. Must be one of ${MONTHS.join(SPACED_COMMA)}`);
        }

        if (!MONTHS.includes(toUpper)) {
            throw new CronError(`Invalid to month: ${toValue}. Must be one of ${MONTHS.join(SPACED_COMMA)}`);
        }

        return `${fromUpper}-${toUpper}`;
    }

    private static generateNumericExpression(
        options: CronPartOptions,
        part: string,
        min: number,
        max: number,
        intervalStart: number = 0
    ): string {
        switch (options.type) {
            case CASE_EVERY:
                return EVERY_EXPRESSION;

            case CASE_INTERVAL:
                if (options.intervalValue === undefined) {
                    throw new CronError('Interval value is required for interval type');
                }

                this.validateRange(options.intervalValue, part, MIN_ONE, max);

                return `${intervalStart}/${options.intervalValue}`;

            case CASE_BETWEEN:
                if (options.fromValue === undefined || options.toValue === undefined) {
                    throw new CronError('From and To values are required for between type');
                }

                this.validateRange(options.fromValue as number, part, min, max);
                this.validateRange(options.toValue as number, part, min, max);

                return `${Math.min(options.fromValue as number, options.toValue as number)}-${Math.max(options.fromValue as number, options.toValue as number)}`;

            case CASE_SPECIFIC:
                if (!options.specificValues) {
                    throw new CronError(`Specific values are required for specific type`);
                }

                return this.parseSpecificValues(options.specificValues, part, min, max);

            default:
                throw new CronError('Invalid cron part type');
        }
    }

    static generateSecondExpression(options: CronPartOptions): string {
        return this.generateNumericExpression(options, PART_SECOND, 0, 59);
    }

    static generateMinuteExpression(options: CronPartOptions): string {
        return this.generateNumericExpression(options, PART_MINUTE, 0, 59);
    }

    static generateHourExpression(options: CronPartOptions): string {
        return this.generateNumericExpression(options, PART_HOUR, 0, 23);
    }

    static generateDayOfMonthExpression(options: CronPartOptions): string {
        switch (options.type) {
            case CASE_EVERY:
            case CASE_INTERVAL:
            case CASE_BETWEEN:
            case CASE_SPECIFIC:
                return this.generateNumericExpression(options, PART_DAY, MIN_ONE, MAX_DAYS_OF_MONTH, 1);

            case CASE_RANGES:
                if (!options.specificValues) {
                    throw new CronError('Range values are required for ranges type');
                }

                return this.parseRanges(options.specificValues, PART_DAY, MIN_ONE, MAX_DAYS_OF_MONTH);

            case CASE_LAST_DAY:
                if (options.lastValue === undefined || options.lastValue === 0) {
                    return 'L';
                }

                this.validateRange(options.lastValue, PART_LAST_DAY_OFFSET, MIN_ONE, MAX_DAYS_OF_MONTH);

                return `L-${options.lastValue}`;

            default:
                throw new CronError('Invalid cron part type');
        }
    }

    static generateMonthExpression(options: CronPartOptions): string {
        switch (options.type) {
            case CASE_EVERY:
                return EVERY_EXPRESSION;

            case CASE_INTERVAL:
                if (options.intervalValue === undefined) {
                    throw new CronError('Interval value is required for interval type');
                }

                this.validateRange(options.intervalValue, PART_MONTH, MIN_ONE, MAX_MONTHS);

                return `1/${options.intervalValue}`;

            case CASE_BETWEEN:
                if (options.fromValue === undefined || options.toValue === undefined) {
                    throw new CronError('From and To values are required for between type');
                }

                if (typeof options.fromValue !== 'string' || typeof options.toValue !== 'string') {
                    throw new CronError('Month range must use month names (e.g., JAN, FEB)');
                }

                return this.validateMonthRange(options.fromValue, options.toValue);

            case CASE_SPECIFIC:
                if (!options.specificValues) {
                    throw new CronError('At least one month must be selected');
                }

                return this.parseSpecificMonthValues(options.specificValues);

            default:
                throw new CronError('Invalid cron part type');
        }
    }

    static generateDayOfWeekExpression(options: CronPartOptions): string {
        const validNthOccurrences = NTH_OCCURRENCES;
        switch (options.type) {
            case CASE_EVERY:
            case CASE_INTERVAL:
                return this.generateNumericExpression(options, PART_DAY_OF_WEEK, MIN_ONE, MAX_DAYS_OF_WEEK);

            case CASE_BETWEEN:
                if (options.fromValue === undefined || options.toValue === undefined) {
                    throw new CronError('From and To values are required for between type');
                }

                if (typeof options.fromValue !== 'string' || typeof options.toValue !== 'string') {
                    throw new CronError('Day of week range must use day names (e.g., SUN, MON)');
                }

                return this.validateDayOfWeekRange(options.fromValue, options.toValue);

            case CASE_SPECIFIC:
                if (!options.specificValues) {
                    throw new CronError('At least one day of week must be selected');
                }

                return this.parseSpecificDayOfWeekValues(options.specificValues);

            case CASE_NTH:
                if (!options.weekday || !options.nthOccurrence) {
                    throw new CronError('Weekday and nth occurrence are required for nth type');
                }

                if (!WEEK_DAYS.includes(options.weekday)) {
                    throw new CronError(`Invalid weekday: ${options.weekday}. Must be one of ${WEEK_DAYS.join(SPACED_COMMA)}`);
                }

                if (!validNthOccurrences.includes(options.nthOccurrence)) {
                    throw new CronError(`Invalid nth occurrence: ${options.nthOccurrence}. Must be one of ${validNthOccurrences.join(SPACED_COMMA)}`);
                }

                return `${options.weekday}#${options.nthOccurrence}`;

            case CASE_LAST_WEEKDAY:
                if (!options.lastWeekday) {
                    throw new CronError('Weekday is required for last weekday type');
                }

                return this.validateLastWeekday(options.lastWeekday);

            default:
                throw new CronError('Invalid cron part type');
        }
    }
}

export const getInitialStateFromUrl = (
    name: string,
    isSecondOrMinuteOrHourOrDay: boolean,
    isMonth: boolean,
    isWeekday: boolean,
    urlConfig: UrlParamConfig
): CronPartState => {
    const {optionParam, argParams, validOptions, maxVal} = urlConfig;

    const initialState: CronPartState = {
        option: TYPE_EVERY,
        selectedMonths: [],
        selectedWeekdays: [],
        intervalValue: isSecondOrMinuteOrHourOrDay ? TEXT_ONE : TEXT_EMPTY,
        fromValue: isSecondOrMinuteOrHourOrDay ? TEXT_ONE : (isWeekday ? WEEKDAY_SUN : 'JAN'),
        toValue: isSecondOrMinuteOrHourOrDay ? '2' : (isWeekday ? WEEKDAY_MON : 'FEB'),
        specificValues: isSecondOrMinuteOrHourOrDay ? '1,2,3' : TEXT_EMPTY,
        weekday: WEEKDAY_MON,
        nthOccurrence: TEXT_ONE,
        lastValue: TEXT_EMPTY,
        lastWeekday: WEEKDAY_MON,
        error: TEXT_EMPTY
    };

    // Check if running in a browser environment
    if (typeof window === 'undefined') {
        return initialState; // Return default state for non-browser environments
    }

    const urlParams = new URLSearchParams(window.location.search);

    if (name === NAME_SECOND || name === NAME_MINUTE || name === NAME_HOUR || name === NAME_DAY_OF_MONTH || name === NAME_MONTH || name === NAME_DAY_OF_WEEK) {
        const optionIndex = parseInt(urlParams.get(optionParam) || '-1', 10);
        const [arg1, arg2] = argParams.map(param => urlParams.get(param));

        // For month or day of week, if mm or dw is specified but arguments are invalid, default to TYPE_EVERY
        if ((name === NAME_MONTH || name === NAME_DAY_OF_WEEK) && urlParams.has(optionParam)) {
            if (optionIndex < 0 || optionIndex >= validOptions.length || !validOptions[optionIndex]) {
                return initialState; // Default to TYPE_EVERY
            }
            if (optionIndex === 1 && (!arg1 || isNaN(parseInt(arg1, 10)) || parseInt(arg1, 10) < 1 || parseInt(arg1, 10) > maxVal)) {
                return initialState; // Invalid interval, default to TYPE_EVERY
            }
            if (optionIndex === 2 && (!arg1 || !arg2 || !(name === NAME_MONTH ? MONTHS : WEEK_DAYS).includes(arg1.toUpperCase()) || !(name === NAME_MONTH ? MONTHS : WEEK_DAYS).includes(arg2.toUpperCase()))) {
                return initialState; // Invalid between args, default to TYPE_EVERY
            }
            if (optionIndex === 3 && (!arg1 || !arg1.split(',').every(val => val.trim() === '' || (name === NAME_MONTH ? MONTHS : WEEK_DAYS).includes(val.toUpperCase())))) {
                return initialState; // Invalid specific months or weekdays, default to TYPE_EVERY
            }
            if (name === NAME_DAY_OF_WEEK && optionIndex === 4 && (!arg1 || !WEEK_DAYS.includes(arg1.toUpperCase()) || !arg2 || !NTH_OCCURRENCES.includes(arg2))) {
                return initialState; // Invalid nth occurrence, default to TYPE_EVERY
            }
            if (name === NAME_DAY_OF_WEEK && optionIndex === 5 && (!arg1 || !WEEK_DAYS.includes(arg1.toUpperCase()))) {
                return initialState; // Invalid last weekday, default to TYPE_EVERY
            }
        }

        if (optionIndex >= 0 && optionIndex < validOptions.length && validOptions[optionIndex]) {
            initialState.option = validOptions[optionIndex];
            if (optionIndex === 1 && arg1 && !isNaN(parseInt(arg1, 10)) && parseInt(arg1, 10) >= 1 && parseInt(arg1, 10) <= maxVal) {
                // Interval
                initialState.intervalValue = arg1;
            } else if (optionIndex === 2 && arg1 && arg2) {
                // Between
                if (isMonth || isWeekday) {
                    const fromUpper = arg1.toUpperCase();
                    const toUpper = arg2.toUpperCase();
                    if ((isMonth ? MONTHS : WEEK_DAYS).includes(fromUpper) && (isMonth ? MONTHS : WEEK_DAYS).includes(toUpper)) {
                        initialState.fromValue = fromUpper;
                        initialState.toValue = toUpper;
                    }
                } else if (!isNaN(parseInt(arg1, 10)) && !isNaN(parseInt(arg2, 10))) {
                    initialState.fromValue = arg1;
                    initialState.toValue = arg2;
                }
            } else if (optionIndex === 3 && arg1) {
                // Specific
                if (isMonth || isWeekday) {
                    const values = arg1.replace(/\s+/g, TEXT_EMPTY).split(',');
                    const validValues: string[] = [];
                    for (const value of values) {
                        if (value === TEXT_EMPTY) continue;
                        const upperValue = value.toUpperCase();
                        if ((isMonth ? MONTHS : WEEK_DAYS).includes(upperValue)) {
                            validValues.push(upperValue);
                        }
                    }
                    if (validValues.length > 0) {
                        const uniqueSorted = [...new Set(validValues)].sort((a, b) => (isMonth ? monthOrder : weekdayOrder)[a] - (isMonth ? monthOrder : weekdayOrder)[b]);
                        if (isMonth) {
                            initialState.selectedMonths = uniqueSorted;
                        } else {
                            initialState.selectedWeekdays = uniqueSorted;
                        }
                    }
                } else if (/^[\d\s,]+$/.test(arg1)) {
                    initialState.specificValues = arg1;
                }
            } else if (optionIndex === 4 && arg1 && /^[\d\s,-]+$/.test(arg1)) {
                // Ranges (for day of month)
                initialState.specificValues = arg1;
            } else if (optionIndex === 4 && arg1 && isWeekday && arg2 && WEEK_DAYS.includes(arg1.toUpperCase()) && NTH_OCCURRENCES.includes(arg2)) {
                // Nth occurrence (for day of week)
                initialState.weekday = arg1.toUpperCase();
                initialState.nthOccurrence = arg2;
            } else if (optionIndex === 5 && arg1 && isWeekday && WEEK_DAYS.includes(arg1.toUpperCase())) {
                // Last weekday (for day of week)
                initialState.lastWeekday = arg1.toUpperCase();
            } else if (optionIndex === 5 && arg1 && !isNaN(parseInt(arg1, 10))) {
                // Last (for day of month)
                initialState.lastValue = arg1;
            } else {
                // Invalid parameters, default to every
                initialState.option = TYPE_EVERY;
                initialState.intervalValue = TEXT_ONE;
                initialState.fromValue = isMonth ? 'JAN' : isWeekday ? WEEKDAY_SUN : TEXT_ONE;
                initialState.toValue = isMonth ? 'FEB' : isWeekday ? WEEKDAY_MON : '2';
                initialState.specificValues = isMonth || isWeekday ? TEXT_EMPTY : '1,2,3';
                initialState.lastValue = TEXT_EMPTY;
                initialState.selectedMonths = [];
                initialState.selectedWeekdays = [];
                initialState.weekday = WEEKDAY_MON;
                initialState.nthOccurrence = TEXT_ONE;
                initialState.lastWeekday = WEEKDAY_MON;
            }
        }
    }

    return initialState;
};

export const updateUrlParams = (
    name: string,
    state: CronPartState,
    urlConfig: UrlParamConfig
) => {
    // Check if running in a browser environment
    if (typeof window === 'undefined') {
        return; // Skip URL manipulation in non-browser environments
    }

    const {optionParam, argParams, validOptions} = urlConfig;
    const urlParams = new URLSearchParams(window.location.search);
    const optionIndex = validOptions.indexOf(state.option);
    if (optionIndex === -1) return; // Invalid option
    const sValue = optionIndex.toString();
    urlParams.set(optionParam, sValue);

    // Remove all argument parameters
    argParams.forEach(param => urlParams.delete(param));

    if (state.option === TYPE_INTERVAL && state.intervalValue) {
        urlParams.set(argParams[0], state.intervalValue);
    } else if (state.option === TYPE_BETWEEN && state.fromValue && state.toValue) {
        urlParams.set(argParams[0], state.fromValue);
        urlParams.set(argParams[1], state.toValue);
    } else if (state.option === TYPE_SPECIFIC) {
        let specificStr: string;
        if (name === NAME_MONTH) {
            const sortedMonths = [...state.selectedMonths].sort((a, b) => monthOrder[a] - monthOrder[b]);
            specificStr = sortedMonths.join(',');
        } else if (name === NAME_DAY_OF_WEEK) {
            const sortedWeekdays = [...state.selectedWeekdays].sort((a, b) => weekdayOrder[a] - weekdayOrder[b]);
            specificStr = sortedWeekdays.join(',');
        } else {
            specificStr = state.specificValues;
        }
        if (specificStr) {
            urlParams.set(argParams[0], specificStr);
        }
    } else if (state.option === TYPE_RANGES && state.specificValues) {
        urlParams.set(argParams[0], state.specificValues);
    } else if (state.option === TYPE_NTH && state.weekday && state.nthOccurrence) {
        urlParams.set(argParams[0], state.weekday);
        urlParams.set(argParams[1], state.nthOccurrence);
    } else if (state.option === TYPE_LAST_WEEKDAY && state.lastWeekday) {
        urlParams.set(argParams[0], state.lastWeekday);
    } else if (state.option === TYPE_LAST && state.lastValue) {
        urlParams.set(argParams[0], state.lastValue);
    }

    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.replaceState({}, '', newUrl);
};