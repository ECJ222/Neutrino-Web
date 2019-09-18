import React from 'react';
import ReactCharts from 'react-highcharts/ReactHighcharts.src';

import {html} from 'components';
const bem = html.bem('LeasingChart');

export default class LeasingChart extends React.PureComponent {
    constructor(props) {
        super(props);
        this._config = {
            chart: {
                type: 'column',
                backgroundColor: null,
            },
            title: {
                text: 'Cashout and Income',
                style: {
                    color: '#ffffff',
                    fontSize: '14px',
                    fontFamily: 'Montserrat',
                },
                align: 'left'
            },
            xAxis: {
                lineColor: '#4A4A7F',
                tickWidth: 0,
                categories: ['425769', '425769', '425769', '425769', '425769', '425769'],
                labels: {
                    style: {
                        fontFamily: 'Roboto',
                        fontSize: '10px',
                        color: 'rgba(203, 203, 218, 0.62)'
                    }
                }
            },
            yAxis: {
                gridLineWidth: 0,
                lineWidth: 1,
                lineColor: '#4A4A7F',
                min: 0,
                title: {
                    text: null
                },
                stackLabels: {
                    enabled: false
                },
                labels: {
                    format: '{value}',
                    style: {
                        fontFamily: 'Roboto',
                        fontSize: '12px',
                        color: 'rgba(203, 203, 218, 0.62)'
                    },
                    step: 2
                }
            },
            legend: {
                align: 'right',
                verticalAlign: 'top',
                floating: true,
                backgroundColor: null,
                shadow: false,
                itemStyle: {
                    color: '#ffffff',
                    fontSize: '14px',
                    fontFamily: 'Montserrat',
                    fontWeight: 300
                },
                symbolRadius: 0,
                symbolWidth: 10
            },
            plotOptions: {
                column: {
                    stacking: 'normal',
                    dataLabels: {
                        enabled: false
                    }
                }
            },
            series: [{
                name: 'Cashout',
                borderColor: null,
                color: '#134EC8',
                data: [2500, 2700, 1600, 2400, 1200, 2000]
            }, {
                name: 'Income',
                borderColor: null,
                color: '#00F59E',
                data: [2500, 2800, 1400, 2500, 1300, 2100]
            }],
            credits: false,
        }
    }

    render() {
        return (
            <div className={bem.block()}>
                <ReactCharts config={this._config}/>
            </div>
        )
    }
}

