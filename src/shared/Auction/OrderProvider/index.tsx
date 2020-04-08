import React from 'react';
import { set as _set, get as _get } from 'lodash';
import BaseInput from 'ui/form/BaseInput';
import PercentButton from 'ui/form/PercentButton';
import ExpectedValueSpan from 'shared/Auction/ExpectedValueSpan';
import Button from 'yii-steroids/ui/form/Button';
import CurrencyEnum from 'enums/CurrencyEnum';
import BaseSelectInput, { SelectOption } from 'ui/form/BaseSelectInput';
import TabSelector from 'ui/global/TabSelector';
import {
    computeROI,
    computeBondsAmountFromROI,
    computeWavesAmountFromROI,
    getComputedBondsFromROI,
} from 'reducers/contract/helpers';

import { Props, State, FormDefaults, OrderUrgency } from './types';

import usdnLogo from 'static/icons/usd-n.svg';
import nsbtLogo from 'static/icons/n_icon/light-not-filled/Neutrino_N_ICON.svg';
import wavesLogo from 'static/icons/wave.svg';

import './style.scss';

// const DEFAULT_ROI = 10;

const BUY_FORM_NAME = 'buy';
const LIQUIDATE_FORM_NAME = 'liquidate';
const SEND_FIELD_NAME = 'send';
const RECEIVE_FIELD_NAME = 'receive';

class OrderProvider extends React.Component<Props, State> {
    percentage: number[];

    constructor(props) {
        super(props);

        this.getForms = this.getForms.bind(this);
        this.onSelectOption = this.onSelectOption.bind(this);
        this.onInputChange = this.onInputChange.bind(this);

        this.percentage = [5, 10, 15, 20, 25];

        this.state = {
            orderUrgency: OrderUrgency.BY_REQUEST,
            [BUY_FORM_NAME]: {
                [SEND_FIELD_NAME]: FormDefaults.WAVES_AMOUNT,
                [RECEIVE_FIELD_NAME]: FormDefaults.NSBT_AMOUNT,
                price: 0,
            },
            [LIQUIDATE_FORM_NAME]: {
                [SEND_FIELD_NAME]: FormDefaults.WAVES_AMOUNT,
                [RECEIVE_FIELD_NAME]: FormDefaults.USDN_AMOUNT,
                price: 0,
            },
        };
    }

    calculateDefaults() {
        const { controlPrice, roi = 10 } = this.props;
        const bondsAmount = getComputedBondsFromROI(roi, FormDefaults.WAVES_AMOUNT, controlPrice);
        const dependPrice = Math.round(FormDefaults.WAVES_AMOUNT / bondsAmount);

        const { buy, liquidate } = this.state;

        _set(buy, 'receive', bondsAmount);
        _set(liquidate, 'receive', bondsAmount);
        _set(buy, 'price', dependPrice);
        _set(liquidate, 'price', dependPrice);

        this.setState({ buy, liquidate });
    }

    componentDidMount() {
        this.calculateDefaults();
    }

    onInputChange(event) {
        const { name, value } = event.target;
        console.log({ [name]: value });

        const { state } = this;
        const { orderUrgency } = state;

        if (isNaN(Number(value))) {
            return
        }

        _set(state, name, Number(value));

        this.setState(state);

        // if (orderUrgency === OrderUrgency.BY_REQUEST) {
        //     return;
        // }

        this.recalculateFormFields(event);
    }

    recalculateFormFields(event) {
        const { name, value } = event.target;

        const [formType, formField] = name.split('.');
        const computedFormPath = [
            formType,
            formField === RECEIVE_FIELD_NAME ? SEND_FIELD_NAME : RECEIVE_FIELD_NAME,
        ].join('.');

        if (
            formField === RECEIVE_FIELD_NAME &&
            (formType === BUY_FORM_NAME || formType === LIQUIDATE_FORM_NAME)
        ) {
            this.recalculateWavesAmount(computedFormPath, Number(value));
        }

        if (
            formField === SEND_FIELD_NAME &&
            (formType === BUY_FORM_NAME || formType === LIQUIDATE_FORM_NAME)
        ) {
            this.recalculateBondsAmount(computedFormPath, Number(value));
        }
    }

    recalculateBondsAmount(path: string, wavesAmount: number) {
        const { state } = this;
        const { roi, controlPrice } = this.props;
        const bondsAmount = computeBondsAmountFromROI(roi, wavesAmount, controlPrice / 100);

        console.log({ wavesAmount, roi, bondsAmount, controlPrice });
        _set(state, path, Math.round(bondsAmount));
        this.setState(state);
    }

    recalculateWavesAmount(path: string, bondsAmount: number) {
        const { state } = this;
        const { roi, controlPrice } = this.props;
        const wavesAmount = computeWavesAmountFromROI(roi, bondsAmount, controlPrice / 100);

        console.log({ wavesAmount, roi, bondsAmount, controlPrice });
        _set(state, path, Math.round(wavesAmount));
        this.setState(state);
    }

    onSelectOption(event) {
        switch (Number(event.target.value)) {
            case OrderUrgency.BY_REQUEST:
                this.setState({ orderUrgency: OrderUrgency.BY_REQUEST });
                break;
            case OrderUrgency.INSTANT:
                this.setState({ orderUrgency: OrderUrgency.INSTANT });
                break;
        }
    }

    mapPercentage(num: number) {
        return <PercentButton label={`${num}%`} />;
    }

    getForms() {
        const { orderUrgency, buy, liquidate } = this.state;

        const buyForm = (
            <div className="buy-form">
                <div className="price">
                    <BaseInput fieldName="Price" disabled />
                    <ExpectedValueSpan label="Exp. BR" expected={buy.price} />
                </div>
                <div className="percents">{this.percentage.map(this.mapPercentage)}</div>
                <BaseInput
                    iconLabel={CurrencyEnum.getLabels()[CurrencyEnum.USD_NB]}
                    icon={nsbtLogo}
                    value={buy.receive}
                    fieldName="Receive"
                    name="buy.receive"
                    onChange={this.onInputChange}
                    required={true}
                    disabled={orderUrgency == OrderUrgency.INSTANT}
                />
                <BaseInput
                    iconLabel={CurrencyEnum.getLabels()[CurrencyEnum.WAVES]}
                    icon={wavesLogo}
                    value={buy.send}
                    name="buy.send"
                    onChange={this.onInputChange}
                    fieldName="Send"
                    required={true}
                />
                <p>
                    You will receive {buy.receive} NSBT for {buy.send} WAVES when BR reaches X%
                </p>
                <Button label={`Buy ${CurrencyEnum.getLabels()[CurrencyEnum.USD_NB]}`} />
            </div>
        );
        const sellForm = (
            <div className="liquidate-form">
                <div className="price">
                    <BaseInput fieldName="Price" disabled />
                    <ExpectedValueSpan label="Exp. BR" expected={liquidate.price} />
                </div>
                <div className="percents">{this.percentage.map(this.mapPercentage)}</div>
                <BaseInput
                    iconLabel={CurrencyEnum.getLabels()[CurrencyEnum.USD_N]}
                    icon={usdnLogo}
                    value={liquidate.receive}
                    onChange={this.onInputChange}
                    fieldName="Receive"
                    name="liquidate.receive"
                    required={true}
                    disabled={orderUrgency == OrderUrgency.INSTANT}
                />
                <BaseInput
                    iconLabel={CurrencyEnum.getLabels()[CurrencyEnum.WAVES]}
                    icon={wavesLogo}
                    onChange={this.onInputChange}
                    value={liquidate.send}
                    name="liquidate.send"
                    fieldName="Send"
                    required={true}
                />
                <p>
                    You will receive {liquidate.receive} USDN for {liquidate.send} WAVES when BR
                    reaches X%
                </p>
                <Button
                    color="danger"
                    label={`Liquidate ${CurrencyEnum.getLabels()[CurrencyEnum.USD_NB]}`}
                />
            </div>
        );
        return { buyForm, sellForm };
    }

    render() {
        const { buyForm, sellForm } = this.getForms();

        const selectInput = (
            <BaseSelectInput
                onSelect={this.onSelectOption}
                options={[
                    { label: 'By request', value: OrderUrgency.BY_REQUEST },
                    { label: 'Instant', value: OrderUrgency.INSTANT },
                ]}
            />
        );

        return (
            <>
                <div className="OrderProvider">
                    <div className="buy">
                        {selectInput}
                        {buyForm}
                    </div>
                    <div className="liquidate">{sellForm}</div>
                </div>
                <div className="OrderProvider OrderProvider-mobile">
                    <TabSelector
                        tabs={[
                            {
                                label: 'Buy NSBT',
                                node: (
                                    <div className="OrderProviderTab">
                                        {selectInput}
                                        {buyForm}
                                    </div>
                                ),
                            },
                            {
                                label: 'Sell NSBT',
                                node: (
                                    <div className="OrderProviderTab">
                                        {selectInput}
                                        {sellForm}
                                    </div>
                                ),
                            },
                        ]}
                    />
                </div>
            </>
        );
    }
}

export default OrderProvider;
