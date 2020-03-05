import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { getFormValues, change } from 'redux-form';
import _, { get as _get, orderBy as _orderBy } from 'lodash';
import _round from 'lodash-es/round';
import Form from 'yii-steroids/ui/form/Form';
import NumberField from 'yii-steroids/ui/form/NumberField';
import Button from 'yii-steroids/ui/form/Button';
import { openModal } from 'yii-steroids/actions/modal';
import CurrencyEnum from 'enums/CurrencyEnum';
import MessageModal from 'modals/MessageModal';
import PercentButton from 'ui/form/PercentButton';
import {
    computeROI,
    computeBondsAmountFromROI,
    computeWavesAmountFromROI,
} from 'reducers/contract/helpers';
import { dal, html, store } from 'components';

import './style.scss';
import { getBaseCurrency, getPairName, getQuoteCurrency } from 'reducers/currency';
import { Props, State, IBuyBondsForm } from './types';

const bem = html.bem('BuyBondsForm');
const FORM_ID = 'BuyBondsForm';

enum FormDefaults {
    WAVES_AMOUNT = 1000,
    BONDS_AMOUNT = 1000
}

class BuyBondsForm extends React.Component<Props, State> implements IBuyBondsForm {
    isBondsFieldFocused;
    roiComputingAllowed;
    percentage;

    constructor(props) {
        super(props);

        this._onSubmit = this._onSubmit.bind(this);
        this.computeHint = this.computeHint.bind(this);
        this.getPercentButtons = this.getPercentButtons.bind(this);
        this.mapPercentageButton = this.mapPercentageButton.bind(this);
        this.onManualChangeRoi = this.onManualChangeRoi.bind(this);
        this.getComputedBondsFromROI = this.getComputedBondsFromROI.bind(this);

        this.state = {
            isButtonDisabled: false,
            dependPrice: undefined,
            roi: this.props.roi,
        };

        this.percentage = [5, 10, 15, 20, 25];

        this.isBondsFieldFocused = false;
    }

    computeHint() {
        let bondsAmount = _get(this.props.formValues, 'bonds');

        if (bondsAmount) {
            return `${bondsAmount} ${CurrencyEnum.USD_N.toUpperCase()}`;
        }
    }

    getComputedROI (bondsAmount: number, wavesAmount: number, controlPrice: number) {
        return _round(computeROI(bondsAmount, wavesAmount, controlPrice), 2);
    }

    updatePriceField() {
        let { controlPrice, formValues, roi } = this.props;
        let bondsAmount = _get(formValues, 'bonds');
        let wavesRawAmount = _get(formValues, 'waves');

        if (!bondsAmount || !wavesRawAmount || !controlPrice) {
            return;
        }
        
        bondsAmount = Number(bondsAmount);
        wavesRawAmount = Number(wavesRawAmount);
        const floatControlPrice = (controlPrice / 100)

        let newValue;
        if (this.isBondsFieldFocused) {
            wavesRawAmount = bondsAmount / floatControlPrice
            wavesRawAmount = Math.round(wavesRawAmount - wavesRawAmount * (roi / 100))
            newValue = wavesRawAmount
            this.changeFieldValue('waves', `${newValue}`);
        } else {
            bondsAmount = wavesRawAmount * floatControlPrice
            bondsAmount = Math.round(bondsAmount + bondsAmount * (roi / 100))
            newValue = bondsAmount
            this.changeFieldValue('bonds', `${newValue}`);
        }
    }

    componentDidUpdate(prevProps) {
        if (!this.props.formValues || !prevProps.formValues) {
            return;
        }

        const { roi } = this.state;
        const { controlPrice } = this.props;
        const { bonds: oldBonds, waves: oldWaves } = prevProps.formValues;
        const { bonds, waves } = this.props.formValues;

        if ((oldBonds && oldBonds !== bonds) || (oldWaves && oldWaves !== waves)) {
            this.updatePriceField();
        }

        if (roi === undefined && controlPrice) {
            this.calculateDefaults(controlPrice)
        }
    }

    calculateDefaults (controlPrice) {
        const defaultRoi = this.props.roi;
        const bondsAmount = this.getComputedBondsFromROI(defaultRoi, FormDefaults.WAVES_AMOUNT, controlPrice);
        const dependPrice = Math.round(FormDefaults.WAVES_AMOUNT / FormDefaults.BONDS_AMOUNT);
        this.changeFieldValue('bonds', `${bondsAmount}`);

        this.setState({ roi: defaultRoi, dependPrice });
    }

    componentDidMount() {
        this.updatePriceField();
    }

    changeFieldValue(fname: string, value: string) {
        store.dispatch(change(FORM_ID, fname, value));
    }

    getComputedBondsFromROI (roi: number, waves: number, controlPrice: number) {
        return Math.round(computeBondsAmountFromROI(roi, waves, controlPrice) / 100)
    }

    onManualChangeRoi(roi: number) {
        let { formValues, controlPrice } = this.props;

        if (!formValues || !controlPrice) {
            return;
        }

        const { waves } = formValues;

        if (waves) {
            const computedBonds = this.getComputedBondsFromROI(roi, waves, controlPrice);
            this.changeFieldValue('bonds', `${computedBonds}`);
        }
    }

    mapPercentageButton(num: number) {
        return <PercentButton label={`${num}%`} onClick={() => this.onManualChangeRoi(num)} />;
    }

    getPercentButtons() {
        return this.percentage.map(this.mapPercentageButton);
    }

    getROIStyle() {
        const { roi } = this.state;
        return { display: (roi === null && 'none') || '' };
    }

    getPriceValue() {
        const { roi, dependPrice } = this.state;

        return roi === null ? '' : dependPrice;
    }

    render() {
        const { isButtonDisabled, roi } = this.state;

        return (
            <div className={bem.block()}>
                <Form
                    className={bem.element('form')}
                    formId={FORM_ID}
                    initialValues={{
                        price: 1,
                        waves: FormDefaults.WAVES_AMOUNT,
                        bonds: FormDefaults.BONDS_AMOUNT,
                    }}
                    onSubmit={this._onSubmit}
                    validators={[[['bonds'], 'required']]}
                >
                    <NumberField
                        required
                        inputProps={{
                            autoComplete: 'off',
                            onFocus: () => (this.isBondsFieldFocused = true),
                            type: 'text',
                        }}
                        label="Receive"
                        layoutClassName={bem.element('input')}
                        attribute={'bonds'}
                        inners={{
                            label: CurrencyEnum.getLabel(this.props.baseCurrency),
                            icon: CurrencyEnum.getIconClass(this.props.baseCurrency),
                        }}
                    />
                    <NumberField
                        required
                        inputProps={{
                            autoComplete: 'off',
                            onFocus: () => (this.isBondsFieldFocused = false),
                            type: 'text',
                        }}
                        label="Send"
                        layoutClassName={bem.element('input')}
                        attribute={'waves'}
                        inners={{
                            label: CurrencyEnum.getLabel(CurrencyEnum.WAVES),
                            icon: CurrencyEnum.getIconClass(CurrencyEnum.WAVES),
                        }}
                    />
                    <Button
                        type={'submit'}
                        block
                        disabled={isButtonDisabled}
                        className={bem.element('submit-button')}
                        label={`Buy ${CurrencyEnum.getLabel(this.props.baseCurrency)}`}
                    />
                </Form>
            </div>
        );
    }

    computeOrderPosition(bondOrders, roi) {
        const sortedBondOrders = [
            bondOrders.find(order => order.is_first)
        ].filter(Boolean);

        while (true) {
            const lastSortedOrder = sortedBondOrders[sortedBondOrders.length - 1];

            if (!lastSortedOrder || lastSortedOrder.order_next === null) {
                break;
            }

            const nextOrder = bondOrders.find(order => order.id === lastSortedOrder.order_next);
            sortedBondOrders.push(nextOrder);
        }

        let position = "";
        if (sortedBondOrders.length === 0) {
            return position
        }

        sortedBondOrders.forEach(order => {
            if (roi >= Number(order.debugRoi)) {
                position = order.id
            }
        });

        return position;
    }

    _onSubmit(values) {
        const { pairName, quoteCurrency, bondOrders } = this.props;
        const { dependPrice, roi } = this.state;
        const contractPrice = Math.round(dependPrice * 100);
        const position = this.computeOrderPosition(bondOrders, roi);

        return dal
            .setBondOrder(pairName, contractPrice, quoteCurrency, values.waves, position)
            .then(() => {
                console.log('---setBondOrder success'); // eslint-disable-line no-console
            })
            .catch(err => {
                console.log('---setBondOrder error', err); // eslint-disable-line no-console

                //User denied message
                if (err && err.code === '10') {
                    store.dispatch(
                        openModal(MessageModal, {
                            text: 'You have canceled the order',
                        })
                    );
                } else if (err) {
                    store.dispatch(
                        openModal(MessageModal, {
                            text: `The order was canceled.\n Error: ${err.message}`,
                        })
                    );
                }
            });
    }
}

export default connect(state => ({
    pairName: getPairName(state),
    baseCurrency: getBaseCurrency(state),
    quoteCurrency: getQuoteCurrency(state),
    formValues: getFormValues(FORM_ID)(state),
}))(BuyBondsForm);
