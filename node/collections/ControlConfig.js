const _round = require('lodash/round');

const BaseCollection = require('../base/BaseCollection');

module.exports = class ControlConfig extends BaseCollection {


    constructor() {
        super(...arguments);
        this.price = '';
        this.isBlocked = undefined;
    }

    getKeys() {
        return [
            'price',
            'is_blocked',
        ];
    }

    /**
     * @returns {Promise}
     */
    async getConfig() {
        let items = await this.getItem(this.pairName);
        return items;
    }


    async updateAll(nodeData) {
        this.logger.debug('Update all items of ' + this.collectionName + ' collection... ');

        for (let nodeKey in nodeData) {

            if (nodeKey.match(`${this.getKeys()[0]}$`)) {
                this.price = nodeData[nodeKey];
            }

            if (nodeKey.match(this.getKeys()[1])) {
                this.isBlocked = nodeData[nodeKey];
            }

            if (this.price && this.isBlocked !== undefined) {
                break;
            }
        }

        const data = {
            [this.pairName]: {},
        };

        data[this.pairName]['price'] = this.price;
        data[this.pairName]['isBlocked'] = this.isBlocked === undefined ? false : this.isBlocked;

        await this._updateNext(Object.keys(data), data);
    }

    async _prepareItem(currency, item) {

        return {
            price: _round(item['price'] / 100, 2),
            isBlocked: item['isBlocked'],
        };
    }
};