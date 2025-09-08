export class CronError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CronError';
    }
}

export interface CronPartOptions {
    type: 'every' | 'interval' | 'between' | 'specific' | 'ranges' | 'nth';
    intervalValue?: number;
    fromValue?: number | string; // Allow string for day of week names
    toValue?: number | string; // Allow string for day of week names
    specificValues?: string;
    weekday?: string;
    nthOccurrence?: string;
}

export class CronUtils {
    /**
     * Validates if a number is within the specified range
     */
    private static validateRange(value: number, part: string, min: number, max: number): void {
        if (value < min || value > max) {
            throw new CronError(`${part} value ${value} is outside the valid range (${min}-${max})`);
        }
    }

    /**
     * Parses and validates specific values string
     */
    private static parseSpecificValues(input: string, part: string, min: number, max: number): string {
        // Check if input contains only numbers, commas, and whitespace
        if (!/^[\d\s,]+$/.test(input)) {
            throw new CronError(`Specific ${part} values can only contain numbers, commas, and whitespace`);
        }

        // Remove whitespace and split by comma
        const values = input.replace(/\s+/g, '').split(',');

        // Convert to numbers and validate
        const numbers: number[] = [];
        for (const value of values) {
            if (value === '') continue; // Skip empty strings from multiple commas

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

        // Sort numerically and remove duplicates
        const uniqueSorted = [...new Set(numbers)].sort((a, b) => a - b);

        return uniqueSorted.join(',');
    }

    /**
     * Parses and validates specific month values (e.g., "JAN,FEB,MAR")
     */
    private static parseSpecificMonthValues(input: string): string {
        const validMonths = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        // Remove whitespace and split by comma
        const values = input.replace(/\s+/g, '').split(',');

        // Validate each month
        const validValues: string[] = [];
        for (const value of values) {
            if (value === '') continue; // Skip empty strings
            const upperValue = value.toUpperCase();
            if (!validMonths.includes(upperValue)) {
                throw new CronError(`Invalid month value: ${value}. Must be one of ${validMonths.join(', ')}`);
            }
            validValues.push(upperValue);
        }

        if (validValues.length === 0) {
            throw new CronError('At least one valid month value is required');
        }

        // Remove duplicates and sort by month index
        const monthOrder = validMonths.reduce((acc, month, index) => ({ ...acc, [month]: index + 1 }), {} as Record<string, number>);
        const uniqueSorted = [...new Set(validValues)].sort((a, b) => monthOrder[a] - monthOrder[b]);

        return uniqueSorted.join(',');
    }

    /**
     * Parses and validates specific day of week values (e.g., "MON,TUE,WED")
     */
    private static parseSpecificDayOfWeekValues(input: string): string {
        const validDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        // Remove whitespace and split by comma
        const values = input.replace(/\s+/g, '').split(',');

        // Validate each day
        const validValues: string[] = [];
        for (const value of values) {
            if (value === '') continue; // Skip empty strings
            const upperValue = value.toUpperCase();
            if (!validDays.includes(upperValue)) {
                throw new CronError(`Invalid day of week value: ${value}. Must be one of ${validDays.join(', ')}`);
            }
            validValues.push(upperValue);
        }

        if (validValues.length === 0) {
            throw new CronError('At least one valid day of week value is required');
        }

        // Remove duplicates and sort by day index
        const dayOrder = validDays.reduce((acc, day, index) => ({ ...acc, [day]: index }), {} as Record<string, number>);
        const uniqueSorted = [...new Set(validValues)].sort((a, b) => dayOrder[a] - dayOrder[b]);

        return uniqueSorted.join(',');
    }

    /**
     * Validates day of week names for between type
     */
    private static validateDayOfWeekRange(fromValue: string, toValue: string): string {
        const validDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

        const fromUpper = fromValue.toUpperCase();
        const toUpper = toValue.toUpperCase();

        if (!validDays.includes(fromUpper)) {
            throw new CronError(`Invalid from day of week: ${fromValue}. Must be one of ${validDays.join(', ')}`);
        }
        if (!validDays.includes(toUpper)) {
            throw new CronError(`Invalid to day of week: ${toValue}. Must be one of ${validDays.join(', ')}`);
        }

        return `${fromUpper}-${toUpper}`;
    }

    /**
     * Parses and validates ranges string (e.g., "1-10,12-14")
     */
    private static parseRanges(input: string, part: string, min: number, max: number): string {
        // Check if input contains only numbers, commas, hyphens, and whitespace
        if (!/^[\d\s,-]+$/.test(input)) {
            throw new CronError(`Ranges for ${part} can only contain numbers, commas, hyphens, and whitespace`);
        }

        // Remove whitespace and split by comma
        const values = input.replace(/\s+/g, '').split(',');

        // Collect and validate ranges
        const ranges: string[] = [];
        for (const value of values) {
            if (value === '') continue; // Skip empty strings

            const parts = value.split('-');
            if (parts.length !== 2) {
                throw new CronError(`Invalid range format in ${part}: '${value}' must be in the form 'num-num'`);
            }

            const start = parseInt(parts[0], 10);
            const end = parseInt(parts[1], 10);
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

        // Sort ranges by starting number
        ranges.sort((a, b) => parseInt(a.split('-')[0], 10) - parseInt(b.split('-')[0], 10));

        return ranges.join(',');
    }

    /**
     * Generates the cron expression for the second part
     */
    static generateSecondExpression(options: CronPartOptions): string {
        switch (options.type) {
            case 'every':
                return '*';

            case 'interval':
                if (options.intervalValue === undefined) {
                    throw new CronError('Interval value is required for interval type');
                }
                this.validateRange(options.intervalValue, 'Second', 1, 59);
                return `0/${options.intervalValue}`;

            case 'between':
                if (options.fromValue === undefined || options.toValue === undefined) {
                    throw new CronError('From and To values are required for between type');
                }
                this.validateRange(options.fromValue as number, 'Second', 0, 59);
                this.validateRange(options.toValue as number, 'Second', 0, 59);

                const fromValue = Math.min(options.fromValue as number, options.toValue as number);
                const toValue = Math.max(options.fromValue as number, options.toValue as number);
                return `${fromValue}-${toValue}`;

            case 'specific':
                if (!options.specificValues) {
                    throw new CronError('Specific values are required for specific type');
                }
                return this.parseSpecificValues(options.specificValues, 'Second', 0, 59);

            default:
                throw new CronError('Invalid cron part type');
        }
    }

    /**
     * Generates the cron expression for the minute part
     */
    static generateMinuteExpression(options: CronPartOptions): string {
        switch (options.type) {
            case 'every':
                return '*';

            case 'interval':
                if (options.intervalValue === undefined) {
                    throw new CronError('Interval value is required for interval type');
                }
                this.validateRange(options.intervalValue, 'Minute', 1, 59);
                return `0/${options.intervalValue}`;

            case 'between':
                if (options.fromValue === undefined || options.toValue === undefined) {
                    throw new CronError('From and To values are required for between type');
                }
                this.validateRange(options.fromValue as number, 'Minute', 0, 59);
                this.validateRange(options.toValue as number, 'Minute', 0, 59);

                const fromValue = Math.min(options.fromValue as number, options.toValue as number);
                const toValue = Math.max(options.fromValue as number, options.toValue as number);
                return `${fromValue}-${toValue}`;

            case 'specific':
                if (!options.specificValues) {
                    throw new CronError('Specific values are required for specific type');
                }
                return this.parseSpecificValues(options.specificValues, 'Minute', 0, 59);

            default:
                throw new CronError('Invalid cron part type');
        }
    }

    /**
     * Generates the cron expression for the hour part
     */
    static generateHourExpression(options: CronPartOptions): string {
        switch (options.type) {
            case 'every':
                return '*';

            case 'interval':
                if (options.intervalValue === undefined) {
                    throw new CronError('Interval value is required for interval type');
                }
                this.validateRange(options.intervalValue, 'Hour', 1, 23);
                return `0/${options.intervalValue}`;

            case 'between':
                if (options.fromValue === undefined || options.toValue === undefined) {
                    throw new CronError('From and To values are required for between type');
                }
                this.validateRange(options.fromValue as number, 'Hour', 0, 23);
                this.validateRange(options.toValue as number, 'Hour', 0, 23);

                const fromValue = Math.min(options.fromValue as number, options.toValue as number);
                const toValue = Math.max(options.fromValue as number, options.toValue as number);
                return `${fromValue}-${toValue}`;

            case 'specific':
                if (!options.specificValues) {
                    throw new CronError('Specific values are required for specific type');
                }
                return this.parseSpecificValues(options.specificValues, 'Hour', 0, 23);

            default:
                throw new CronError('Invalid cron part type');
        }
    }

    /**
     * Generates the cron expression for the day of month part
     */
    static generateDayOfMonthExpression(options: CronPartOptions): string {
        const part = 'Day';
        const min = 1;
        const max = 31;

        switch (options.type) {
            case 'every':
                return '*';

            case 'interval':
                if (options.intervalValue === undefined) {
                    throw new CronError('Interval value is required for interval type');
                }
                this.validateRange(options.intervalValue, part, 1, max);
                return `1/${options.intervalValue}`;

            case 'between':
                if (options.fromValue === undefined || options.toValue === undefined) {
                    throw new CronError('From and To values are required for between type');
                }
                this.validateRange(options.fromValue as number, part, min, max);
                this.validateRange(options.toValue as number, part, min, max);

                const fromValue = Math.min(options.fromValue as number, options.toValue as number);
                const toValue = Math.max(options.fromValue as number, options.toValue as number);
                return `${fromValue}-${toValue}`;

            case 'specific':
                if (!options.specificValues) {
                    throw new CronError('Specific values are required for specific type');
                }
                return this.parseSpecificValues(options.specificValues, part, min, max);

            case 'ranges':
                if (!options.specificValues) {
                    throw new CronError('Range values are required for ranges type');
                }
                return this.parseRanges(options.specificValues, part, min, max);

            default:
                throw new CronError('Invalid cron part type');
        }
    }

    /**
     * Generates the cron expression for the month part
     */
    static generateMonthExpression(options: CronPartOptions): string {
        const validMonths = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        switch (options.type) {
            case 'every':
                return '*';

            case 'interval':
                if (options.intervalValue === undefined) {
                    throw new CronError('Interval value is required for interval type');
                }
                this.validateRange(options.intervalValue, 'Month', 1, 12);
                return `1/${options.intervalValue}`;

            case 'between':
                if (options.fromValue === undefined || options.toValue === undefined) {
                    throw new CronError('From and To values are required for between type');
                }
                this.validateRange(options.fromValue as number, 'Month', 1, 12);
                this.validateRange(options.toValue as number, 'Month', 1, 12);
                const fromValue = Math.min(options.fromValue as number, options.toValue as number);
                const toValue = Math.max(options.fromValue as number, options.toValue as number);
                return `${fromValue}-${toValue}`;

            case 'specific':
                if (!options.specificValues) {
                    throw new CronError('At least one month must be selected');
                }
                return this.parseSpecificMonthValues(options.specificValues);

            default:
                throw new CronError('Invalid cron part type');
        }
    }

    /**
     * Generates the cron expression for the day of week part
     */
    static generateDayOfWeekExpression(options: CronPartOptions): string {
        const validDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const validNthOccurrences = ['1', '2', '3', '4', '5'];
        switch (options.type) {
            case 'every':
                return '*';

            case 'interval':
                if (options.intervalValue === undefined) {
                    throw new CronError('Interval value is required for interval type');
                }
                this.validateRange(options.intervalValue, 'Day of Week', 1, 7);
                return `0/${options.intervalValue}`;

            case 'between':
                if (options.fromValue === undefined || options.toValue === undefined) {
                    throw new CronError('From and To values are required for between type');
                }
                if (typeof options.fromValue !== 'string' || typeof options.toValue !== 'string') {
                    throw new CronError('Day of week range must use day names (e.g., SUN, MON)');
                }
                return this.validateDayOfWeekRange(options.fromValue, options.toValue);

            case 'specific':
                if (!options.specificValues) {
                    throw new CronError('At least one day of week must be selected');
                }
                return this.parseSpecificDayOfWeekValues(options.specificValues);

            case 'nth':
                if (!options.weekday || !options.nthOccurrence) {
                    throw new CronError('Weekday and nth occurrence are required for nth type');
                }
                if (!validDays.includes(options.weekday)) {
                    throw new CronError(`Invalid weekday: ${options.weekday}. Must be one of ${validDays.join(', ')}`);
                }
                if (!validNthOccurrences.includes(options.nthOccurrence)) {
                    throw new CronError(`Invalid nth occurrence: ${options.nthOccurrence}. Must be one of ${validNthOccurrences.join(', ')}`);
                }
                return `${options.weekday}#${options.nthOccurrence}`;

            default:
                throw new CronError('Invalid cron part type');
        }
    }

    /**
     * Helper method to validate input before generating expression for seconds
     */
    static validateSecondOptions(options: CronPartOptions): void {
        try {
            this.generateSecondExpression(options);
        } catch (error) {
            if (error instanceof CronError) {
                throw error;
            }
            throw new CronError('Invalid cron options');
        }
    }

    /**
     * Helper method to validate minute options before generating expression
     */
    static validateMinuteOptions(options: CronPartOptions): void {
        try {
            this.generateMinuteExpression(options);
        } catch (error) {
            if (error instanceof CronError) {
                throw error;
            }
            throw new CronError('Invalid cron options');
        }
    }

    /**
     * Helper method to validate hour options before generating expression
     */
    static validateHourOptions(options: CronPartOptions): void {
        try {
            this.generateHourExpression(options);
        } catch (error) {
            if (error instanceof CronError) {
                throw error;
            }
            throw new CronError('Invalid cron options');
        }
    }

    /**
     * Helper method to validate day of month options before generating expression
     */
    static validateDayOfMonthOptions(options: CronPartOptions): void {
        try {
            this.generateDayOfMonthExpression(options);
        } catch (error) {
            if (error instanceof CronError) {
                throw error;
            }
            throw new CronError('Invalid cron options');
        }
    }

    /**
     * Helper method to validate month options before generating expression
     */
    static validateMonthOptions(options: CronPartOptions): void {
        try {
            this.generateMonthExpression(options);
        } catch (error) {
            if (error instanceof CronError) {
                throw error;
            }
            throw new CronError('Invalid cron options');
        }
    }

    /**
     * Helper method to validate day of week options before generating expression
     */
    static validateDayOfWeekOptions(options: CronPartOptions): void {
        try {
            this.generateDayOfWeekExpression(options);
        } catch (error) {
            if (error instanceof CronError) {
                throw error;
            }
            throw new CronError('Invalid cron options');
        }
    }
}