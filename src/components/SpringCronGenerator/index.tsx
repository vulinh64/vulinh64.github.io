import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
    NAME_SECOND,
    QUARTZ_WILDCARD
} from "./Const";

const CronGeneratorPage: React.FC = () => {
    const [copied, setCopied] = useState(false);
    const [quartzMode, setQuartzMode] = useState(false);
    const [quartzActiveField, setQuartzActiveField] = useState<'dayOfMonth' | 'dayOfWeek' | null>(null);

    // Sync quartzMode from URL after hydration
    useEffect(() => {
        const fromUrl = new URLSearchParams(window.location.search).get('quartz') === 'on';
        if (fromUrl !== quartzMode) {
            setQuartzMode(fromUrl);
        }
    }, []);
    const [cronExpressions, setCronExpressions] = useState<CronExpressions>({
        second: EVERY_EXPRESSION,
        minute: EVERY_EXPRESSION,
        hour: EVERY_EXPRESSION,
        dayOfMonth: EVERY_EXPRESSION,
        month: EVERY_EXPRESSION,
        dayOfWeek: EVERY_EXPRESSION
    });

    const prevQuartzModeRef = useRef(quartzMode);
    useEffect(() => {
        const prev = prevQuartzModeRef.current;
        prevQuartzModeRef.current = quartzMode;

        if (!prev && quartzMode) {
            // OFF → ON: dayOfMonth takes priority
            const dom = cronExpressions.dayOfMonth;
            const dow = cronExpressions.dayOfWeek;
            if (dom === EVERY_EXPRESSION && dow !== EVERY_EXPRESSION) {
                setQuartzActiveField('dayOfWeek');
            } else {
                setQuartzActiveField('dayOfMonth');
            }
        } else if (prev && !quartzMode) {
            // ON → OFF: clear active field
            setQuartzActiveField(null);
        }

        // Persist quartzMode in URL
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            if (quartzMode) {
                urlParams.set('quartz', 'on');
            } else {
                urlParams.delete('quartz');
            }
            window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
        }
    }, [quartzMode]);

    const cronExpression = useMemo(() => {
        let dom = cronExpressions.dayOfMonth;
        let dow = cronExpressions.dayOfWeek;
        if (quartzMode && dom === QUARTZ_WILDCARD && dow === QUARTZ_WILDCARD) {
            dom = EVERY_EXPRESSION; // both unspecified: dayOfMonth falls back to *, dayOfWeek keeps ?
        }
        return `${cronExpressions.second} ${cronExpressions.minute} ${cronExpressions.hour} ${dom} ${cronExpressions.month} ${dow}`;
    }, [cronExpressions, quartzMode]);

    const handleExpressionChange = useCallback((part: keyof CronExpressions, expression: string) => {
        if (quartzMode && (part === 'dayOfMonth' || part === 'dayOfWeek')) {
            if (expression !== QUARTZ_WILDCARD) {
                setQuartzActiveField(part as 'dayOfMonth' | 'dayOfWeek');
            } else if (quartzActiveField === part) {
                setQuartzActiveField(null);
            }
        }
        setCronExpressions(prev => ({
            ...prev,
            [part]: expression
        }));
    }, [quartzMode, quartzActiveField]);

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
                <div className={styles.toggleContainer}>
                    <label className={styles.toggleSwitch}>
                        <input
                            type="checkbox"
                            checked={quartzMode}
                            onChange={(e: { target: { checked: boolean } }) => setQuartzMode(e.target.checked)}
                        />
                        <span className={styles.toggleSlider}/>
                    </label>
                    <span className={styles.toggleLabel}>Quartz style</span>
                </div>
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
                quartzMode={quartzMode}
                quartzForceUnspecified={quartzMode && quartzActiveField === 'dayOfWeek'}
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
                quartzMode={quartzMode}
                quartzForceUnspecified={quartzMode && quartzActiveField === 'dayOfMonth'}
                onExpressionChange={(expr: string) => handleExpressionChange('dayOfWeek', expr)}
            />
        </div>
    );
};

export default CronGeneratorPage;