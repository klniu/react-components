import {ColumnField, FieldType} from './common/forms';

export const formGroupProps: ColumnField[] = [
    {
        id: 'Text',
        type: FieldType.Text,
        label: 'Text',
        defaultValue: 'text',
        render: (val) => 'new' + val,
        submit: (val) => 'new' + val
    }, {
        id: 'PlainText',
        type: FieldType.PlainText,
        label: 'PlainText',
        hideLabel:true,
        defaultValue: 'plainText',
        render: (val) => 'new' + val,
    }, {
        id: 'Checkbox',
        type: FieldType.Checkbox,
        label: 'Checkbox',
        hideLabel: true,
        defaultValue: true,
        render: (val) => 'new' + val,
    },
];
