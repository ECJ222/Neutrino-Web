
const BaseCollection = require('../base/BaseCollection');
const PairsEnum = require('../enums/PairsEnum');

module.exports = class RpdNeutrinoBalances extends BaseCollection {

    constructor() {
        super(...arguments);
        this.neutrinoAssetId = this.assets[PairsEnum.getQuote(this.pairName)]; //neutrino assetId
    }

    getKeys(id = '([A-Za-z0-9]{35})$') {

        // const assetId = '([A-Za-z0-9]{44})';

        return [
            `rpd_balance_${this.neutrinoAssetId}_${id}`,
        ];
    }

    async _prepareItem(id, item) {
        return {
            'balance': item[`rpd_balance_${this.neutrinoAssetId}_${id}`] / Math.pow(10, 8),
        }
    }
};
