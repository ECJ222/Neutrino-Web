import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {getFormValues, change} from 'redux-form';
import _get from 'lodash-es/get';
import Form from 'yii-steroids/ui/form/Form';
import InputField from 'yii-steroids/ui/form/InputField';
import Button from 'yii-steroids/ui/form/Button';

import {html} from 'components';
import {getActiveCurrency} from 'reducers/layout';
import CurrencyEnum from 'enums/CurrencyEnum';
import BalanceCurrencyEnum from 'enums/BalanceCurrencyEnum';

import './BuyBoundsForm.scss';

const bem = html.bem('BuyBoundsForm');
const FORM_ID = 'BuyBoundsForm';

@connect(
    state => ({
        // activeCurrency: getActiveCurrency(state),
        formValues: getFormValues(FORM_ID)(state),
    })
)
export default class BuyBoundsForm extends React.PureComponent {

    static propTypes = {

    };

    constructor() {
        super(...arguments);

        this._isProgramChange = false;
    }

    componentWillReceiveProps(nextProps) {
        // console.log(1, this.props, nextProps);

        const isChangeDiscountAmount = _get(this.props.formValues, 'discount') !== _get(nextProps.formValues, 'discount');
        const isChangeBoundsAmount = _get(this.props.formValues, 'bounds') !== _get(nextProps.formValues, 'bounds');
        const isChangeWavesAmount = _get(this.props.formValues, 'waves') !== _get(nextProps.formValues, 'waves');

        if (Object.keys(nextProps.formValues || []).length >= 2) {
            // if (isChangeDiscountAmount || isChangeBoundsAmount || isChangeWavesAmount) {
            //     this._refreshAmount(nextProps, isChangeBoundsAmount || isChangeDiscountAmount)
            // }
            if (_get(this.props.formValues, 'discount') && !_get(nextProps.formValues, 'discount')) {
                this.props.dispatch(change(FORM_ID, 'discount', '0'));
            } else if (!_get(this.props.formValues, 'discount') && !_get(nextProps.formValues, 'discount')) {
                setTimeout(() => this._refreshAmount(nextProps, true, false), 500)
            } else if (isChangeDiscountAmount || isChangeBoundsAmount || isChangeWavesAmount) {
                this._refreshAmount(nextProps, false,isChangeBoundsAmount || isChangeDiscountAmount)
            }
            else {
                this._isProgramChange = false;
            }
        }
    }

    render() {
        return (
            <div className={bem.block()}>
                <Form
                    className={bem.element('form')}
                    formId={FORM_ID}
                >
                    <InputField
                        label={'Bonds discount'}
                        layoutClassName={bem.element('input')}
                        attribute={'discount'}
                        inners={{
                            label: '%',
                        }}
                    />
                    <InputField
                        label={'Amount'}
                        layoutClassName={bem.element('input', 'with-hint')}
                        attribute={'bounds'}
                        inners={{
                            label: BalanceCurrencyEnum.getLabel(BalanceCurrencyEnum.USD_NB),
                            icon: BalanceCurrencyEnum.getIconClass(BalanceCurrencyEnum.USD_NB)
                        }}
                        hint={__('65.3840 WAVES')}

                    />
                    <InputField
                        label={'Total'}
                        layoutClassName={bem.element('input')}
                        attribute={'waves'}
                        inners={{
                            label: BalanceCurrencyEnum.getLabel(BalanceCurrencyEnum.WAVES),
                            icon: BalanceCurrencyEnum.getIconClass(BalanceCurrencyEnum.WAVES)
                        }}
                    />
                    <Button
                        type={'submit'}
                        block
                        className={bem.element('submit-button')}
                        label={__('Buy {bounds}', {
                            bounds: BalanceCurrencyEnum.USD_NB,
                        })}
                    />
                </Form>
            </div>
        );
    }

    _refreshAmount(props, isRefreshDiscount = false, isRefreshWaves = false) {
        props = props || this.props;

        if (this._isProgramChange) {
            this._isProgramChange = false;
            return;
        }
        this._isProgramChange = true;


        const discount = _get(props, 'formValues.discount');
        const bounds = _get(props.formValues, 'bounds');
        const waves = _get(props.formValues, 'waves')

        let amount;

        if (isRefreshDiscount) {
            amount = this._parseAmount(((bounds - waves) * 100) / bounds);

            this.props.dispatch(change(
                FORM_ID,
                'discount',
                this._toFixedSpecial(amount, 2)
            ));

        } else {
            amount = this._parseAmount(isRefreshWaves
                ? (bounds / 100) * (100 - discount)
                : (waves / (100 - discount)) * 100);


            this.props.dispatch(change(
                FORM_ID,
                isRefreshWaves ? 'waves' : 'bounds',
                this._toFixedSpecial(amount, 2)
            ));
        }
    }

    _parseAmount(amount) {
        if (typeof amount === 'undefined') {
            return 0;
        }
        let result = typeof amount === 'string' ? amount.replace(/,/, '.') : amount;
        return !isNaN(parseFloat(result)) && isFinite(result) ? result : 0;
    }

    _toFixedSpecial = function (num, n) {
        const str = num.toFixed(n);
        if (str.indexOf('e+') < 0) {
            return str;
        }

        // if number is in scientific notation, pick (b)ase and (p)ower
        return str.replace('.', '').split('e+').reduce(function (p, b) {
            return p + new Array(b - p.length + 2).join(0);
        }) + '.' + new Array(n + 1).join(0);
    };

}
