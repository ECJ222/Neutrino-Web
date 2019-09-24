import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {getFormValues, change} from 'redux-form';
import _get from 'lodash-es/get';
import round from 'lodash-es/round';
import InputField from 'yii-steroids/ui/form/InputField';
import Form from 'yii-steroids/ui/form/Form';
import Button from 'yii-steroids/ui/form/Button';
import CheckboxField from 'yii-steroids/ui/form/CheckboxField';
import _isFunction from 'lodash-es/isFunction';

import {html, dal} from 'components';
import BalanceCurrencyEnum from 'enums/BalanceCurrencyEnum';
import CurrencyEnum from 'enums/CurrencyEnum';
import {getLastWavesExchange, getPairName, getQuoteCurrency} from 'reducers/currency';
import Hint from 'shared/Hint';

import './NeutrinoDashboard.scss';
import CollectionEnum from '../../enums/CollectionEnum';
import {login} from 'yii-steroids/actions/auth';

const bem = html.bem('NeutrinoDashboard');
const FORM_ID = 'GenerationForm';
const PRICE_FEED_PERIOD = 1000;

@connect(
    state => ({
        activeCurrency: getQuoteCurrency(state),
        pairName: getPairName(state),
        formValues: getFormValues(FORM_ID)(state),
        usdToWavesExchange: getLastWavesExchange(state, CurrencyEnum.USD),
    })
)
@dal.hoc(
    props => [
        {
            url: `/api/v1/neutrino-balances`,
            key: 'neutrinoBalances',
            collection: CollectionEnum.NEUTRINO_BALANCES,
        },
        {
            url: `/api/v1/price-feed/${PRICE_FEED_PERIOD}`,
            key: 'priceFeed',
        },
    ]
)
export default class NeutrinoDashboard extends React.PureComponent {
    static propTypes = {
        activeCurrency: PropTypes.string,
        pairName: PropTypes.string,
        usdToWavesExchange: PropTypes.number,
        neutrinoBalances: PropTypes.shape({
            totalIssued: PropTypes.number,
            totalUsed: PropTypes.number,
            contractBalance: PropTypes.number,
        }),
        priceFeed: PropTypes.number,
    };

    constructor() {
        super(...arguments);

        this.state = {
            step: 'generation',
            isWavesLeft: true,
        };

        this._onSubmit = this._onSubmit.bind(this);
        this._isProgramChange = false;
    }

    componentWillReceiveProps(nextProps) {
        const isChangeWavesAmount = _get(this.props.formValues, 'waves') !== _get(nextProps.formValues, 'waves');
        const isChangeCurrencyAmount = _get(this.props.formValues, 'neutrino') !== _get(nextProps.formValues, 'neutrino');

        if (isChangeWavesAmount || isChangeCurrencyAmount) {
            this._refreshAmount(nextProps, isChangeWavesAmount);
        }
        else {
            this._isProgramChange = false;
        }
    }

    render() {
        const steps = [
            {
                id: 'generation',
                label: __('Collateralize & generation {currency}', {
                    currency: CurrencyEnum.getLabel(this.props.activeCurrency)
                }),
            },
            {
                id: 'details',
                label: __('Confirm details'),
            }
        ];

        return (
            <div className={bem.block()}>
                {this.renderStepChanger(steps)}
                <Form
                    className={bem.element('form')}
                    formId={FORM_ID}
                    onSubmit={this._onSubmit}
                >
                    {this.state.step === 'generation' && this.renderGenerationStep()}
                    {this.state.step === 'details' && this.renderDetailsStep()}
                </Form>
            </div>
        );
    }

    renderStepChanger(steps) {
        return (
            <div className={bem.element('steps')}>
                {steps.map((item, index) => (
                    <div
                        key={item.id}
                        className={bem.element('step', {
                            active: this.state.step === item.id,
                        })}
                    >
                        <span className={bem.element('step-count')}>
                            {index + 1}
                        </span>
                        <span className={bem.element('step-label')}>
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    renderGenerationStep() {
        return (
            <>
                <div className={bem.element('inputs')}>
                    <div className={bem.element('input-container')}>
                        <div className={bem.element('input-label')}>
                            {__('How much {currency} would you like to collateralize?', {
                                currency: this.state.isWavesLeft
                                    ? BalanceCurrencyEnum.getLabel(BalanceCurrencyEnum.WAVES)
                                    : CurrencyEnum.getLabel(this.props.activeCurrency),
                            })}
                        </div>
                        <InputField
                            className={bem.element('input')}
                            attribute={this.state.isWavesLeft ? 'waves' : 'neutrino'}
                            inners={{
                                label: this.state.isWavesLeft
                                    ? BalanceCurrencyEnum.getLabel(BalanceCurrencyEnum.WAVES)
                                    : CurrencyEnum.getLabel(this.props.activeCurrency),
                                icon: this.state.isWavesLeft
                                    ? BalanceCurrencyEnum.getIconClass(BalanceCurrencyEnum.WAVES)
                                    : BalanceCurrencyEnum.getIconClass(BalanceCurrencyEnum.USD_N)
                            }}
                        />
                        <div className={bem.element('input-hint')}>
                            {__('Min. {currency} required: 100 {currency}', {
                                currency: this.state.isWavesLeft
                                    ? BalanceCurrencyEnum.getLabel(BalanceCurrencyEnum.WAVES)
                                    : CurrencyEnum.getLabel(this.props.activeCurrency),
                            })}
                            <div className={bem.element('input-hint-icon')}>
                                <Hint
                                    text={__('Some text')}
                                />
                            </div>
                        </div>
                    </div>

                    <div
                        className={bem.element('exchange-button')}
                        onClick={() => this.setState({isWavesLeft: !this.state.isWavesLeft})}
                    >
                        <span className={'Icon Icon__exchange'}/>
                    </div>

                    <div className={bem.element('input-container')}>
                        <div className={bem.element('input-label')}>
                            {__('How much {currency} would you like to receive?', {
                                currency: this.state.isWavesLeft
                                    ? CurrencyEnum.getLabel(this.props.activeCurrency)
                                    : 'WAVES'
                            })}
                        </div>
                        <InputField
                            className={bem.element('input')}
                            attribute={this.state.isWavesLeft ? 'neutrino' : 'waves'}
                            inners={{
                                label: this.state.isWavesLeft
                                    ? CurrencyEnum.getLabel(this.props.activeCurrency)
                                    : BalanceCurrencyEnum.getLabel(BalanceCurrencyEnum.WAVES),
                                icon: this.state.isWavesLeft
                                    ? BalanceCurrencyEnum.getIconClass(BalanceCurrencyEnum.USD_N)
                                    : BalanceCurrencyEnum.getIconClass(BalanceCurrencyEnum.WAVES)
                            }}
                        />
                        <div className={bem.element('input-hint')}>
                            {__('Max {currency} available to generate: 10k {currency}', {
                                currency: this.state.isWavesLeft
                                    ? CurrencyEnum.getLabel(this.props.activeCurrency)
                                    : BalanceCurrencyEnum.getLabel(BalanceCurrencyEnum.WAVES),
                            })}
                        </div>
                    </div>
                </div>

                <div className={bem.element('info')}>
                    <div className={bem.element('info-column')}>
                        <div className={bem.element('info-row')}>
                            <div className={bem.element('info-string')}>
                                <div className={bem.element('info-hint')}>
                                    <Hint
                                        text={__('Some text')}
                                    />
                                </div>
                                <span>{__('Price feed period')}</span>
                            </div>
                            <span>
                                {round(this.props.priceFeed, 2)}
                            </span>
                        </div>
                        <div className={bem.element('info-row')}>
                            <div className={bem.element('info-string')}>
                                <div className={bem.element('info-hint')}>
                                    <Hint
                                        text={__('Some text')}
                                    />
                                </div>
                                <span>{__('Number of oracles')}</span>
                            </div>
                            <span>{__('1')}</span>
                        </div>
                    </div>
                    <div className={bem.element('info-column')}>
                        <div className={bem.element('info-row')}>
                            <div className={bem.element('info-string')}>
                                <div className={bem.element('info-hint')}>
                                    <Hint
                                        text={__('Some text')}
                                    />
                                </div>
                                <span>
                                    {__('Total issued {currency}', {
                                        currency: CurrencyEnum.getLabel(this.props.activeCurrency)
                                    })}
                                </span>
                            </div>
                            <span>{this.props.neutrinoBalances && round(this.props.neutrinoBalances.totalUsed, 2)}</span>
                        </div>
                        <div className={bem.element('info-row')}>
                            <div className={bem.element('info-string', 'without-hint')}>
                                <span>{__('Current WAVES / USD price')}</span>
                            </div>
                            <span>{this.props.usdToWavesExchange} $</span>
                        </div>
                    </div>
                </div>
                <Button
                    disabled={
                        !_get(this.props.formValues, 'waves') ||
                        !_get(this.props.formValues, 'neutrino') ||
                        !parseInt(_get(this.props.formValues, 'waves')) ||
                        !parseInt(_get(this.props.formValues, 'neutrino'))
                    }
                    className={bem.element('submit-button')}
                    label={this.state.isWavesLeft ? __('Generate {currency} Neutrino', {
                        currency: CurrencyEnum.getLabel(this.props.activeCurrency)
                    }) : __('Generate Waves')}
                    onClick={() => this.setState({step: 'details'})}
                />
            </>
        );
    }

    renderDetailsStep() {
        return (
            <>
                <div className={bem.element('details')}>
                    <div className={bem.element('details-item')}>
                        <span className={bem.element('details-label')}>
                            {__('Collateralize & generation USDN')}
                        </span>
                        <div className={bem.element('details-inner', 'generation')}>
                            <div className={bem.element('values')}>
                                <span className={bem.element('value-title')}>
                                    {__('Collateral')}:
                                </span>
                                <div className={bem.element('value-item')}>
                                    <span className={bem.element('value-number')}>
                                        {_get(this.props.formValues, this.state.isWavesLeft ? 'waves' : 'neutrino')}
                                    </span>
                                    <span className={bem(bem.element('value-icon'), `Icon ${this.state.isWavesLeft
                                        ? BalanceCurrencyEnum.getIconClass(BalanceCurrencyEnum.WAVES)
                                        : BalanceCurrencyEnum.getIconClass(BalanceCurrencyEnum.USD_N)}`)}
                                    />
                                    <span className={bem.element('value-name')}>
                                        {this.state.isWavesLeft
                                            ? BalanceCurrencyEnum.getLabel(BalanceCurrencyEnum.WAVES)
                                            : CurrencyEnum.getLabel(this.props.activeCurrency)
                                        }
                                    </span>
                                </div>
                            </div>
                            <div className={bem.element('values')}>
                                <span className={bem.element('value-title')}>
                                    {__('Generate')}:
                                </span>
                                <div className={bem.element('value-item')}>
                                    <span className={bem.element('value-number')}>
                                        {_get(this.props.formValues, this.state.isWavesLeft ? 'neutrino' : 'waves')}
                                    </span>
                                    <span className={bem(bem.element('value-icon'), `Icon ${this.state.isWavesLeft
                                        ? BalanceCurrencyEnum.getIconClass(BalanceCurrencyEnum.USD_N)
                                        : BalanceCurrencyEnum.getIconClass(BalanceCurrencyEnum.WAVES)}`)}
                                    />
                                    <span className={bem.element('value-name')}>
                                        {this.state.isWavesLeft
                                            ? CurrencyEnum.getLabel(this.props.activeCurrency)
                                            : BalanceCurrencyEnum.getLabel(BalanceCurrencyEnum.WAVES)
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={bem.element('details-item')}>
                        <span className={bem.element('details-label')}>
                            {__('Transaction details')}
                        </span>
                        <div className={bem.element('details-inner')}>
                            <p>
                                {__('Automated smart contract transaction')}
                            </p>
                        </div>
                    </div>
                    <CheckboxField
                        className={bem.element('terms-checkbox')}
                        label={<span>{__('I have read and accept the')} <a href='javascript:void(0)'>{__('Terms of Service')}</a></span>}
                        attribute={'terms'}
                    />
                    <div className={bem.element('details-actions')}>
                        <Button
                            color={'secondary'}
                            className={bem.element('back-button')}
                            label={__('Go back')}
                            onClick={() => this.setState({step: 'generation'})}
                        />
                        <Button
                            type={'submit'}
                            className={bem.element('finalize-button')}
                            disabled={!_get(this.props.formValues, 'terms')}
                            label={__('Finalize and create CDP')}
                            onClick={() => this.props.dispatch(submit(FORM_ID))}
                        />
                    </div>
                </div>
            </>
        );
    }

    _refreshAmount(props, isRefreshToAmount = false) {
        props = props || this.props;

        if (this._isProgramChange) {
            this._isProgramChange = false;
            return;
        }
        this._isProgramChange = true;

        const rate = this.props.usdToWavesExchange;

        let amount = this._parseAmount(isRefreshToAmount
            ? _get(props.formValues, 'waves') * rate
            : _get(props.formValues, 'neutrino') / rate);


        this.props.dispatch(change(
            FORM_ID,
            isRefreshToAmount ? 'neutrino' : 'waves',
            this._toFixedSpecial(amount, 2)
        ));
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

    _onSubmit(values) {
        return this.state.isWavesLeft
            ? dal.swapWavesToNeutrino(this.props.pairName, values.waves)
            : dal.swapNeutrinoToWaves(this.props.pairName, values.neutrino)
                .then(() => {
                    if (this.props.onComplete && _isFunction(this.props.onComplete)) {
                        this.props.onComplete();
                    }
                });
    }
}
