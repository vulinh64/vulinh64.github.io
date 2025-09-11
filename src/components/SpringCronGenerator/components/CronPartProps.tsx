export interface CronPartProps {
    name: string;
    plural: string;
    onExpressionChange: (expression: string) => void;
}