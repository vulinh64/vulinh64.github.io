import React from 'react';
import styles from './styles.module.css';
import clsx from "clsx";

// Import:
// import DateCountdown from '@site/src/components/DateCountdown';
// Usage:
// <DateCountdown to='2025-09-16' description='JDK 25 Release Date'></DateCountdown>

interface DateCountdownProps {
    to: string;
    description: string;
}

const DateCountdown: React.FC<DateCountdownProps> = ({to, description}) => {
    const targetDate = new Date(to);
    const currentDate = new Date();

    // Reset time to midnight for accurate day calculation
    targetDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    // Calculate difference in days
    const timeDifference = targetDate.getTime() - currentDate.getTime();
    const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

    return (
        <div className={clsx(styles.container, "margin-top--lg", "margin-bottom--lg")}>
            {daysDifference >= 0 ? (
                <span>Day(s) remaining till <strong>{to}</strong> ({description}): <strong>{daysDifference}</strong> days</span>
            ) : (
                <span>Hey, did you daydream and forget the date <strong>{to}</strong> ({description})? It has been past <strong>{Math.abs(daysDifference)}</strong> days now!</span>
            )}
        </div>
    );
};

export default DateCountdown;