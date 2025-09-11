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

export const FROM_VALUE_INPUT_FIELD = 'fromValue';
export const TO_VALUE_INPUT_FIELD = 'toValue';
export const INTERVAL_INPUT_FIELD = 'intervalValue';
export const SPECIFIC_VALUE_INPUT_FIELD = 'specificValues';
export const WEEKDAY_INPUT_FIELD = 'weekday';
export const NTH_OCCURRENCE_INPUT_FIELD = 'nthOccurrence';
export const LAST_INPUT_FIELD = 'lastValue';
export const LAST_WEEKDAY_INPUT_FIELD = 'lastWeekday';

export const monthOrder = Object.fromEntries(
    MONTHS.map((month, index) => [month, index + 1])
) as Record<string, number>;

export const weekdayOrder = Object.fromEntries(
    WEEK_DAYS.map((day, index) => [day, index])
) as Record<string, number>;

export const dayOrder = WEEK_DAYS.reduce((acc, day, index) => ({...acc, [day]: index}), {} as Record<string, number>);