import * as React from 'react';
import {Input, Form, InputNumber, Select, DatePicker, Cascader, TreeSelect, Checkbox} from 'antd';
import moment from 'moment';
import {CascaderOptionType} from 'antd/lib/cascader';
import {TreeData} from 'antd/lib/tree-select/interface';
import {isArray, isFunction, isNullOrUndefined, isObject, isUndefined} from 'util';
import update from 'immutability-helper';
import {IStringAnyMap, IStringStringMap} from './commons';

export interface ColumnField {
    id: string;                     // the id of the input
    type: FieldType;
    label?: string; // the name of the field
    hide?: boolean; // field will be hidden
    defaultValue?: number | string | boolean; // the defaultValue value of the field
    props?: Object;  // the props of input element
    fieldProps?: { 'rules': IStringAnyMap[] }; // ones of getFieldDecorator using.
    // if the data from parent, using with parentField, the data need to use from parent, using with parentField
    isParentData?: boolean;
    parentField?: string; // using with isParentData
    // used as array, object, will expanded according the input element type;
    // if it is a function, it will be executed to get the values.
    values?: CascaderOptionType[] | TreeData[] | Object ;
    valueFunc?: () => TreeData[] | CascaderOptionType[] | Object;
    // a function to render defaultData, the first param is the default value,
    // the second is the all form fields
    // the third is the initialData of all form fields
    render?: (val: any, forms?: IStringAnyMap, initData?: IStringAnyMap) => any;
    // a function to handle the submit data, the first param is the value of the field
    // the second is the all form fields
    submit?: (val: any, forms?: IStringAnyMap) => any;
}

export enum FieldType {
    Text, Radio, Select, MultiSelect, Number, Date, DateTime, FormText, Cascader, TreeSelect, InputNumber,
    DateTimeRange, Password, Checkbox
}

// getFormItems return FormItems according the item config.
// getFieldDecorator is the getFieldDecorator function,
// formOptions is the collection of item configs,
// parentData is the parent data of items,
// initData is for initializing the items, itemOptions is the item options for all the items.
export function getFormItems(getFieldDecorator: Function, formOptions: ColumnField[], parentData?: IStringStringMap,
                             initData?: IStringStringMap, formItemLayout?: Object, itemOptions?: Object): any[] {
    let components: any[] = [];
    for (let i = 0, len = formOptions.length; i < len; i++) {
        let v = formOptions[i];
        let element;
        let defaultData;
        // init Data if has
        if (initData && initData[v.id]) {
            defaultData = initData[v.id];
        }
        // for parentField, if there are no initData, using parentData instead,
        // this always happens when adding but not editing
        if (defaultData && v.isParentData && parentData && v.parentField && parentData[v.parentField]) {
            defaultData = parentData[v.parentField];
        }
        // using default data if there is no valid initial data
        if (isNullOrUndefined(defaultData) && !isNullOrUndefined(v.defaultValue)) {
            defaultData = v.defaultValue;
        }
        // if there is render function, render it
        if (v.render && isFunction(v.render)) {
            defaultData = v.render(defaultData, formOptions, initData);
        }

        // handle values for select, multipleSelect, cascade
        let values = v.values;
        if (!v.values && v.valueFunc && isFunction(values)) {
            values = v.valueFunc();
        }

        switch (v.type) {
            case FieldType.Text:
                element = getFieldDecorator(v.id, {...v.fieldProps, ...itemOptions, initialValue: defaultData})(
                    <Input size="default" {...v.props} />);
                break;
            // input number is the Input element using a type number,not InputNumber,
            // because antd can't trigger OnChange for changing instantly in InputNumber
            case FieldType.InputNumber:
                element = getFieldDecorator(v.id, {...v.fieldProps, ...itemOptions, initialValue: defaultData})(
                    <Input type="number" size="default" style={{width: '100%'}} {...v.props} />
                );
                break;
            case FieldType.Number:
                element = getFieldDecorator(v.id, {...v.fieldProps, ...itemOptions, initialValue: defaultData})(
                    <InputNumber
                        size="default"
                        style={{width: '100%'}}
                        {...v.props}
                    />);
                break;
            case FieldType.FormText :
                element = <p className="ant-form-text"> {defaultData} </p>;
                break;
            case FieldType.Select :
                let options: JSX.Element[] = [];

                if (values && isObject(values)) {
                    for (let j in values) {
                        if (values.hasOwnProperty(j)) {
                            options.push((
                                <Select.Option value={j} key={j + values[j]}>
                                    {values[j]}
                                </Select.Option>));
                        }
                    }
                }
                // set defaultData "" if not set
                if (isUndefined(defaultData)) {
                    defaultData = '';
                } else {
                    // set to string
                    defaultData += '';
                }
                element = getFieldDecorator(v.id, {...v.fieldProps, ...itemOptions, initialValue: defaultData})(
                    <Select size="default" {...v.props} >{options}</Select>);
                break;
            case FieldType.MultiSelect:
                let mOptions: JSX.Element[] = [];

                if (values && isObject(values)) {
                    for (let j in values) {
                        if (values.hasOwnProperty(j)) {
                            mOptions.push((
                                <Select.Option value={j} key={j}>
                                    {values[j]}
                                </Select.Option>));
                        }
                    }
                }
                // set defaultData to string[]
                if (isArray(defaultData)) {
                    defaultData = defaultData.map((item: string|number) => '' + item);
                }
                element = getFieldDecorator(v.id, {...v.fieldProps, ...itemOptions, initialValue: defaultData})(
                    <Select size="default" multiple={true} {...v.props}>
                        {mOptions}
                    </Select>);
                break;
            case FieldType.Date :
                defaultData = defaultData && moment(defaultData);
                element = getFieldDecorator(v.id, {...v.fieldProps, ...itemOptions, initialValue: defaultData})(
                    <DatePicker size="default" style={{width: '100%'}} {...v.props} />);
                break;
            case FieldType.DateTime :
                defaultData = defaultData && moment(defaultData);
                element = getFieldDecorator(v.id, {...v.fieldProps, ...itemOptions, initialValue: defaultData})(
                    <DatePicker
                        showTime={true}
                        size="default"
                        format="YYYY-MM-DD HH:mm:ss"
                        style={{width: '100%'}}
                        {...v.props}
                    />);
                break;
            case FieldType.DateTimeRange:
                defaultData = defaultData && moment(defaultData);
                element = getFieldDecorator(v.id, {...v.fieldProps, ...itemOptions, initialValue: defaultData})(
                    <DatePicker.RangePicker
                        showTime={true}
                        size="default"
                        format="YYYY-MM-DD HH:mm:ss"
                        style={{width: '100%'}}
                        {...v.props}
                    />);
                break;
            case FieldType.Cascader :
                element = getFieldDecorator(v.id, {...v.fieldProps, ...itemOptions, initialValue: defaultData})(
                    <Cascader
                        style={{width: '100%'}}
                        size="default"
                        {...v.props}
                        options={values as CascaderOptionType[]}
                    />);
                break;
            case FieldType.TreeSelect :
                element = getFieldDecorator(v.id, {...v.fieldProps, ...itemOptions, initialValue: defaultData})(
                    <TreeSelect dropdownMatchSelectWidth={false} {...v.props} treeData={values as TreeData[]}/>);
                break;
            case FieldType.Password :
                element = getFieldDecorator(v.id, {...v.fieldProps, ...itemOptions, initialValue: defaultData})(
                    <Input type="password" {...v.props}  />);
                break;
            case FieldType.Checkbox :
                element = getFieldDecorator(v.id, {...v.fieldProps, ...itemOptions, initialValue: defaultData})(
                    <Checkbox> {v.label} </Checkbox>);
                break;
            default:
                break;
        }
        // checkbox has no label
        if (v.type === FieldType.Checkbox) {
            components.push(
                // set key more unique because sometime the id is same when there are parent data
                <Form.Item key={v.id + v.type} style={v.hide ? {display: 'none'} : {}} {...formItemLayout}>
                    {element}
                </Form.Item>
            );
        } else {
            components.push(
                // set key more unique because sometime the id is same when there are parent data
                <Form.Item
                    key={v.id + v.type}
                    style={v.hide ? {display: 'none'} : {}}
                    {...formItemLayout}
                    label={v.label}
                >
                    {element}
                </Form.Item>
            );
        }
    }
    return components;
}

// execute the submit for every field, convert date to utc
// formOptions is like
export function HandleFormData(values: IStringAnyMap, formOptions: ColumnField[]): IStringAnyMap {
    // make a new object to include new value
    let params: IStringAnyMap = {};
    for (let i = 0, len = formOptions.length; i < len; i++) {
        let v = formOptions[i];
        let value = values[v.id];
        if (v.submit && v.hasOwnProperty('submit')) {
            params[v.id] = v.submit(value, values);
        }
    }
    return update(values, {$merge: params});
}
