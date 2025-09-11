import {OptionType} from "./OptionType";

export interface UrlParamConfig {
    optionParam: string;
    argParams: string[];
    validOptions: OptionType[];
    maxVal: number;
}