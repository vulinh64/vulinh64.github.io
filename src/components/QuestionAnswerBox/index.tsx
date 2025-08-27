import React, {ReactElement} from "react";
import clsx from "clsx";
import styles from "./styles.module.css";

type QuestionProps = {
    children: React.ReactNode;
};

const Question: React.FC<QuestionProps> = ({children}) => {
    return <div className={styles.question}>{children}</div>;
};

const Answer: React.FC<QuestionProps> = ({children}) => {
    return (
        <div className={styles.answer}>
            <span>{children}</span> {/* Wrap in span to prevent <p> */}
        </div>
    );
};

type QuestionAnswerBoxProps = {
    children:
        | [ReactElement<typeof Question>, ReactElement<typeof Answer>]
        | [ReactElement<typeof Answer>, ReactElement<typeof Question>]; // allow either order
};

const QuestionAnswerBox: React.FC<QuestionAnswerBoxProps> = ({
                                                                 children
                                                             }) => {
    const childrenArray = React.Children.toArray(children) as ReactElement[];

    const question = childrenArray.find(
        (child) => child.type === Question
    ) as ReactElement<typeof Question> | undefined;

    const answer = childrenArray.find(
        (child) => child.type === Answer
    ) as ReactElement<typeof Answer> | undefined;

    return (
        <p>
            <details className={clsx(styles.customDetails)}>
                <summary className={clsx(styles.questionBox)}>
                    <span className={styles.questionIcon}></span>
                    <span className={styles.question}>{question}</span>
                </summary>
                <div className={styles.answerContent}>
                    <span className={styles.answer}>{answer}</span>
                </div>
            </details>
        </p>
    );
};

export {QuestionAnswerBox, Question, Answer};
