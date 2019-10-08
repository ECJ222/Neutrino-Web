const _get = require('lodash/get');
const BaseCollection = require('../base/BaseCollection');
const CurrencyEnum = require('../enums/CurrencyEnum');

module.exports = class RpdUserHistoryBalances extends BaseCollection {


    getKeys(id = '([A-Za-z0-9]{44}_[A-Za-z0-9]{35}_[0-9]{1,4})$') {
        return [
            `rpd_balance_${id}`, //rpd_balance_{assetId}_{userId}_{historySyncIndex}
        ];
    }

    async getBalance(id) {
        const item = await this.getItem(id);

        return _get(item, 'balance', 0);
    }

    _getCurrencyByAsset(assetId) {
        return Object.entries(this.assets).find(item => item[1] === assetId)[0];
    }

    async _prepareItem(id, item) {
        const assetId = id.split('_')[0];
        const currency = this._getCurrencyByAsset(assetId);

        return {
            'balance': CurrencyEnum.isBond(currency)
                ? item[`rpd_balance_${id}`]
                : item[`rpd_balance_${id}`] / CurrencyEnum.getContractPow(CurrencyEnum.USD_N),
        }
    }
};
