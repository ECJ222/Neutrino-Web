import React from 'react';
import PropTypes from 'prop-types';
// import _orderBy from 'lodash-es/orderBy';
// import _isInteger from 'lodash-es/isInteger';
import {
    orderBy as _orderBy,
    round as _round,
    isInteger as _isInteger
} from 'lodash';
import moment from 'moment';

import { dal, html } from 'components';

import './OrdersTable.scss';
import OrderSchema from 'types/OrderSchema';
import PairsEnum from '../../../enums/PairsEnum';
import OrderTypeEnum from '../../../enums/OrderTypeEnum';
import CurrencyEnum from 'enums/CurrencyEnum';
// import OrderStatusEnum from 'enums/OrderStatusEnum';
import { computeROI } from 'reducers/contract/helpers';

const bem = html.bem('OrdersTable');

export default class OrdersTable extends React.PureComponent {
    static propTypes = {
        items: PropTypes.arrayOf(OrderSchema),
        pairName: PropTypes.string,
        isHistory: PropTypes.bool,
    };

    static defaultProps = {
        isHistory: false,
    };

    constructor() {
        super(...arguments);

        this.getTableHead = this.getTableHead.bind(this);
        this.getTableBody = this.getTableBody.bind(this);

        
        this.fieldTable = {
            name: {
                label: 'Name',
                get: item => item.type === OrderTypeEnum.LIQUIDATE ? CurrencyEnum.getLabel(item.currency) : PairsEnum.getLabel(item.pairName)
            },
            type: {
                label: 'Type',
                get: item => OrderTypeEnum.getLabel(item.type) || '--'
            },
            time: {
                label: 'Time',
                get: item => moment(item.timestamp).format('DD/MM/YYYY hh:mm:ss') || '--'
            },
            usdnb: {
                label: 'USD-NB',
                get: item => item.restAmount || '--'
            },
            price: {
                label: 'Price',
                get: item => item.price ? item.price / 100 : '--'
            },
            roi: {
                label: 'ROI',
                get: (order, controlPrice) => {
                    console.log({ restAmount: order.restAmount }, order.restAmount, order.total, controlPrice, computeROI(order.restAmount, order.total, controlPrice));
                    return order.amount && order.total ? _round(computeROI(order.restAmount, order.total, controlPrice), 2) : '--'
                }
            },
            waves: {
                label: 'WAVES',
                get: (item, controlPrice) => item.restAmount && controlPrice ? _round(item.restAmount / (controlPrice / 100), 2) : '--'
            },
            status: {
                label: 'Status',
                get: item => (
                    _isInteger(item.restTotal) ? item.restTotal : _isInteger(item.total)
                ) ? item.total : '--'
            },
            cancelall: {
                label: 'Cancel All'
            }
        };

        this.state = {
            sort: ['amount', 'desc'],
            search: '',
        };
    }

    getTableHead(items) {
        const { isHistory } = this.props;
        const { fieldTable } = this;

        return (
            <thead>
                <tr>
                    <th className={bem.element('search-column')}>
                        <div className={bem.element('header')}>{fieldTable.name.label}</div>
                    </th>
                    <th>
                        <div
                            className={bem.element('header')}
                            onClick={() => this.toggleSort('type')}
                        >
                            {fieldTable.type.label}
                            {this.renderSortButtons('type')}
                        </div>
                    </th>
                    <th>
                        <div
                            className={bem.element('header')}
                            onClick={() => this.toggleSort('time')}
                        >
                            {fieldTable.time.label}
                            {this.renderSortButtons('time')}
                        </div>
                    </th>
                    <th>{fieldTable.usdnb.label}</th>
                    <th>{fieldTable.price.label}</th>
                    <th>{fieldTable.status.label}</th>
                    <th>{fieldTable.roi.label}</th>
                    <th>{fieldTable.waves.label}</th>
                    {!isHistory && (
                        <th className={bem.element('cancel-column')}>
                            <div
                                className={bem.element('cancel')}
                                onClick={() => {
                                    items.forEach(item =>
                                        dal.cancelOrder(this.props.pairName, item.type, item.id)
                                    );
                                }}
                            >
                                <span
                                    className={bem(bem.element('cancel-icon'), 'Icon Icon__cancel')}
                                />
                                {fieldTable.cancelall.label}
                            </div>
                        </th>
                    )}
                </tr>
            </thead>
        );
    }

    getTableBody() {
        const { controlPrice } = this.props;
        // 
        const items = [{
            height: "1837728",
            timestamp: 1576258303151,
            owner: "3P6LsCKZbvBj7PNFbV72AcMvqCoGaAkvMh8",
            price: 81,
            total: 3.04,
            filledTotal: 0,
            restTotal: 3.04,
            status: "canceled",
            index: null,
            amount: 3.75,
            filledAmount: 0,
            restAmount: 3.75,
            pairName: "usd-nb_usd-n",
            type: "buy",
            id: "DhVEVcWQMBYXkdMdGtcJCUAiFp18rCpt4Jb8aVGEx5XD"
        }]

        const { fieldTable } = this;

        return (
            <tbody>
                {(items.length > 0 && (
                    <>
                        {items.map((item, index) => (
                            <tr key={index}>
                                <td>
                                    {fieldTable.name.get(item)}
                                </td>
                                <td className={bem.element('type-column', item.type)}>
                                    {fieldTable.type.get(item)}
                                </td>
                                <td>
                                    {fieldTable.time.get(item)}
                                </td>
                                <td>{fieldTable.usdnb.get(item)}</td>
                                <td>{fieldTable.price.get(item)}</td>
                                <td>{fieldTable.status.get(item)}</td>
                                <td>{fieldTable.roi.get(item, controlPrice)}</td>
                                <td>{fieldTable.waves.get(item, controlPrice)}</td>
                                {!this.props.isHistory && (
                                    <td className={bem.element('cancel-column')}>
                                        <div
                                            className={bem.element('cancel')}
                                            onClick={() =>
                                                dal.cancelOrder(
                                                    this.props.pairName,
                                                    item.type,
                                                    item.id
                                                )
                                            }
                                        >
                                            <span
                                                className={bem(
                                                    bem.element('cancel-icon'),
                                                    'Icon Icon__cancel'
                                                )}
                                            />
                                            {__('Cancel')}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </>
                )) || (
                    <tr>
                        <td colSpan={this.props.isHistory ? 6 : 7}>
                            <div className={bem.element('empty')}>
                                {this.props.isHistory ? __('No history') : __('No orders')}
                            </div>
                        </td>
                    </tr>
                )}
            </tbody>
        );
    }

    render() {
        if (!this.props.items) {
            return null;
        }

        const { sort: sortOrder } = this.state;

        const items = _orderBy(this.props.items, [sortOrder[0]], [sortOrder[1]]);

        return (
            <div className={bem.block()}>
                <table>
                    {this.getTableHead(items)}
                    {this.getTableBody(items)}
                </table>
            </div>
        );
    }

    toggleSort(column) {
        this.setState({ sort: [column, this.state.sort[1] === 'asc' ? 'desc' : 'asc'] });
    }

    renderSortButtons(column) {
        return (
            <div className={bem.element('sort-buttons')}>
                <a
                    className={bem.element('sort-button', {
                        asc: true,
                        active: this.state.sort[0] === column && this.state.sort[1] === 'asc',
                    })}
                    onClick={e => {
                        e.preventDefault();
                        this.setState({ sort: [column, 'asc'] });
                    }}
                />
                <a
                    className={bem.element('sort-button', {
                        desc: true,
                        active: this.state.sort[0] === column && this.state.sort[1] === 'desc',
                    })}
                    onClick={e => {
                        e.preventDefault();
                        this.setState({ sort: [column, 'desc'] });
                    }}
                />
            </div>
        );
    }
}
