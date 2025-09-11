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