import {isNullOrUndefined} from "util";
import reqwest from "reqwest";

export interface IStringTMap<T> {
    [key: string]: T;
}
export interface INumberTMap<T> {
    [key: number]: T;
}

export interface IStringAnyMap extends IStringTMap<any> {
}
export interface INumberAnyMap extends INumberTMap<any> {
}

export interface IStringStringMap extends IStringTMap<string> {
}
export interface INumberStringMap extends INumberTMap<string> {
}

export interface IStringNumberMap extends IStringTMap<number> {
}
export interface INumberNumberMap extends INumberTMap<number> {
}

export interface IStringBooleanMap extends IStringTMap<boolean> {
}

export interface INumberBooleanMap extends INumberTMap<boolean> {
}

export interface TreeNode {
    label: string;
    value: string;
    key: string;
    children?: TreeNode[];
}

// golang NullString
export interface NullString {
    String: string;
    Valid: boolean;
}

// server result
export interface ServerResult {
    msg: string;
    data: any;
}

// alert
export interface IAlert {
    type: "success" | "error" | "info" | "warning";
    messages: string[];
}

// getArray assign the array to given variable
export function GetArray(url: string, variable: any[], callback: Function) {
    reqwest({
        method: "post",
        url: url, success: (result) => {
            variable.splice(0, variable.length);
            Array.prototype.push.apply(variable, result.data);
            return callback(variable);
        }
    });
}

export function GetNullString(val: NullString) {
    if (!isNullOrUndefined(val)) {
        return val.String;
    }
    return '';
}

export function RandomStr() {
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
