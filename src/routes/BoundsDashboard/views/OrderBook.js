import React from 'react';
import PropTypes from 'prop-types';
import _round from 'lodash/round';
import _sum from 'lodash/sum';
import _groupBy from 'lodash/groupBy';

import {html} from 'components';

import './OrderBook.scss';
import CurrencyEnum from 'enums/CurrencyEnum';
import OrderSchema from 'types/OrderSchema';
import UserSchema from 'types/UserSchema';

const bem = html.bem('OrderBook');

export default class OrderBook extends React.PureComponent {

    static propTypes = {
        baseCurrency: PropTypes.string,
        quoteCurrency: PropTypes.string,
        user: UserSchema,
        orders: PropTypes.arrayOf(OrderSchema),
        formTab: PropTypes.oneOf(['buy', 'liquidate']),
    };

    render() {
        if (!this.props.orders) {
            return null;
        }

        const groupedOrders = _groupBy(this.props.orders, 'discountPercent');
        return (
            <div className={bem.block()}>
                <div className={bem.element('title')}>
                    {__('Order Book')}
                </div>
                <div className={bem.element('header-row')}>
                    <div className={bem.element('header-column', 'upper-case')}>
                        {CurrencyEnum.getLabel(this.props.baseCurrency)}
                    </div>
                    {this.props.formTab === 'buy' && (
                        <>
                            <div className={bem.element('header-column')}>
                                % {__('discount')}
                            </div>
                            <div className={bem.element('header-column', 'upper-case')}>
                                {CurrencyEnum.getLabel(this.props.quoteCurrency)}
                            </div>
                        </>
                    )}
                </div>
                <div className={bem.element('header-row', 'summary')}>
                    {this.props.formTab === 'buy' && (
                        <>
                            <div className={bem.element('header-column', 'upper-case')}>
                                {_round(_sum(this.props.orders.map(order => order.restAmount)))}
                            </div>
                            <div className={bem.element('header-column')}>
                                —
                            </div>
                            <div className={bem.element('header-column', 'upper-case')}>
                                {_round(_sum(this.props.orders.map(order => order.restTotal)), 2)}
                            </div>
                        </>
                    )}
                    {this.props.formTab === 'liquidate' && (
                        <>
                            <div className={bem.element('header-column', 'upper-case')}>
                                {_round(_sum(this.props.orders.map(order => order.restTotal)))}
                            </div>
                        </>
                    )}
                </div>
                {this.props.formTab === 'buy' && (
                    <div className={bem.element('columns')}>
                        {Object.keys(groupedOrders).map(discountPercent => (
                            <div
                                key={discountPercent}
                                className={bem.element('body-row', {
                                    my: this.props.user && groupedOrders[discountPercent].map(order => order.owner).includes(this.props.user.address),
                                })}
                            >
                                <div className={bem.element('body-column', 'bg')}>
                                    {_round(_sum(groupedOrders[discountPercent].map(order => order.restAmount)))}
                                </div>
                                <div className={bem.element('body-column')}>
                                    {discountPercent}%
                                </div>
                                <div className={bem.element('body-column', 'bg')}>
                                    {_round(_sum(groupedOrders[discountPercent].map(order => order.restTotal)), 2)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {this.props.formTab === 'liquidate' && (
                    <div className={bem.element('columns')}>
                        {this.props.orders.map(order => (
                            <div
                                key={order.id}
                                className={bem.element('body-row', {
                                    my: this.props.user && this.props.user.address === order.owner,
                                })}
                            >
                                <div className={bem.element('body-column', 'bg')}>
                                    {_round(order.restTotal)}
                                </div>
                                <div className={bem.element('body-column', 'address')}>
                                    {order.owner}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }
}
