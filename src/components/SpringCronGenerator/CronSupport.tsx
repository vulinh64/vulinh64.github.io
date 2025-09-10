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
    typeof TYPE_SPECIFIC | typeof TYPE_RANGES | typeof TYPE_NTH;

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
    error: string;
}

export const WEEKDAY_MON = 'MON';
export const WEEKDAY_SUN = 'SUN';