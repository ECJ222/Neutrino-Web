import _get from 'lodash/get';
import {setUser} from 'yii-steroids/actions/auth';
import {getUser} from 'yii-steroids/reducers/auth';
import fetchHoc from './dal/fetchHoc';
import apiHoc from './dal/apiHoc';
import {clientStorage, http} from 'components';

import WavesTransport from './dal/WavesTransport';
import axios from 'axios';
import ContractEnum from '../enums/ContractEnum';
import BalanceCurrencyEnum from '../enums/BalanceCurrencyEnum';
import UserRole from 'enums/UserRole';

export default class DalComponent {

    constructor() {
        this.neutrinoAddress = null;
        this.auctionAddress = null;
        this.network = null;

        this.hoc = fetchHoc;
        this.hoc2 = apiHoc;
        this._authInterval = null;
        this._authChecker = this._authChecker.bind(this);

        if (process.env.NODE_ENV !== 'production') {
            window.dal = this;
        }

        this._transports = {};
    }


    getTransport(contract = ContractEnum.NEUTRINO) {
        if (!this._transports[contract]) {
            this._transports[contract] = new WavesTransport(this, contract);
        }
        return this._transports[contract];
    }

    async getWavesToUsdPrice() {
        return  await this.getTransport().nodeFetchKey('price') / 100;
    }

    async getBalance(address) {
        return await this.getTransport().getBalance(address);
    }

    async isKeeperInstalled() {
        const keeper = await this.getTransport().getKeeper();
        return !!keeper;
    }

    async getAccount() {
        const keeper = await this.getTransport().getKeeper();
        if (!keeper) {
            return null;
        }

        try {
            const userData = await keeper.publicState();
            return userData.account;
        } catch {
            return null;
        }
    }

    /**
     * Auth current user and return it data
     * @returns {Promise}
     */
    async auth() {
        const account = await this.getAccount();

        const user = account ?
            {
                role: UserRole.REGISTERED,
                address: account.address,
                balance: await this.getBalance(account.address),
                network: account.network,
            } : null;

        if (this._authInterval) {
            clearInterval(this._authInterval);
        }
        this._authInterval = setInterval(this._authChecker, 1000);

        const STORAGE_AUTH_KEY = require('shared/RightSidebar/RightSidebar').STORAGE_AUTH_KEY;
        if (!clientStorage.get(STORAGE_AUTH_KEY) && clientStorage.get(STORAGE_AUTH_KEY) !== 'false') {
            const store = require('components').store;
            store.dispatch(setUser(user));
            clientStorage.set(STORAGE_AUTH_KEY, '1');
        }

        return user;
    }

    async logout() {
        const store = require('components').store;
        store.dispatch(setUser(null));
        const STORAGE_AUTH_KEY = require('shared/RightSidebar/RightSidebar').STORAGE_AUTH_KEY;
        clientStorage.remove(STORAGE_AUTH_KEY);
    }

    async _authChecker() {
        // Get prev address
        const store = require('components').store;
        const prevAddress = _get(getUser(store.getState()), 'address');

        // Get next address
        const account = await this.getAccount();
        const nextAddress = account ? account.address : null;

        if (prevAddress && nextAddress && prevAddress !== nextAddress) {

            const user = await this.auth();
            store.dispatch(setUser(user));
        }
    }

    async swapWavesToNeutrino(amount) {
        await this.getTransport().nodePublish(
            'swapWavesToNeutrino',
            [],
            'WAVES',
            amount,
        );
    }

    async swapNeutrinoToWaves(amount) {
        await this.getTransport().nodePublish(
            'swapNeutrinoToWaves',
            [],
            await this.getTransport().nodeFetchKey('neutrino_asset_id'),
            amount,
        );
    }

    async setOrder(pairName, price, bondsAmount) {
        price = Math.round(price * 100) / 100;
        const contractPrice = price * 100;
        let position =  _get(await axios.get(`/api/v1/bonds/${pairName}/position`, {params: {price: contractPrice}}), 'data.position');
        if (price > 0 && bondsAmount > 0 && Number.isInteger(position)) {
            await this.getTransport(ContractEnum.AUCTION).nodePublish(
                'setOrder',
                [
                    contractPrice,
                    position
                ],
                await this.getTransport(ContractEnum.AUCTION).nodeFetchKey('neutrino_asset_id'),
                bondsAmount * price,
                true,
            );
        }
    }

    async cancelOrder(hash) {
        await this.getTransport(ContractEnum.AUCTION).nodePublish(
            'cancelOrder',
            [
                hash
            ],
            'WAVES',
            0,
            true,
        );
    }

    /*async getOrderBook() {
        const orders = await this.getTransport(ContractEnum.AUCTION).nodeFetchKey('orderbook');
        return await Promise.all(
            orders.substr(1).split('_').map(async address => {
                return {
                    amount: await this.getTransport(ContractEnum.AUCTION).nodeFetchKey(`order_amount_${address}`) / this.getTransport().wvs,
                    price: await this.getTransport(ContractEnum.AUCTION).nodeFetchKey(`order_price_${address}`) / 100,
                };
            })
        );
    }*/

    async getUserOrders() {
        const account = await this.getAccount();
        let orders = await http.get('/api/v1/orders', {address: account.address});
        return orders.map((order) => {
            return {
                currency: BalanceCurrencyEnum.USD_NB,
                ...order,
            }
        })

    }
}
