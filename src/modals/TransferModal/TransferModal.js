import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {getFormValues, reset} from 'redux-form';
import Modal from 'yii-steroids/ui/modal/Modal';


import {html, dal} from 'components';
import TransferForm from 'shared/TransferForm';
import TransferInfo from 'shared/TransferInfo';
import {getPairName} from 'reducers/currency';

import './TransferModal.scss';

const bem = html.bem('TransferModal');
const FORM_ID = 'TransferModalForm';


@connect(
    state => ({
        pairName: getPairName(state),
        formValues: getFormValues(FORM_ID)(state),
    })
)
export default class TransferModal extends React.PureComponent {


    static propTypes = {
        currency: PropTypes.string,
    };

    constructor() {
        super(...arguments);

        this.state = {
            isSuccess: false,
        };

        this._onSubmit = this._onSubmit.bind(this);
    }

    render() {

        const {currency, formValues} = this.props;

        return (
            <Modal
                {...this.props.modalProps}
                header={this.state.isSuccess
                    ? __('Transferring was successful!')
                    : __('Transferring funds to a user')
                }
                className={bem.block({
                    'is-success': this.state.isSuccess,
                })}
            >
                <div className={bem.element('inner')}>
                    <div className={bem.element('form', {
                        'd-none': this.state.isSuccess,
                    })}>
                        <TransferForm
                            formId={FORM_ID}
                            onSubmit={this._onSubmit}
                        />
                    </div>
                    <div className={bem.element('success', {
                        'd-none': !this.state.isSuccess
                    })}>
                        <div className={bem.element('success-icon')}>
                            <span className={'Icon Icon__successful'}/>
                        </div>
                        <TransferInfo
                            {...formValues}
                            currency={currency}
                            onSubmit={() => {
                                this.setState({isSuccess: false});
                                this.props.dispatch(reset(FORM_ID))
                            }}
                        />
                    </div>
                </div>
            </Modal>
        );
    }

    _onSubmit(address, amount) {

        dal.transferFunds(
            this.props.pairName,
            this.props.currency,
            address,
            amount
        )
            .then(() => {
                this.setState({
                    isSuccess: true,
                });
            })
            .catch(err => console.log('Transfer error: ', err));
    }
}