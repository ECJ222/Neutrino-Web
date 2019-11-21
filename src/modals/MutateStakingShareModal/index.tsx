import React from 'react';
import Modal from 'react-modal';
import { html } from 'components';
import Button from 'yii-steroids/ui/form/Button';
import BaseInput from 'ui/form/BaseInput';
import AccountBalanceTitle from 'shared/Staking/AccountBalanceTitle';
import PercentButton from 'ui/form/PercentButton';
import { BlurContext } from 'shared/Layout/context';
import usdnLogo from 'static/icons/usd-n.svg';

import './style.scss';

const bem = html.bem('MutateStakingShareModal');

interface Props {
    accountBalance: number;
    stakingBalance: number;
    title: string;
    isOpened: boolean;
    buttonLabel: string;
    onClose: () => void;
    isDecrease: boolean;
}
interface State {
    usdnValue: string;
}

class MutateStakingShareModal extends React.Component<Props, State> {
    percentage: number[];

    static contextType = BlurContext;

    constructor(props) {
        super(props);

        this.getPercentButtons = this.getPercentButtons.bind(this);
        this.getParentSelector = this.getParentSelector.bind(this);
        this.setPercentOfBalance = this.setPercentOfBalance.bind(this);
        this.onChangeUsdn = this.onChangeUsdn.bind(this);
        this.mapPercentage = this.mapPercentage.bind(this);

        this.percentage = [25, 50, 75, 100];

        this.state = {
            usdnValue: '',
        };
    }

    componentWillMount() {}

    componentDidUpdate() {
        if (this.props.isOpened) {
            this.context.blur();
        } else {
            this.context.unblur();

            if (this.state.usdnValue !== '') {
                this.setState({ usdnValue: '' });
            }
        }
    }

    componentWillUnmount() {
        this.context.unblur();
    }

    getParentSelector() {
        return document.body;
    }

    onChangeUsdn(event: React.FormEvent<HTMLInputElement>) {
        const { value } = event.target as HTMLInputElement;

        if (!value) {
            return;
        }

        this.setState({ usdnValue: value });
    }

    setPercentOfBalance(percent: number) {
        const { isDecrease, accountBalance, stakingBalance } = this.props;
        const balance = !isDecrease ? accountBalance : stakingBalance;
        const value = `${(percent / 100) * balance}`;

        this.setState({ usdnValue: value });
    }

    mapPercentage(label: number) {
        return (
            <PercentButton label={`${label}%`} onClick={() => this.setPercentOfBalance(label)} />
        );
    }

    getPercentButtons() {
        return this.percentage.map(this.mapPercentage);
    }

    render() {
        const { title, accountBalance, stakingBalance, buttonLabel } = this.props;
        const { usdnValue } = this.state;

        return (
            <Modal
                className={bem.block()}
                isOpen={this.props.isOpened}
                onRequestClose={this.props.onClose}
                parentSelector={this.getParentSelector}
            >
                <div>
                    <div className={bem.element('body')}>
                        <span className={bem.element('title')}>{title}</span>
                        <div className={bem.element('balances')}>
                            <AccountBalanceTitle title="Account balance:" amount={accountBalance} />
                            <AccountBalanceTitle title="Staking balance:" amount={stakingBalance} />
                        </div>
                        <div className={bem.element('actions')}>
                            <div className={bem.element('percents')}>
                                {this.getPercentButtons()}
                            </div>
                            <div
                                className={bem.element(
                                    'buttons',
                                    this.props.isDecrease && 'decrease'
                                )}
                            >
                                <BaseInput
                                    iconLabel="USD-N"
                                    icon={usdnLogo}
                                    value={usdnValue}
                                    onChange={this.onChangeUsdn}
                                />
                                <Button label={buttonLabel} />
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

export default MutateStakingShareModal;