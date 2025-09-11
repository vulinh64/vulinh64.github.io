import {
    TYPE_BETWEEN,
    TYPE_EVERY,
    TYPE_INTERVAL,
    TYPE_LAST,
    TYPE_LAST_WEEKDAY,
    TYPE_NTH,
    TYPE_RANGES,
    TYPE_SPECIFIC
} from "../CronSupport";

export type OptionType = typeof TYPE_EVERY | typeof TYPE_INTERVAL | typeof TYPE_BETWEEN |
    typeof TYPE_SPECIFIC | typeof TYPE_RANGES | typeof TYPE_NTH | typeof TYPE_LAST | typeof TYPE_LAST_WEEKDAY;