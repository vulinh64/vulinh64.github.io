import {CronError, CronPartOptions, CronPartState, OptionType, UrlParamConfig} from "./CronSupport";
import {
    CASE_BETWEEN,
    CASE_EVERY,
    CASE_INTERVAL,
    CASE_INTERVAL_BETWEEN,
    CASE_RANGES,
    CASE_SPECIFIC,
    COMMA_DELIMITER,
    DEFAULT_RADIX,
    EVERY_EXPRESSION,
    HYPHEN_DELIMITER,
    MAX_DAYS_OF_MONTH,
    MAX_DAYS_OF_WEEK,
    MAX_HOUR,
    MAX_MONTHS,
    MAX_SECONDS_MINUTES,
    MIN_ONE,
    MIN_TIME,
    MIN_ZERO,
    MONTHS,
    NAME_DAY_OF_MONTH,
    NAME_DAY_OF_WEEK,
    NAME_HOUR,
    NAME_MONTH,
    NTH_OCCURRENCES,
    REGEX_RANGES,
    REGEX_SPECIFIC,
    REGEX_WHITESPACES,
    SPACED_COMMA,
    TEXT_EMPTY,
    TEXT_ONE,
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
    WEEKDAY_MON
} from "./Const";

export class CronUtils {

    public static generateIntervalBetweenExpression(
        options: CronPartOptions,
        part: string,
        minFrom: number,
        maxFrom: number
    ): string {
        if (isAnyNilOrEmpty(options.fromValue, options.toValue, options.intervalValue)) {
            throw new CronError('From, To, and Interval values are required for interval between type');
        }

        this.validateRange(options.fromValue as number, part, minFrom, maxFrom);
        this.validateRange(options.toValue as number, part, minFrom, maxFrom);
        this.validateRange(options.intervalValue as number, part, MIN_ONE, maxFrom);

        return `${Math.min(options.fromValue as number, options.toValue as number)}-${Math.max(options.fromValue as number, options.toValue as number)}/${options.intervalValue}`;
    }

    static validateRange(value: number, part: string, min: number, max: number): void {
        if (value < min || value > max) {
            throw new CronError(`${part} value ${value} is outside the valid range (${min}-${max})`);
        }
    }

    static validateLastWeekday(weekday: string): string {
        const upperWeekday = weekday.toUpperCase();

        if (!WEEK_DAYS.includes(upperWeekday)) {
            throw new CronError(`Invalid weekday for last weekday: ${weekday}. Must be one of ${WEEK_DAYS.join(SPACED_COMMA)}`);
        }

        return `${upperWeekday}L`;
    }

    static parseSpecificValues(options: CronPartOptions, part: string, min: number, max: number): string {
        if (isAnyNilOrEmpty(options.specificValues)) {
            throw new CronError(`Specific values are required for specific type`);
        }

        if (!REGEX_SPECIFIC.test(options.specificValues)) {
            throw new CronError(`Specific ${part} values can only contain numbers, commas, and whitespace`);
        }

        const values = splitByComma(options.specificValues);
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

    static parseSpecificTextValues(
        options: CronPartOptions,
        part: string,
        validValuesSet: readonly string[],
        orderMap: Record<string, number>
    ): string {
        if (isAnyNilOrEmpty(options.specificValues)) {
            throw new CronError(`At least one ${part.toLowerCase()} must be selected`);
        }

        const values = splitByComma(options.specificValues);
        const validValues: string[] = [];

        for (const value of values) {
            if (isAnyNilOrEmpty(value)) {
                continue;
            }
            const upperValue = value.toUpperCase();

            if (!validValuesSet.includes(upperValue)) {
                throw new CronError(`Invalid ${part.toLowerCase()} value: ${value}. Must be one of ${validValuesSet.join(SPACED_COMMA)}`);
            }

            validValues.push(upperValue);
        }

        if (validValues.length === 0) {
            throw new CronError(`At least one valid ${part.toLowerCase()} value is required`);
        }

        const uniqueSorted = [...new Set(validValues)].sort((a, b) => orderMap[a] - orderMap[b]);

        return uniqueSorted.join(COMMA_DELIMITER);
    }

    static parseRanges(input: string, part: string, min: number, max: number): string {
        if (!isOfRangeRegex(input)) {
            throw new CronError(`Ranges for ${part} can only contain numbers, commas, hyphens, and whitespace`);
        }

        const values = splitByComma(input);
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

    static generateTextRangeExpression(options: CronPartOptions, part: string, validValues: readonly string[]): string {
        if (isAnyNilOrEmpty(options.fromValue, options.toValue)) {
            throw new CronError('From and To values are required for between type');
        }

        if (typeof options.fromValue !== 'string' || typeof options.toValue !== 'string') {
            throw new CronError(`${part} range must use text values (e.g., ${validValues[0]}, ${validValues[1]})`);
        }

        const fromUpper = options.fromValue.toUpperCase();
        const toUpper = options.toValue.toUpperCase();

        if (!validValues.includes(fromUpper) || !validValues.includes(toUpper)) {
            throw new CronError(`Invalid ${part.toLowerCase()} value. Must be one of ${validValues.join(SPACED_COMMA)}`);
        }

        return `${fromUpper}-${toUpper}`;
    }

    static generateNumericExpression(
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
                return this.parseSpecificValues(options, part, min, max);

            default:
                throw new CronError('Invalid cron part type');
        }
    }

    static generateTimePartExpression(options: CronPartOptions, part: string, max: number): string {
        switch (options.type) {
            case CASE_EVERY:
            case CASE_INTERVAL:
            case CASE_BETWEEN:
            case CASE_SPECIFIC:
                return this.generateNumericExpression(options, part, MIN_TIME, max);

            case CASE_RANGES:
                if (isAnyNilOrEmpty(options.specificValues)) {
                    throw new CronError('Range values are required for ranges type');
                }

                return this.parseRanges(options.specificValues, part, MIN_TIME, max);

            case CASE_INTERVAL_BETWEEN:
                return this.generateIntervalBetweenExpression(options, part, MIN_TIME, max);

            default:
                throw new CronError(`Invalid cron part type for ${part.toLowerCase()}`);
        }
    }
}

export const isNotBrowser = () => typeof window === 'undefined'

export const isHour = (name: string) => name === NAME_HOUR;

export const isDayOfMonth = (name: string) => name === NAME_DAY_OF_MONTH;

export const isMonth = (name: string) => name === NAME_MONTH;

export const isDayOfWeek = (name: string) => name === NAME_DAY_OF_WEEK;

export const isOptionTypeInterval = (newOption: OptionType) => newOption === TYPE_INTERVAL;

export const isOptionTypeBetween = (newOption: OptionType) => newOption === TYPE_BETWEEN;

export const isOptionTypeSpecific = (newOption: OptionType) => newOption === TYPE_SPECIFIC

export const isOptionTypeIntervalBetween = (newOption: OptionType) => newOption === TYPE_INTERVAL_BETWEEN;

export const isOptionTypeLastOf = (newOption: OptionType) => newOption === TYPE_LAST;

export const getMaxVal = (name: string, config: {
    maxVal: any;
}) => {
    if (isMonth(name)) {
        return MAX_MONTHS
    }

    return isDayOfWeek(name)
        ? MAX_DAYS_OF_WEEK
        : config.maxVal
};

export const handleSpecificSelection = (
    state: CronPartState,
    selectedItems: readonly string[],
    itemName: string,
    options: CronPartOptions
): string => {
    if (state.option === TYPE_SPECIFIC && selectedItems.length === 0) {
        return `At least one ${itemName} must be selected`;
    }

    if (selectedItems.length > 0) {
        options.specificValues = selectedItems.join(',');
    }

    return TEXT_EMPTY;
};

export const monthOrder = Object.fromEntries(
    MONTHS.map((month, index) => [month, index + 1])
) as Record<string, number>;

export const weekdayOrder = Object.fromEntries(
    WEEK_DAYS.map((day, index) => [day, index])
) as Record<string, number>;

export const dayOrder = WEEK_DAYS.reduce((acc, day, index) =>
    ({...acc, [day]: index}), {} as Record<string, number>);

export const getInitialState = (
    name: string,
    urlConfig: UrlParamConfig
): CronPartState => {
    const {optionParam, argParams, validOptions, maxVal} = urlConfig;

    const initialState: CronPartState = {
        option: TYPE_EVERY,
        selectedMonths: [],
        selectedWeekdays: [],
        intervalValue: TEXT_EMPTY,
        fromValue: TEXT_EMPTY,
        toValue: TEXT_EMPTY,
        specificValues: TEXT_EMPTY,
        weekday: WEEKDAY_MON,
        nthOccurrence: TEXT_ONE,
        lastValue: TEXT_EMPTY,
        lastWeekday: WEEKDAY_MON,
        error: TEXT_EMPTY
    };

    // Check if running in a browser environment
    if (isNotBrowser()) {
        return initialState; // Return default state for non-browser environments
    }

    const urlParams = new URLSearchParams(window.location.search);

    const optionIndex = parseInt(urlParams.get(optionParam) || '-1', DEFAULT_RADIX);
    const [arg1, arg2, arg3] = argParams.map(param => urlParams.get(param));

    if (optionIndex < 0 || optionIndex >= validOptions.length || !validOptions[optionIndex]) {
        return initialState;
    }

    const option = validOptions[optionIndex];

    if (!option) {
        return initialState;
    }

    const isAsDayOfWeek = isDayOfWeek(name);
    const isFieldMonth = isMonth(name);
    const isMonthOrWeekday = isFieldMonth || isAsDayOfWeek;

    if (isMonthOrWeekday && urlParams.has(optionParam)) {
        const validations = {
            [TYPE_INTERVAL]: () => isValidInterval(arg1, maxVal),
            [TYPE_BETWEEN]: () => isValidBetween(name, arg1, arg2),
            [TYPE_SPECIFIC]: () => isValidSpecific(name, arg1),
            [TYPE_NTH]: () => isAsDayOfWeek && isValidNth(arg1, arg2),
            [TYPE_LAST_WEEKDAY]: () => isAsDayOfWeek && isValidLastWeekday(arg1),
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
                    const values = splitByComma(arg1);
                    const validValues = values.filter(v => v !== TEXT_EMPTY && (isFieldMonth ? MONTHS : WEEK_DAYS).includes(v.toUpperCase())).map(v => v.toUpperCase());

                    if (validValues.length > 0) {
                        const order = isFieldMonth ? monthOrder : weekdayOrder;
                        const uniqueSorted = [...new Set(validValues)].sort((a, b) => order[a] - order[b]);
                        if (isFieldMonth) {
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
            if (isAllValid(arg1) && isOfRangeRegex(arg1)) {
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

        case TYPE_INTERVAL_BETWEEN: // For seconds
            if (isValidIntervalBetween(arg1, arg2, arg3, name)) {
                initialState.fromValue = arg1;
                initialState.toValue = arg2;
                initialState.intervalValue = arg3;
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
    if (isNotBrowser()) {
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

        case TYPE_INTERVAL_BETWEEN:
            if (isAllValid(state.fromValue, state.toValue, state.intervalValue)) {
                urlParams.set(argParams[0], state.fromValue);
                urlParams.set(argParams[1], state.toValue);
                urlParams.set(argParams[2], state.intervalValue);
            }

            break;
    }

    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;

    window.history.replaceState({}, TEXT_EMPTY, newUrl);
};

export const isAnyNilOrEmpty = (...values: unknown[]): boolean => values && values.some(v => v === null || v === undefined || typeof v === 'string' && v.trim() === TEXT_EMPTY)

const splitByComma = (val: string) => val.replace(REGEX_WHITESPACES, TEXT_EMPTY).split(COMMA_DELIMITER);

const isOfRangeRegex = (val: string) => REGEX_RANGES.test((val)!);

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

const isValidIntervalBetween = (arg1: string | null, arg2: string | null, arg3: string | null, name: string): boolean => {
    if (isAnyNilOrEmpty(arg1, arg2, arg3)) {
        return false;
    }

    const from = parseInt(arg1, DEFAULT_RADIX);
    const to = parseInt(arg2, DEFAULT_RADIX);
    const interval = parseInt(arg3, DEFAULT_RADIX);

    let maxVal = MAX_SECONDS_MINUTES;
    if (isHour(name)) {
        maxVal = MAX_HOUR;
    } else if (isDayOfMonth(name)) {
        maxVal = MAX_DAYS_OF_MONTH;
    }

    const minVal = isDayOfMonth(name) ? MIN_ONE : MIN_ZERO;

    return !isNaN(from) && !isNaN(to) && !isNaN(interval) &&
        from >= minVal && from <= maxVal &&
        to >= minVal && to <= maxVal &&
        interval >= 1 && interval <= maxVal;
};

const getSpecificValuesString = (name: string, state: CronPartState): string => {
    switch (name) {
        case NAME_MONTH: {
            // Sort months by their defined order before joining
            const sortedMonths = [...state.selectedMonths].sort((a, b) => monthOrder[a] - monthOrder[b]);
            return sortedMonths.join(',');
        }
        case NAME_DAY_OF_WEEK: {
            // Sort weekdays by their defined order before joining
            const sortedWeekdays = [...state.selectedWeekdays].sort((a, b) => weekdayOrder[a] - weekdayOrder[b]);
            return sortedWeekdays.join(',');
        }
        default:
            return state.specificValues;
    }
};