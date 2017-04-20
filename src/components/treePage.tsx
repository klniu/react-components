import * as React from 'react';
import {Row, Col, Button, Table, message, Icon, Spin} from 'antd';
import reqwest from 'reqwest';
import {PaginationProps} from 'antd/lib/pagination';
import {StringAnyMap} from '../common/commons';
import {ColumnField} from '../common/forms';
import {ColumnProps} from 'antd/lib/table/Column';
import {FormModalProps, default as IFormModal} from './formModal';
import update from 'immutability-helper';
import isEqual from 'lodash/isEqual';

export interface TableParams {
    url: string;                 // the url to get table data
    columns: ColumnProps<any>[]; // the column paramters
    parentQueryParam?: [string, string]; // 获取子表数据时需要传递的对应父级参数，第一个参数为子级数据，比如UnitNo，第二个为父级数据，如No，
    // 二者往往是一个值，在数据库中作为reference存在。
}

export interface TreePageProps {
    params: TreePageParam,
    refreshTable?: string // a random key to active the refresh of table
    searchParams?: StringAnyMap,
    buttons?: any[],
    // default buttons is to display, there are six default buttons to display, parent add, edit, delete and
    // child add, edit, delete
    defaultButtonsDisplay?: boolean[]
}

export interface TreePageParam {
    parent: PageParam
    child?: PageParam
}

interface PageParam {
    name: string;
    keyField?: string; // the field to be key, default is ID
    addUrl: string; // the url to add data to table
    removeUrl: string; // the url to remove data to table
    formOptions: ColumnField[];
    table: TableParams;
}

interface TreePageStates {
    loading: boolean

    // tables
    tableData: any[],
    childData: StringAnyMap // {parentRowID: childData}
    pagination: PaginationProps
    selectedKeys: string[]
    childSelectedKeys: string[]
    rowKeyMap: { [key: string]: number } // the map between rowKey(id) and row index
    parentRow: StringAnyMap // record the parent row data selected
    childRow: StringAnyMap // record the child row data selected
    defaultButtonsDisplay: boolean[]
    formModalProps: FormModalProps
}


class TreePage extends React.Component<TreePageProps, TreePageStates> {
    private parentKey: string = 'ID';
    private childKey: string = 'ID';

    constructor(props: TreePageProps) {
        super(props);
    }

    state: TreePageStates = {
        loading: false,

        // tables
        tableData: [],
        childData: {},
        pagination: {total: 0, current: 1, pageSize: 20},
        selectedKeys: [],
        childSelectedKeys: [],
        rowKeyMap: {}, // the map between rowKey and index of expanded rows
        parentRow: {}, // record the parent row only one selected
        childRow: {}, // record the child row only one selected
        defaultButtonsDisplay: !this.props.defaultButtonsDisplay ?
            [true, true, true, true, true, true] : this.props.defaultButtonsDisplay,

        // form
        formModalProps: {
            show: false,
            title: '',
            formOptions: [],
            url: ''
        }
    };

    componentDidMount() {
        // fetch data from server
        this.fetch(update(this.state.pagination, {$merge: this.props.searchParams}));
    }

    componentWillReceiveProps(nextProps: TreePageProps) {
        if (!isEqual(nextProps.searchParams, this.props.searchParams)) {
            this.refreshTable(true);
        }
        if (nextProps.refreshTable !== this.props.refreshTable) {
            this.refreshTable(true);
        }
        if (nextProps.params.parent && nextProps.params.parent.keyField) {
            this.parentKey = nextProps.params.parent.keyField;
        }
        if (nextProps.params.child && nextProps.params.child.keyField) {
            this.childKey = nextProps.params.child.keyField;
        }
    }

    // when table change
    private handleTableChange = (pagination: PaginationProps, filters: string[], sorter: StringAnyMap) => {
        this.setState({
            pagination: update(this.state.pagination, {
                $merge: pagination
            }),
        });
        this.fetch({
            pageSize: pagination.pageSize,
            current: pagination.current,
            sortField: sorter.field,
            sortOrder: sorter.order,
            ...filters,
            ...this.props.searchParams,
        });
    };

    private fetch = (params = {}) => {
        this.setState({loading: true});
        reqwest({
            url: this.props.params.parent.table.url,
            method: 'post',
            data: params,
            error: (err) => message.error('网络错误，请稍后重试'),
            success: (result: StringAnyMap) => {
                if (result.msg != '') {
                    message.error(result.msg, 5);
                } else {
                    this.setState({
                        tableData: result.data,
                        pagination: update(this.state.pagination, {
                            total: {
                                $set: result.total
                            }
                        }),
                    });
                }
                this.setState({loading: false,});
            }
        });
    };

    // refresh the parent or child table according isParent.
    private refreshTable = (isParent: boolean) => {
        if (isParent) {
            this.fetch(update(this.state.pagination, {$merge: this.props.searchParams}));
        } else {
            // record the expandedRowKeys
            this.setState({
                childData: {},
            });
        }
    };

    // expand the row in parent table, get child data
    private expandRow = (record: StringAnyMap, index: number) => {
        const childData = this.state.childData[record[this.parentKey]];
        // record the map of parent rowKey and index
        if (childData && this.props.params.child) {
            let rowSelection: any = {selectedRowKeys: this.state.childSelectedKeys, onChange: this.onChildSelectChange};
            return (
                <Table columns={ this.props.params.child.table.columns }
                       dataSource={ childData }
                       loading={ this.state.loading }
                       size="small"
                       pagination={ false }
                       bordered
                       rowSelection={ rowSelection }
                       rowClassName={ TreePage.rowRender }
                       rowKey={ (record: StringAnyMap) => '' + record[this.childKey] }/>
            );
        }
        this.getChildData(record, index);

        return (
            <p>
                加载中...
            </p>
        );
    };

    // get child data according the parent data, meanwhile record the parent row map of key:index
    private getChildData = (record: StringAnyMap, index: number) => {
        if (!this.props.params.child) return;
        let params = {};
        const parentQuery = this.props.params.child.table.parentQueryParam;
        if (parentQuery && parentQuery.length == 2) {
            let key = parentQuery[0];
            params = {
                [key]: record[parentQuery[1]]
            };
        }
        const parentKeyVal = record[this.parentKey];
        reqwest({
            url: this.props.params.child.table.url,
            method: 'POST',
            data: params,

            error: (err) => message.error('网络错误，请稍后重试'),
            success: (result: StringAnyMap) => {
                if (result.msg != '') {
                    message.error(result.msg);
                } else {
                    this.setState({
                        childData: update(this.state.childData, {[parentKeyVal]: {$set: result.data}}),
                        rowKeyMap: update(this.state.rowKeyMap, {
                            $merge: {
                                [parentKeyVal]: index
                            }
                        })
                    });
                }
            },
        });
    };

    // get parent data according
    private getParentData = (childKeyVal: string): StringAnyMap => {
        for (let key in this.state.childData) {
            const childData = this.state.childData[key];
            for (let i = 0, len = childData.length; i < len; i++) {
                if (childData[i][this.childKey] === childKeyVal) {
                    return this.state.tableData[this.state.rowKeyMap[key]];
                }
            }
        }
        return {};
    };

// set stripped table
    private static rowRender = (_record: StringAnyMap, index: number): string => {
        if (index % 2 == 1) {
            return 'striped';
        }
        return '';
    };

// when select changes, enable or disable some buttons at top
    private onSelectChange = (selectedKeys: string[], rows: any[]) => {
        // set the row to parentRow when there is only one row selected row in parent row.
        this.setState({
            selectedKeys
        });
        // record the row when there is only one selected
        if (rows.length === 1) {
            this.setState({
                parentRow: rows[0]
            });
        }
    };

// when select changes, enable or disable some buttons at top
    private onChildSelectChange = (keys: string[], rows: StringAnyMap[]) => {
        // set the row to parentRow and childRow when there is only one row selected row in child row.
        this.setState({childSelectedKeys: keys});
        if (rows.length === 1) {
            this.setState({childRow: rows[0]});
        }
    };

// add parent or child, obj is parent or child
    private add = (isParent: boolean) => {
        let obj;
        if (isParent) {
            obj = this.props.params.parent;
        } else if (this.props.params.child) {
            obj = this.props.params.child;
        }
        this.setState({
            formModalProps: {
                show: true,
                title: '添加' + obj.name,
                url: obj.addUrl,
                formOptions: obj.formOptions,
                parentData: !isParent ? this.state.parentRow : {},
                onComplete: () => {
                    this.refreshTable(isParent);
                    this.onCancelForm();
                }
            }
        });
    };

// remove row
    private remove = (isParent: boolean) => {
        this.setState({
            loading: true
        });
        let obj;
        if (isParent) {
            obj = this.props.params.parent;
        } else if (this.props.params.child) {
            obj = this.props.params.child;
        }
        let params = {
            ids: isParent ? this.state.selectedKeys : this.state.childSelectedKeys
        };
        reqwest({
            url: obj.removeUrl,
            method: 'post',
            data: params,
            error: (err) => message.error('网络错误，请稍后重试'),
            success: (result) => {
                if (result.msg != '') {
                    message.error(result.msg, 3);
                } else {
                    message.success('删除成功');
                    if (isParent) {
                        this.setState({
                            selectedKeys: []
                        });
                    } else {
                        this.setState({
                            childSelectedKeys: []
                        });
                    }
                    this.refreshTable(isParent);
                }
                this.setState({loading: false});
            }
        });
    };

    private edit = (isParent: boolean) => {
        let parentData = isParent ? this.getParentData(this.state.childRow[this.childKey]) : {};
        let obj;
        if (isParent) {
            obj = this.props.params.parent;
        } else if (this.props.params.child) {
            obj = this.props.params.child;
        }
        this.setState({
            formModalProps: {
                show: true,
                title: '编辑' + obj.name,
                url: obj.addUrl,
                formOptions: obj.formOptions,
                parentData: parentData,
                initData: isParent ? this.state.parentRow : this.state.childRow,
                onComplete: () => {
                    this.refreshTable(isParent);
                    this.onCancelForm();
                    this.setState({
                        selectedKeys: []
                    });
                }
            }
        });
    };

    private onCancelForm = () => {
        this.setState({
            formModalProps: update(this.state.formModalProps, {
                show: {
                    $set: false
                }
            }),
        });
    };

    render() {
        //buttons
        const parent = this.props.params.parent;
        const child = this.props.params.child;
        let buttons:JSX.Element[] = [];
        let parentButtons: JSX.Element[] = [];
        // 按需加载parent buttons
        if (this.state.defaultButtonsDisplay[0]) {
            parentButtons.push(
                <Button key="parentAdd" type="primary" onClick={ () => this.add(true) }>
                    <Icon type="plus-circle"/>
                    { '添加' + parent.name }
                </Button>
            );
        }
        if (this.state.defaultButtonsDisplay[1]) {
            parentButtons.push(
                <Button key="parentRemove" onClick={ () => this.remove(true) }
                        disabled={ this.state.selectedKeys.length === 0 }>
                    <Icon type="cross-circle"/>
                    { '删除' + parent.name }
                </Button>
            );
        }
        if (this.state.defaultButtonsDisplay[2]) {
            parentButtons.push(
                <Button key="parentEdit" onClick={() => this.edit(true) }
                        disabled={ this.state.selectedKeys.length !== 1 }>
                    <Icon type="edit"/>
                    { '编辑' + parent.name }
                </Button>
            );
        }
        let parentButtonGroup;
        if (parentButtons.length > 0) {
            parentButtonGroup = <Button.Group key="parent">
                { parentButtons }
            </Button.Group>;
            buttons.push(parentButtonGroup);
        }
        // 按需加载child buttons
        let childButtons:JSX.Element[] = [];
        if (child) {
            if (this.state.defaultButtonsDisplay[3]) {
                childButtons.push(
                    <Button type="primary"
                            key="childAdd"
                            onClick={ () => this.add(false) }
                            disabled={ this.state.selectedKeys.length !== 1 }>
                        <Icon type="plus-circle"/>
                        { '添加' + child.name }
                    </Button>
                );
            }
            if (this.state.defaultButtonsDisplay[4]) {
                childButtons.push(
                    <Button key="childRemove" onClick={ () => this.remove(false) }
                            disabled={ this.state.childSelectedKeys.length === 0 }>
                        <Icon type="cross-circle"/>
                        { '删除' + child.name }
                    </Button>
                );
            }
            if (this.state.defaultButtonsDisplay[5]) {
                childButtons.push(
                    <Button key="childEdit" onClick={ () => this.edit(false) }
                            disabled={ this.state.childSelectedKeys.length !== 1 }>
                        <Icon type="edit"/>
                        { '编辑' + child.name }
                    </Button>
                );
            }
        }
        let childButtonGroup;
        if (childButtons.length > 0) {
            childButtonGroup = <Button.Group key="child">
                { childButtons }
            </Button.Group>;
            buttons.push(childButtonGroup);
        }
        if (this.props.buttons) {
            Array.prototype.push.apply(buttons, this.props.buttons);
        }

        // tables
        const selectedRowKeys = this.state.selectedKeys;
        const rowSelection: any = {
            selectedRowKeys,
            onChange: this.onSelectChange,
        };
        let buttonRow;
        if (buttons.length > 0) {
            buttonRow = <Row type="flex" gutter={ 24 } justify="start">
                { buttons }
                <Col span={10}> </Col>
            </Row>;
        }
        let expand = {};
        // load expansion
        if (this.props.params.child) {
            expand = {
                expandedRowRender: this.expandRow,
            };
        }
        return (
            <Spin spinning={ this.state.loading }>
                <IFormModal {...this.state.formModalProps}/>
                { buttonRow }
                <br />
                <Table columns={ this.props.params.parent.table.columns }
                       onChange={ this.handleTableChange }
                       dataSource={ this.state.tableData }
                       pagination={ this.state.pagination }
                       loading={ this.state.loading }
                       rowSelection={ rowSelection }
                       size="small"
                       bordered
                       rowClassName={ TreePage.rowRender }
                       rowKey={ (record: StringAnyMap) => record[this.parentKey] }
                       {...expand} />
            </Spin>
        );
    }
}

export default TreePage;
