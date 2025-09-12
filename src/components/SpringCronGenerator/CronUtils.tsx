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
    CronError,
    CronPartOptions,
    CronPartState,
    dayOrder,
    DEFAULT_RADIX,
    EVERY_EXPRESSION,
    HYPHEN_DELIMITER,
    MAX_DAYS_OF_MONTH,
    MAX_DAYS_OF_WEEK,
    MAX_MONTHS,
    MIN_ONE,
    monthOrder,
    MONTHS,
    NAME_DAY_OF_WEEK,
    NAME_MONTH,
    NTH_OCCURRENCES,
    PART_DAY,
    PART_DAY_OF_WEEK,
    PART_HOUR,
    PART_LAST_DAY_OFFSET,
    PART_MINUTE,
    PART_MONTH,
    PART_SECOND,
    REGEX_RANGES,
    REGEX_SPECIFIC,
    REGEX_WHITESPACES,
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
    UrlParamConfig,
    WEEK_DAYS,
    WEEKDAY_MON,
    WEEKDAY_SUN,
    weekdayOrder
} from "./CronSupport";

export class CronUtils {

    private static validateRange(value: number, part: string, min: number, max: number): void {
        if (value < min || value > max) {
            throw new CronError(`${part} value ${value} is outside the valid range (${min}-${max})`);
        }
    }

    private static parseSpecificValues(input: string, part: string, min: number, max: number): string {
        if (!REGEX_SPECIFIC.test(input)) {
            throw new CronError(`Specific ${part} values can only contain numbers, commas, and whitespace`);
        }

        const values = input.replace(REGEX_WHITESPACES, TEXT_EMPTY).split(COMMA_DELIMITER);
        const numbers: number[] = [];

        for (const value of values) {
            if (isAnyNilOrEmpty(values)) {
                continue;
            }

            const num = parseInt(value, DEFAULT_RADIX);

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
        const values = input.replace(REGEX_WHITESPACES, TEXT_EMPTY).split(COMMA_DELIMITER);
        const validValues: string[] = [];

        for (const value of values) {
            if (isAnyNilOrEmpty(value)) {
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
        const values = input.replace(REGEX_WHITESPACES, TEXT_EMPTY).split(COMMA_DELIMITER);
        const validValues: string[] = [];

        for (const value of values) {
            if (isAnyNilOrEmpty(value)) {
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
        if (!REGEX_RANGES.test(input)) {
            throw new CronError(`Ranges for ${part} can only contain numbers, commas, hyphens, and whitespace`);
        }

        const values = input.replace(REGEX_WHITESPACES, TEXT_EMPTY).split(COMMA_DELIMITER);
        const ranges: string[] = [];

        for (const value of values) {
            if (isAnyNilOrEmpty(value)) {
                continue;
            }

            const parts = value.split(HYPHEN_DELIMITER);

            if (parts.length !== 2) {
                throw new CronError(`Invalid range format in ${part}: '${value}' must be in the form 'num-num'`);
            }

            const start = parseInt(parts[0], DEFAULT_RADIX);
            const end = parseInt(parts[MIN_ONE], DEFAULT_RADIX);

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

        ranges.sort((a, b) => parseInt(a.split(HYPHEN_DELIMITER)[0], DEFAULT_RADIX) - parseInt(b.split(HYPHEN_DELIMITER)[0], DEFAULT_RADIX));

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
                if (isAnyNilOrEmpty(options.intervalValue)) {
                    throw new CronError('Interval value is required for interval type');
                }

                this.validateRange(options.intervalValue, part, MIN_ONE, max);

                return `${intervalStart}/${options.intervalValue}`;

            case CASE_BETWEEN:
                if (isAnyNilOrEmpty(options.fromValue, options.toValue)) {
                    throw new CronError('From and To values are required for between type');
                }

                this.validateRange(options.fromValue as number, part, min, max);
                this.validateRange(options.toValue as number, part, min, max);

                return `${Math.min(options.fromValue as number, options.toValue as number)}-${Math.max(options.fromValue as number, options.toValue as number)}`;

            case CASE_SPECIFIC:
                if (isAnyNilOrEmpty(options.specificValues)) {
                    throw new CronError(`Specific values are required for specific type`);
                }

                return this.parseSpecificValues(options.specificValues, part, min, max);

            default:
                throw new CronError('Invalid cron part type');
        }
    }

    static generateSecondExpression(options: CronPartOptions): string {
        switch (options.type) {
            case CASE_EVERY:
            case CASE_INTERVAL:
            case CASE_BETWEEN:
            case CASE_SPECIFIC:
                return this.generateNumericExpression(options, PART_SECOND, 0, 59);

            case CASE_RANGES:
                if (isAnyNilOrEmpty(options.specificValues)) {
                    throw new CronError('Range values are required for ranges type');
                }

                return this.parseRanges(options.specificValues, PART_SECOND, 0, 59);

            default:
                throw new CronError('Invalid cron part type for second');
        }
    }

    static generateMinuteExpression(options: CronPartOptions): string {
        switch (options.type) {
            case CASE_EVERY:
            case CASE_INTERVAL:
            case CASE_BETWEEN:
            case CASE_SPECIFIC:
                return this.generateNumericExpression(options, PART_MINUTE, 0, 59);

            case CASE_RANGES:
                if (isAnyNilOrEmpty(options.specificValues)) {
                    throw new CronError('Range values are required for ranges type');
                }

                return this.parseRanges(options.specificValues, PART_MINUTE, 0, 59);

            default:
                throw new CronError('Invalid cron part type for minute');
        }
    }

    static generateHourExpression(options: CronPartOptions): string {
        switch (options.type) {
            case CASE_EVERY:
            case CASE_INTERVAL:
            case CASE_BETWEEN:
            case CASE_SPECIFIC:
                return this.generateNumericExpression(options, PART_HOUR, 0, 23);

            case CASE_RANGES:
                if (isAnyNilOrEmpty(options.specificValues)) {
                    throw new CronError('Range values are required for ranges type');
                }

                return this.parseRanges(options.specificValues, PART_HOUR, 0, 23);

            default:
                throw new CronError('Invalid cron part type for hour');
        }
    }

    static generateDayOfMonthExpression(options: CronPartOptions): string {
        switch (options.type) {
            case CASE_EVERY:
            case CASE_INTERVAL:
            case CASE_BETWEEN:
            case CASE_SPECIFIC:
                return this.generateNumericExpression(options, PART_DAY, MIN_ONE, MAX_DAYS_OF_MONTH, 1);

            case CASE_RANGES:
                if (isAnyNilOrEmpty(options.specificValues)) {
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
                if (isAnyNilOrEmpty(options.intervalValue)) {
                    throw new CronError('Interval value is required for interval type');
                }

                this.validateRange(options.intervalValue, PART_MONTH, MIN_ONE, MAX_MONTHS);

                return `1/${options.intervalValue}`;

            case CASE_BETWEEN:
                if (isAnyNilOrEmpty(options.fromValue, options.toValue)) {
                    throw new CronError('From and To values are required for between type');
                }

                if (typeof options.fromValue !== 'string' || typeof options.toValue !== 'string') {
                    throw new CronError('Month range must use month names (e.g., JAN, FEB)');
                }

                return this.validateMonthRange(options.fromValue, options.toValue);

            case CASE_SPECIFIC:
                if (isAnyNilOrEmpty(options.specificValues)) {
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
                if (isAnyNilOrEmpty(options.fromValue, options.toValue)) {
                    throw new CronError('From and To values are required for between type');
                }

                if (typeof options.fromValue !== 'string' || typeof options.toValue !== 'string') {
                    throw new CronError('Day of week range must use day names (e.g., SUN, MON)');
                }

                return this.validateDayOfWeekRange(options.fromValue, options.toValue);

            case CASE_SPECIFIC:
                if (isAnyNilOrEmpty(options.specificValues)) {
                    throw new CronError('At least one day of week must be selected');
                }

                return this.parseSpecificDayOfWeekValues(options.specificValues);

            case CASE_NTH:
                if (isAnyNilOrEmpty(options.weekday, options.nthOccurrence)) {
                    throw new CronError('Weekday and nth occurrence are required for nth type');
                }

                if (!WEEK_DAYS.includes(options.weekday!)) {
                    throw new CronError(`Invalid weekday: ${options.weekday}. Must be one of ${WEEK_DAYS.join(SPACED_COMMA)}`);
                }

                if (!validNthOccurrences.includes(options.nthOccurrence!)) {
                    throw new CronError(`Invalid nth occurrence: ${options.nthOccurrence}. Must be one of ${validNthOccurrences.join(SPACED_COMMA)}`);
                }

                return `${options.weekday}#${options.nthOccurrence}`;

            case CASE_LAST_WEEKDAY:
                if (isAnyNilOrEmpty(options.lastWeekday)) {
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

    const optionIndex = parseInt(urlParams.get(optionParam) || '-1', DEFAULT_RADIX);
    const [arg1, arg2] = argParams.map(param => urlParams.get(param));

    if (optionIndex < 0 || optionIndex >= validOptions.length || !validOptions[optionIndex]) {
        return initialState;
    }

    const option = validOptions[optionIndex];

    // Validate arguments for the given option and return default state if invalid
    const isMonthOrWeekday = isMonth || isWeekday;
    if (isMonthOrWeekday && urlParams.has(optionParam)) {
        const validations = {
            [TYPE_INTERVAL]: () => isValidInterval(arg1, maxVal),
            [TYPE_BETWEEN]: () => isValidBetween(name, arg1, arg2),
            [TYPE_SPECIFIC]: () => isValidSpecific(name, arg1),
            [TYPE_NTH]: () => name === NAME_DAY_OF_WEEK && isValidNth(arg1, arg2),
            [TYPE_LAST_WEEKDAY]: () => name === NAME_DAY_OF_WEEK && isValidLastWeekday(arg1),
        };

        if (validations[option] && !validations[option]()) {
            return initialState;
        }
    }

    initialState.option = option;

    switch (option) {
        case TYPE_INTERVAL:
            if (isValidInterval(arg1, maxVal)) {
                initialState.intervalValue = arg1;
            }

            break;

        case TYPE_BETWEEN:
            if (isValidBetween(name, arg1, arg2)) {
                initialState.fromValue = arg1.toUpperCase();
                initialState.toValue = arg2.toUpperCase();
            }

            break;

        case TYPE_SPECIFIC:
            if (isValidSpecific(name, arg1)) {
                if (isMonthOrWeekday) {
                    const values = arg1.replace(REGEX_WHITESPACES, TEXT_EMPTY).split(',');
                    const validValues = values.filter(v => v !== TEXT_EMPTY && (isMonth ? MONTHS : WEEK_DAYS).includes(v.toUpperCase())).map(v => v.toUpperCase());

                    if (validValues.length > 0) {
                        const uniqueSorted = [...new Set(validValues)].sort((a, b) => (isMonth ? monthOrder : weekdayOrder)[a] - (isMonth ? monthOrder : weekdayOrder)[b]);

                        if (isMonth) {
                            initialState.selectedMonths = uniqueSorted;
                        } else {
                            initialState.selectedWeekdays = uniqueSorted;
                        }
                    }
                } else if (REGEX_SPECIFIC.test(arg1)) {
                    initialState.specificValues = arg1;
                }
            }

            break;

        case TYPE_RANGES: // For day of month
            if (isAllValid(arg1) && REGEX_RANGES.test((arg1)!)) {
                initialState.specificValues = arg1;
            }

            break;

        case TYPE_NTH: // For day of week
            if (isValidNth(arg1, arg2)) {
                initialState.weekday = arg1.toUpperCase();
                initialState.nthOccurrence = arg2;
            }

            break;

        case TYPE_LAST_WEEKDAY: // For day of week
            if (isValidLastWeekday(arg1)) {
                initialState.lastWeekday = arg1.toUpperCase();
            }

            break;

        case TYPE_LAST: // For day of month
            if (arg1 && !isNaN(parseInt(arg1, DEFAULT_RADIX))) {
                initialState.lastValue = arg1;
            }

            break;
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

    if (optionIndex === -1) {
        return;
    }

    urlParams.set(optionParam, optionIndex.toString());

    // Remove all argument parameters
    argParams.forEach(param => urlParams.delete(param));

    switch (state.option) {
        case TYPE_INTERVAL:
            if (isAllValid(state.intervalValue)) {
                urlParams.set(argParams[0], state.intervalValue);
            }

            break;

        case TYPE_BETWEEN:
            if (isAllValid(state.fromValue, state.toValue)) {
                urlParams.set(argParams[0], state.fromValue);
                urlParams.set(argParams[1], state.toValue);
            }

            break;

        case TYPE_SPECIFIC:
            const specificStr = getSpecificValuesString(name, state);

            if (isAllValid(specificStr)) {
                urlParams.set(argParams[0], specificStr);
            }

            break;

        case TYPE_RANGES:
            if (isAllValid(state.specificValues)) {
                urlParams.set(argParams[0], state.specificValues);
            }

            break;

        case TYPE_NTH:
            if (isAllValid(state.weekday, state.nthOccurrence)) {
                urlParams.set(argParams[0], state.weekday);
                urlParams.set(argParams[1], state.nthOccurrence);
            }

            break;

        case TYPE_LAST_WEEKDAY:
            if (isAllValid(state.lastWeekday)) {
                urlParams.set(argParams[0], state.lastWeekday);
            }

            break;

        case TYPE_LAST:
            if (isAllValid(state.lastValue)) {
                urlParams.set(argParams[0], state.lastValue);
            }

            break;
    }

    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;

    window.history.replaceState({}, TEXT_EMPTY, newUrl);
};

export const isAnyNilOrEmpty = (...values: unknown[]): boolean => values && values.some(v => v === null || v === undefined || typeof v === 'string' && v.trim() === TEXT_EMPTY)

const isAllValid = (...values: unknown[]): boolean => !isAnyNilOrEmpty(values);

const isValidInterval = (arg1: string | null, maxVal: number): boolean => {
    if (isAnyNilOrEmpty(arg1)) {
        return false;
    }

    const num = parseInt(arg1, DEFAULT_RADIX);

    return !isNaN(num) && num >= 1 && num <= maxVal;
};

const isValidBetween = (name: string, arg1: string | null, arg2: string | null): boolean => {
    if (isAnyNilOrEmpty(arg1, arg2)) {
        return false;
    }

    let up1 = arg1.toUpperCase();
    let up2 = arg2.toUpperCase();

    switch (name) {
        case NAME_MONTH:
            return MONTHS.includes(up1) && MONTHS.includes(up2);

        case NAME_DAY_OF_WEEK:
            return WEEK_DAYS.includes(up1) && WEEK_DAYS.includes(up2);

        default:
            return !isNaN(parseInt(arg1, DEFAULT_RADIX)) && !isNaN(parseInt(arg2, DEFAULT_RADIX));
    }
};

const isValidSpecific = (name: string, arg1: string | null): boolean => {
    if (isAnyNilOrEmpty(arg1)) {
        return false;
    }

    switch (name) {
        case NAME_MONTH:
            return arg1.split(',').every(val => val.trim() === TEXT_EMPTY || MONTHS.includes(val.toUpperCase()));

        case NAME_DAY_OF_WEEK:
            return arg1.split(',').every(val => val.trim() === TEXT_EMPTY || WEEK_DAYS.includes(val.toUpperCase()));

        default:
            return REGEX_SPECIFIC.test(arg1);
    }

};

const isValidNth = (arg1: string | null, arg2: string | null): boolean => {
    return isAllValid(arg1, arg2) && WEEK_DAYS.includes(arg1.toUpperCase()) && NTH_OCCURRENCES.includes(arg2);
};

const isValidLastWeekday = (arg1: string | null): boolean => {
    return isAllValid(arg1) && WEEK_DAYS.includes(arg1.toUpperCase());
};

const getSpecificValuesString = (name: string, state: CronPartState): string => {
    if (name === NAME_MONTH) {
        // Sort months by their defined order before joining
        const sortedMonths = [...state.selectedMonths].sort((a, b) => monthOrder[a] - monthOrder[b]);

        return sortedMonths.join(',');
    }

    if (name === NAME_DAY_OF_WEEK) {
        // Sort weekdays by their defined order before joining
        const sortedWeekdays = [...state.selectedWeekdays].sort((a, b) => weekdayOrder[a] - weekdayOrder[b]);

        return sortedWeekdays.join(',');
    }

    return state.specificValues;
};