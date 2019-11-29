import React from 'react';
import _, { get as _get } from 'lodash';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { getFormValues, change, reset } from 'redux-form';
import _toNumber from 'lodash-es/toNumber';
import round from 'lodash-es/round';
import InputField from 'yii-steroids/ui/form/InputField';
import Form from 'yii-steroids/ui/form/Form';
import Button from 'yii-steroids/ui/form/Button';
import CheckboxField from 'yii-steroids/ui/form/CheckboxField';
import { getUser } from 'yii-steroids/reducers/auth';
import { ConfigContext, GlobalLinksContext, UserCongratsModalContext } from 'shared/Layout/context';

import { html, dal, store } from 'components';
import CurrencyEnum from 'enums/CurrencyEnum';
import ContractEnum from 'enums/ContractEnum';
import PairsEnum from 'enums/PairsEnum';
import CollectionEnum from 'enums/CollectionEnum';
import { getPairName, getQuoteCurrency, getSourceCurrency } from 'reducers/currency';
import Hint from 'shared/Hint';
import SwapLoader from 'shared/SwapLoader';
import { getControlPrice, getTotalIssued } from 'reducers/contract/selectors';

import './NeutrinoDashboard.scss';

const bem = html.bem('NeutrinoDashboard');

const FORM_ID = 'GenerationForm';
const PRICE_FEED_PERIOD = 1000;

@connect(state => ({
    sourceCurrency: getSourceCurrency(state),
    quoteCurrency: getQuoteCurrency(state),
    pairName: getPairName(state),
    formValues: getFormValues(FORM_ID)(state),
    user: getUser(state),
    controlPrice: getControlPrice(state),
    totalIssued: getTotalIssued(state),
}))
@dal.hoc(props => [
    {
        url: `/api/v1/neutrino-balances/${props.pairName}`,
        key: 'neutrinoBalances',
        collection: CollectionEnum.NEUTRINO_BALANCES,
    },
    {
        url: `/api/v1/neutrino-config/${props.pairName}`,
        key: 'neutrinoConfig',
        collection: CollectionEnum.CONTROL_CONFIG,
    },
    {
        url: `/api/v1/price-feed/${props.sourceCurrency}/${PRICE_FEED_PERIOD}`,
        key: 'priceFeed',
    },
    {
        url: `/api/v1/withdraw/${props.pairName}/${_get(props, 'user.address')}`,
        key: 'withdraw',
        collection: CollectionEnum.NEUTRINO_WITHDRAW,
    },
])
export default class NeutrinoDashboard extends React.PureComponent {
    static propTypes = {
        quoteCurrency: PropTypes.string,
        sourceCurrency: PropTypes.string,
        pairName: PropTypes.string,
        neutrinoBalances: PropTypes.shape({
            totalIssued: PropTypes.number,
            totalUsed: PropTypes.number,
            contractBalance: PropTypes.number,
        }),
        neutrinoConfig: PropTypes.shape({
            price: PropTypes.number,
        }),
        priceFeed: PropTypes.number,
        withdraw: PropTypes.shape({
            neutrinoBlocked: PropTypes.number,
            wavesBlocked: PropTypes.number,
            unblockBlock: PropTypes.number,
            height: PropTypes.number,
            index: PropTypes.number,
        }),
    };

    constructor() {
        super(...arguments);

        this.state = {
            step: 'generation',
            isWavesLeft: true,
            isSwapLoading: false,
        };

        this.getControlPrice = this.getControlPrice.bind(this);
        this._wasSwapLoading = null;

        this._onSubmit = this._onSubmit.bind(this);
        this._withdraw = this._withdraw.bind(this);
        this._isProgramChange = false;
    }

    doesSwapLoadingEnd(newState, oldState, callback = () => {}) {
        if (this.state.isWavesLeft && newState && !oldState) {
            callback();
        }
    }

    componentDidUpdate(prevProps, prevState) {
        this._wasSwapLoading = prevState.isSwapLoading;
    }

    componentWillReceiveProps(nextProps) {
        const thisWaves = _get(this.props.formValues, 'waves');
        const nextWaves = _get(nextProps.formValues, 'waves');
        const thisNeutrino = _get(this.props.formValues, 'neutrino');
        const nextNeutrino = _get(nextProps.formValues, 'neutrino');
        const thisPrice = _get(this.props, 'neutrinoConfig.price');
        const nextPrice = _get(nextProps, 'neutrinoConfig.price');

        const isChangeWavesAmount = thisWaves !== nextWaves;
        const isChangeCurrencyAmount = thisNeutrino !== nextNeutrino;
        const isChangePrice =
            nextWaves && nextNeutrino && thisPrice && nextPrice && thisPrice !== nextPrice;

        if (isChangeWavesAmount || isChangeCurrencyAmount || isChangePrice) {
            this._refreshAmount(
                nextProps,
                isChangeWavesAmount || (isChangePrice && this.state.isWavesLeft)
            );
        } else {
            this._isProgramChange = false;
        }

        const thisWithdraw = _get(this.props, 'withdraw');
        const nextWithdraw = _get(nextProps, 'withdraw');
        const nextUnblockBlock = Number(_get(nextProps, 'withdraw.unblockBlock'));
        const nextHeight = Number(_get(nextProps, 'withdraw.height'));

        //first loading component
        if (!thisWithdraw && nextWithdraw && nextUnblockBlock > nextHeight) {
            this.setState({ isSwapLoading: true });
        }

        //changing withdraw
        if (thisWithdraw && nextWithdraw) {
            if (nextUnblockBlock > nextHeight && !this.state.isSwapLoading) {
                this.setState({ isSwapLoading: true });
            } else if (nextUnblockBlock < nextHeight && this.state.isSwapLoading) {
                this.setState({ isSwapLoading: false });
            } else if (nextUnblockBlock === nextHeight && this.state.isSwapLoading) {
                //close delay
                setTimeout(() => this.setState({ isSwapLoading: false }), 3000);
            }
        } else if (this.state.isSwapLoading) {
            this.setState({ isSwapLoading: false });
        }
    }

    getControlPrice() {
        return _.round(_get(this.props, 'controlPrice', 0) / 100, 2);
    }

    getTotalIssued() {
        return this.props.totalIssued
            ? _.round(this.props.totalIssued / CurrencyEnum.getContractPow(CurrencyEnum.USD_N), 2)
            : '';
    }

    render() {
        const { isSwapLoading } = this.state;

        const steps = [
            {
                id: 'generation',
                label: __('Tokens swap'),
            },
            {
                id: 'details',
                label: __('Confirm details'),
            },
        ];

        console.log('withdraw', this.props.withdraw);

        return (
            <div className={bem.block()}>
                <UserCongratsModalContext.Consumer>
                    {context =>
                        this.doesSwapLoadingEnd(this._wasSwapLoading, isSwapLoading, context.onOpen)
                    }
                </UserCongratsModalContext.Consumer>
                {this.state.isSwapLoading && <SwapLoader {...this.props.withdraw} />}
                {this.renderStepChanger(steps)}
                <Form className={bem.element('form')} formId={FORM_ID} onSubmit={this._onSubmit}>
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
                        <span className={bem.element('step-count')}>{index + 1}</span>
                        <span className={bem.element('step-label')}>{item.label}</span>
                    </div>
                ))}
            </div>
        );
    }

    renderGenerationStep() {
        const grabNeutrinoAddress = config => {
            try {
                return config.dal.contracts[PairsEnum.USDNB_USDN][ContractEnum.NEUTRINO];
            } catch (err) {
                return '';
            }
        };

        return (
            <>
                <div className={bem.element('inputs')}>
                    <div className={bem.element('input-container')}>
                        <div className={bem.element('input-label')}>{__('Send')}</div>
                        <InputField
                            className={bem.element('input')}
                            attribute={this.state.isWavesLeft ? 'waves' : 'neutrino'}
                            inners={{
                                label: this.state.isWavesLeft
                                    ? CurrencyEnum.getLabel(CurrencyEnum.WAVES)
                                    : CurrencyEnum.getLabel(this.props.quoteCurrency),
                                icon: this.state.isWavesLeft
                                    ? CurrencyEnum.getIconClass(CurrencyEnum.WAVES)
                                    : CurrencyEnum.getIconClass(CurrencyEnum.USD_N),
                            }}
                        />
                        <div className={bem.element('input-hint')}>
                            {__('Min. {currency} required: 1 {currency}', {
                                currency: this.state.isWavesLeft
                                    ? CurrencyEnum.getLabel(CurrencyEnum.WAVES)
                                    : CurrencyEnum.getLabel(this.props.quoteCurrency),
                            })}
                        </div>
                    </div>

                    <div
                        className={bem.element('exchange-button')}
                        onClick={() => this.setState({ isWavesLeft: !this.state.isWavesLeft })}
                    >
                        <span className={'Icon Icon__exchange'} />
                    </div>

                    <div className={bem.element('input-container')}>
                        <div className={bem.element('input-label')}>{__('Receive')}</div>
                        <InputField
                            className={bem.element('input')}
                            attribute={this.state.isWavesLeft ? 'neutrino' : 'waves'}
                            inners={{
                                label: this.state.isWavesLeft
                                    ? CurrencyEnum.getLabel(this.props.quoteCurrency)
                                    : CurrencyEnum.getLabel(CurrencyEnum.WAVES),
                                icon: this.state.isWavesLeft
                                    ? CurrencyEnum.getIconClass(CurrencyEnum.USD_N)
                                    : CurrencyEnum.getIconClass(CurrencyEnum.WAVES),
                            }}
                        />
                        <div className={bem.element('input-hint')}>
                            {__('Max {currency} available to generate: 10k {currency}', {
                                currency: this.state.isWavesLeft
                                    ? CurrencyEnum.getLabel(this.props.quoteCurrency)
                                    : CurrencyEnum.getLabel(CurrencyEnum.WAVES),
                            })}
                        </div>
                    </div>
                </div>

                <div className={bem.element('info')}>
                    <div className={bem.element('info-column')}>
                        <ConfigContext.Consumer>
                            {environmentConfig => (
                                <div className={bem.element('info-row')}>
                                    <div className={bem.element('info-string')}>
                                        <div className={bem.element('info-hint')}>
                                            <Hint
                                                text={__(grabNeutrinoAddress(environmentConfig))}
                                            />
                                        </div>
                                        <span>{__('Smart contract')}</span>
                                    </div>
                                    <span>{grabNeutrinoAddress(environmentConfig)}</span>
                                </div>
                            )}
                        </ConfigContext.Consumer>
                        <div className={bem.element('info-row')}>
                            <div className={bem.element('info-string', 'without-hint')}>
                                <span>{__('Number of oracles')}</span>
                            </div>
                            <span>{__('5')}</span>
                        </div>
                    </div>
                    <div className={bem.element('info-column')}>
                        <div className={bem.element('info-row')}>
                            <div className={bem.element('info-string')}>
                                <span>
                                    {__('Total issued {currency}', {
                                        currency: CurrencyEnum.getLabel(this.props.quoteCurrency),
                                    })}
                                </span>
                            </div>
                            <span>{this.getTotalIssued()}</span>
                        </div>
                        <div className={bem.element('info-row')}>
                            <div className={bem.element('info-string')}>
                                <span>
                                    {__('Current WAVES / {currency} price', {
                                        currency: this.props.sourceCurrency.toUpperCase(),
                                    })}
                                </span>
                            </div>
                            <span>
                                {this.getControlPrice()}{' '}
                                {CurrencyEnum.getSign(this.props.sourceCurrency)}
                            </span>
                        </div>
                    </div>
                </div>
                <div className={bem.element('generate-actions')}>
                    <Button
                        disabled={
                            !_get(this.props.formValues, 'waves') ||
                            !_get(this.props.formValues, 'neutrino') ||
                            !_toNumber(_get(this.props.formValues, 'waves')) ||
                            !_toNumber(_get(this.props.formValues, 'neutrino'))
                        }
                        className={bem.element('submit-button')}
                        label={
                            this.state.isWavesLeft
                                ? __('Issue {currency}', {
                                      currency: CurrencyEnum.getLabel(this.props.quoteCurrency),
                                  })
                                : __('Redeem WAVES')
                        }
                        onClick={() => this.setState({ step: 'details' })}
                    />
                    {this.renderWithdraw()}
                </div>
            </>
        );
    }

    renderWithdraw() {
        const neutrinoBlocked = _get(this.props, 'withdraw.neutrinoBlocked');
        const wavesBlocked = _get(this.props, 'withdraw.wavesBlocked');
        const height = _get(this.props, 'withdraw.height');
        const unblockBlock = _get(this.props, 'withdraw.unblockBlock');
        const countBlock = unblockBlock - height > 0 ? unblockBlock - height : 0;
        const withdrawHint = __(
            'Assets locked on the smart contract which will become available for withdrawal after {count-blocks} blocks (~{count-minutes} minutes)',
            {
                'count-blocks': countBlock,
                'count-minutes': countBlock, // 1block = 1min
            }
        );

        return (
            <div className={bem.element('withdraw')}>
                <div className={bem.element('withdraw-info')}>
                    <div className={bem.element('withdraw-hint')}>
                        <Hint text={withdrawHint} />
                    </div>
                    {/*__('Neutrino locked: {neutrino} | Waves locked: {waves}', {
                        neutrino: neutrinoBlocked && neutrinoBlocked.toFixed(2) || 0,
                        waves: wavesBlocked && wavesBlocked.toFixed(2) || 0,
                    })*/}
                </div>
                {/* <Button
                    disabled={(!neutrinoBlocked && !wavesBlocked) || height < unblockBlock}
                    className={bem.element('withdraw-button')}
                    label={__('Withdraw')}
                    onClick={this._withdraw}
                /> */}
            </div>
        );
    }

    renderDetailsStep() {
        return (
            <>
                <div className={bem.element('details')}>
                    <div className={bem.element('details-item')}>
                        <span className={bem.element('details-label')}>
                            {__('Please confirm the assets swap')}
                        </span>
                        <div className={bem.element('details-inner', 'generation')}>
                            <div className={bem.element('values')}>
                                <span className={bem.element('value-title')}>{__('Send')}:</span>
                                <div className={bem.element('value-item')}>
                                    <span className={bem.element('value-number')}>
                                        {_get(
                                            this.props.formValues,
                                            this.state.isWavesLeft ? 'waves' : 'neutrino'
                                        )}
                                    </span>
                                    <span
                                        className={bem(
                                            bem.element('value-icon'),
                                            `Icon ${
                                                this.state.isWavesLeft
                                                    ? CurrencyEnum.getIconClass(CurrencyEnum.WAVES)
                                                    : CurrencyEnum.getIconClass(CurrencyEnum.USD_N)
                                            }`
                                        )}
                                    />
                                    <span className={bem.element('value-name')}>
                                        {this.state.isWavesLeft
                                            ? CurrencyEnum.getLabel(CurrencyEnum.WAVES)
                                            : CurrencyEnum.getLabel(this.props.quoteCurrency)}
                                    </span>
                                </div>
                            </div>
                            <div className={bem.element('values')}>
                                <span className={bem.element('value-title')}>{__('Receive')}:</span>
                                <div className={bem.element('value-item')}>
                                    <span className={bem.element('value-number')}>
                                        {_get(
                                            this.props.formValues,
                                            this.state.isWavesLeft ? 'neutrino' : 'waves'
                                        )}
                                    </span>
                                    <span
                                        className={bem(
                                            bem.element('value-icon'),
                                            `Icon ${
                                                this.state.isWavesLeft
                                                    ? CurrencyEnum.getIconClass(CurrencyEnum.USD_N)
                                                    : CurrencyEnum.getIconClass(CurrencyEnum.WAVES)
                                            }`
                                        )}
                                    />
                                    <span className={bem.element('value-name')}>
                                        {this.state.isWavesLeft
                                            ? CurrencyEnum.getLabel(this.props.quoteCurrency)
                                            : CurrencyEnum.getLabel(CurrencyEnum.WAVES)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <GlobalLinksContext.Consumer>
                        {context => {
                            const tosLink = context.links.find(
                                link => link.label === 'Terms of Service'
                            ).url;
                            return (
                                <CheckboxField
                                    className={bem.element('terms-checkbox')}
                                    label={
                                        <span>
                                            {__('I have read and accept the')}{' '}
                                            <a href={tosLink} target="_blank">
                                                {__('Terms of Service')}
                                            </a>
                                        </span>
                                    }
                                    attribute={'terms'}
                                />
                            );
                        }}
                    </GlobalLinksContext.Consumer>
                    <div className={bem.element('details-actions')}>
                        <Button
                            color={'secondary'}
                            className={bem.element('back-button')}
                            label={__('Go back')}
                            onClick={() => this.setState({ step: 'generation' })}
                        />
                        <Button
                            type={'submit'}
                            className={bem.element('finalize-button')}
                            disabled={!_get(this.props.formValues, 'terms')}
                            label={__('Confirm')}
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

        const rate = _get(props, 'neutrinoConfig.price');

        let amount = this._parseAmount(
            isRefreshToAmount
                ? _get(props.formValues, 'waves') * rate
                : _get(props.formValues, 'neutrino') / rate
        );

        store.dispatch(
            change(
                FORM_ID,
                isRefreshToAmount ? 'neutrino' : 'waves',
                this._toFixedSpecial(amount, 2)
            )
        );
    }

    _parseAmount(amount) {
        if (typeof amount === 'undefined') {
            return 0;
        }
        let result = typeof amount === 'string' ? amount.replace(/,/, '.') : amount;
        return !isNaN(parseFloat(result)) && isFinite(result) ? result : 0;
    }

    _toFixedSpecial = function(num, n) {
        const str = num.toFixed(n);
        if (str.indexOf('e+') < 0) {
            return str;
        }

        // if number is in scientific notation, pick (b)ase and (p)ower
        return (
            str
                .replace('.', '')
                .split('e+')
                .reduce(function(p, b) {
                    return p + new Array(b - p.length + 2).join(0);
                }) +
            '.' +
            new Array(n + 1).join(0)
        );
    };

    _onSubmit(values) {
        this.setState({ step: 'generation' });
        store.dispatch(reset(FORM_ID));

        return this.state.isWavesLeft
            ? dal.swapWavesToNeutrino(this.props.pairName, values.waves)
            : dal
                  .swapNeutrinoToWaves(
                      this.props.pairName,
                      this.props.quoteCurrency,
                      values.neutrino
                  )
                  .catch(err => {
                      console.log('Swap Error: ', err.stack || err); // eslint-disable-line no-console
                      throw new Error(err.data);
                  });
    }

    _withdraw() {
        return dal.withdraw(
            this.props.pairName,
            this.props.user.address,
            this.props.withdraw.index
        );
    }
}
