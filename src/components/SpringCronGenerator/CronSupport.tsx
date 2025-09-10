export const WEEK_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

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

export class CronError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CronError';
    }
}

export interface CronPartProps {
    name: string;
    plural: string;
    onExpressionChange: (expression: string) => void;
}

export type CronExpressions = {
    readonly second: string;
    readonly minute: string;
    readonly hour: string;
    readonly dayOfMonth: string;
    readonly month: string;
    readonly dayOfWeek: string;
};

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

export const monthOrder = Object.fromEntries(
    MONTHS.map((month, index) => [month, index + 1])
) as Record<string, number>;

export const weekdayOrder = Object.fromEntries(
    WEEK_DAYS.map((day, index) => [day, index])
) as Record<string, number>;

export const dayOrder = WEEK_DAYS.reduce((acc, day, index) => ({...acc, [day]: index}), {} as Record<string, number>);