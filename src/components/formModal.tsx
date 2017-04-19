import * as React from 'react';
import {Modal, Form} from 'antd';
import {FormGroupProps, default as IForm} from './form';

export interface FormModalProps extends FormGroupProps {
    show: boolean
    title: string
}

interface FormModalStates {
    show: boolean
}

class FormModal extends React.Component<FormModalProps, FormModalStates> {
    state: FormModalStates = {
        show: this.props.show
    };

    constructor(props: FormModalProps) {
        super(props);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.show != this.state.show) {
            this.setState({show: nextProps.show});
        }
    }

    Cancel = () => {
        this.setState({show: false});
    };

    render() {
        return (
            <Modal
                visible={this.state.show}
                footer=""
                title={this.props.title}
                maskClosable={true}
                onCancel={this.Cancel}
            >
                <IForm {...this.props} />
            </Modal>
        );
    }
}

const IFormModal = Form.create()(FormModal);
export default IFormModal;
