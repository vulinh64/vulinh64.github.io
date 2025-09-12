import React, {useCallback, useMemo, useState} from 'react';
import styles from './SpringCronGenerator.module.css';
import clsx from 'clsx';
import {CronExpressions, CronPart} from './CronSupport';
import {
    EVERY_EXPRESSION,
    NAME_DAY_OF_MONTH,
    NAME_DAY_OF_WEEK,
    NAME_HOUR,
    NAME_MINUTE,
    NAME_MONTH,
    NAME_SECOND
} from "./Const";

const CronGeneratorPage: React.FC = () => {
    const [copied, setCopied] = useState(false);
    const [cronExpressions, setCronExpressions] = useState<CronExpressions>({
        second: EVERY_EXPRESSION,
        minute: EVERY_EXPRESSION,
        hour: EVERY_EXPRESSION,
        dayOfMonth: EVERY_EXPRESSION,
        month: EVERY_EXPRESSION,
        dayOfWeek: EVERY_EXPRESSION
    });

    const cronExpression = useMemo(() =>
            `${cronExpressions.second} ${cronExpressions.minute} ${cronExpressions.hour} ${cronExpressions.dayOfMonth} ${cronExpressions.month} ${cronExpressions.dayOfWeek}`,
        [cronExpressions]
    );

    const handleExpressionChange = useCallback((part: keyof CronExpressions, expression: string) => {
        setCronExpressions(prev => ({
            ...prev,
            [part]: expression
        }));
    }, []);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(cronExpression);
            setCopied(true);
            setTimeout(() => setCopied(false), 1000);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    }, [cronExpression]);

    return (
        <div className={clsx(styles.pageContainer, 'margin-top--xl', 'margin-bottom--md')}>
            <h1 className={clsx(styles.textCenter, 'margin-top--sm', 'margin-bottom--md')}>
                Spring Cron Expression Generator
            </h1>

            <fieldset className={styles.resultContainer}>
                <legend>Result</legend>
                <div className={styles.codeBlockContainer}>
                    <pre className={styles.resultCode}>
                        <code>{cronExpression}</code>
                        <button
                            className={clsx(styles.copyButton, {[styles.copied]: copied})}
                            onClick={handleCopy}
                            aria-label={copied ? 'Copied' : 'Copy'}
                            type="button"
                        />
                    </pre>
                </div>
            </fieldset>

            <CronPart
                name={NAME_SECOND}
                plural="seconds"
                onExpressionChange={(expr: string) => handleExpressionChange(NAME_SECOND, expr)}
            />
            <CronPart
                name={NAME_MINUTE}
                plural="minutes"
                onExpressionChange={(expr: string) => handleExpressionChange(NAME_MINUTE, expr)}
            />
            <CronPart
                name={NAME_HOUR}
                plural="hours"
                onExpressionChange={(expr: string) => handleExpressionChange(NAME_HOUR, expr)}
            />
            <CronPart
                name={NAME_DAY_OF_MONTH}
                plural="days"
                onExpressionChange={(expr: string) => handleExpressionChange('dayOfMonth', expr)}
            />
            <CronPart
                name={NAME_MONTH}
                plural="months"
                onExpressionChange={(expr: string) => handleExpressionChange(NAME_MONTH, expr)}
            />
            <CronPart
                name={NAME_DAY_OF_WEEK}
                plural="days of week"
                onExpressionChange={(expr: string) => handleExpressionChange('dayOfWeek', expr)}
            />
        </div>
    );
};

export default CronGeneratorPage;