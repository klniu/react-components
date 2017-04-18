import * as React from 'react';
import {Modal, Alert, Form, message} from 'antd';
import reqwest from 'reqwest';
import {FormComponentProps} from 'antd/lib/form/Form';
import {ColumnField, getFormItems, HandleFormData} from '../common/forms';
import {IStringAnyMap, ServerResult} from '../common/commons';
import isEqual from "lodash/isEqual";

export interface FormModalProps extends FormComponentProps {
    url: string
    show: boolean
    title: string
    formOptions: ColumnField[]
    onComplete: (params?: any) => void
    onCancel?: (e: React.MouseEvent<any>) => void
    initData?: IStringAnyMap
    parentData?: IStringAnyMap
}

interface FormModalStates {
    loading: boolean
    alertShow: boolean
    alertMsg: string
}

class FormModal extends React.Component<FormModalProps, FormModalStates> {
    state: FormModalStates = {
        loading: false,
        alertShow: false,
        alertMsg: ''
    };

    constructor(props: FormModalProps) {
        super(props);
    }

    componentDidMount() {
        // To disabled submit button at the beginning.
        this.props.form.validateFieldsAndScroll();
    }

    handleSubmit = () => {
        this.props.form.validateFields((errors: any, values: Object) => {
            if (!!errors) {
                return;
            }
            if (isEqual(values, this.props.initData)) {
                return;
            }
            HandleFormData(values, this.props.formOptions);
            this.sendRequest(this.props.url, values);
        });
    };

    sendRequest = (url: string, params: Object) => {
        // when there is no url, call onComplete with value
        if (!url || url === '' || url === '#') {
            this.props.onComplete(params);
            return;
        }
        this.setState({
            loading: true
        });
        reqwest({
            url: url,
            method: 'POST',
            data: params,
            error: (err) => message.error('网络错误，请稍后重试'),
            success: (result: ServerResult) => {
                if (result.msg !== '') {
                    this.setState({
                        alertMsg: result.msg,
                        alertShow: true
                    });
                } else {
                    this.props.onComplete();
                }
                this.setState({
                    loading: false,
                });
            }
        });
    };

    componentWillReceiveProps(nextProps: any) {
        // reset form
        if (!this.props.show && nextProps.show) {
            this.props.form.resetFields();
            this.setState({
                loading: false,
                alertShow: false
            });
        }
    }

    render() {
        const {getFieldDecorator} = this.props.form;
        const formItemLayout = {
            labelCol: {
                span: 6,
            },
            wrapperCol: {
                span: 16,
                offset: 1
            },
        };
        // add inputs
        let components = getFormItems(getFieldDecorator, this.props.formOptions, this.props.parentData,
            this.props.initData, formItemLayout);
        return (
            <Modal
                visible={this.props.show}
                onOk={this.handleSubmit}
                onCancel={this.props.onCancel}
                title={this.props.title}
                maskClosable={false}
                confirmLoading={this.state.loading}
            >
                <Form layout="horizontal" onSubmit={this.handleSubmit}>
                    {components}
                </Form>
                <div style={{display: this.state.alertShow ? 'block' : 'none'}}>
                    <Alert message={this.state.alertMsg} type="error" showIcon={true}/>
                </div>
            </Modal>
        );
    }
}

const WrappedFormModal = Form.create()(FormModal);
export default WrappedFormModal;
