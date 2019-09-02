import _get from 'lodash/get';
import {setUser} from 'yii-steroids/actions/auth';
import {getUser} from 'yii-steroids/reducers/auth';
import fetchHoc from './dal/fetchHoc';

import WavesTransport from './dal/WavesTransport';

export default class DalComponent {

    constructor() {
        this.neutrinoAddress = '3MrtHeXquGPcRd3YjJQHfY1Ss6oSDpfxGuL'; // testnet
        this.auctionAddress = '3NC8pQxcnDTtDkhzv5Eje8qqW4qoFawLnAb'; // testnet //todo give this address from data of contract (auction_contract)
        this.isTestMode = process.env.APP_DAPP_NETWORK === 'test';
        this.transport = new WavesTransport(this);

        this.hoc = fetchHoc;
        this._authInterval = null;
        this._authChecker = this._authChecker.bind(this);

        if (this.isTestMode || process.env.NODE_ENV !== 'production') {
            window.dal = this;
        }
    }

    async getWavesToUsdPrice() {
        return  await this.transport.nodeFetchKey('price');
    }

    async getBalance(address) {
        return await this.transport.getBalance(address)
    }

    async isKeeperInstalled() {
        const keeper = await this.transport.getKeeper();
        return !!keeper;
    }

    async getAccount() {
        const keeper = await this.transport.getKeeper();
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
                address: account.address,
                balance: await this.getBalance(account.address),
                network: account.network,
            } : null;

        if (this._authInterval) {
            clearInterval(this._authInterval);
        }
        this._authInterval = setInterval(this._authChecker, 1000);

        return user;
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
        await this.transport.nodePublish(
            'swapWavesToNeutrino',
            [],
            amount,
        );
    }

    async swapNeutrinoToWaves(amount) {
        await this.transport.nodePublish(
            'swapNeutrinoToWaves',
            [],
            amount,
        );
    }

}
