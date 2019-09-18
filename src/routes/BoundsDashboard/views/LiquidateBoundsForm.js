import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {getFormValues, change} from 'redux-form';
import Form from 'yii-steroids/ui/form/Form';
import NumberField from 'yii-steroids/ui/form/NumberField';
import Button from 'yii-steroids/ui/form/Button';
import _get from 'lodash/get';

import {dal, html} from 'components';
import BalanceCurrencyEnum from 'enums/BalanceCurrencyEnum';

import './LiquidateBoundsFrom.scss';
import {getUser} from 'yii-steroids/reducers/auth';
import {getBaseCurrency, getPairName,} from 'reducers/currency';

const bem = html.bem('LiquidateBoundsFrom');
const FORM_ID = 'LiquidateBoundsFrom';

@connect(
    state => ({
        formValues: getFormValues(FORM_ID)(state),
        pairName: getPairName(state),
        bondBalance: _get(getUser(state), ['balances', getBaseCurrency(state)])
    })
)
export default class LiquidateBoundsFrom extends React.PureComponent {

    static propTypes = {
        formValues: PropTypes.object,
        bondBalance: PropTypes.number,
    };

    constructor(props) {
        super(props);

        this._onSubmit = this._onSubmit.bind(this);
    }

    render() {

        const percents = [25, 50, 75, 100];

        return (
            <div className={bem.block()}>

                <div className={bem.element('percents')}>
                    {percents.map(item => (
                        <div
                            key={item}
                            className={bem.element('percent')}
                            onClick={() => {
                                this.props.dispatch(change(FORM_ID, 'bonds', Math.round(this.props.bondBalance * item / 100)) || 0);
                            }}
                        >
                            {item}%
                        </div>
                    ))}
                </div>

                <Form
                    className={bem.element('form')}
                    formId={FORM_ID}
                    onSubmit={this._onSubmit}
                    validators={[
                        [['bonds'], 'required'],
                        [['bonds'], 'integer', {min: 1/*, max: this.props.bondBalance*/}],
                    ]}
                >
                    <NumberField
                        inputProps={{
                            autoComplete: 'off',
                        }}
                        label={__('Total')}
                        layoutClassName={bem.element('input')}
                        attribute={'bonds'}
                        inners={{
                            label: BalanceCurrencyEnum.getLabel(BalanceCurrencyEnum.USD_NB),
                            icon: BalanceCurrencyEnum.getIconClass(BalanceCurrencyEnum.USD_NB)
                        }}
                    />

                    <Button
                        type={'submit'}
                        color={'danger'}
                        block
                        className={bem.element('submit-button')}
                        label={__('Set liquidate {bonds} order', {
                            bonds: BalanceCurrencyEnum.USD_NB,
                        })}
                    />
                </Form>
            </div>
        );
    }

    _onSubmit() {
        return dal.setLiquidateOrder(this.props.pairName, this.props.formValues.bonds);
    }
}
