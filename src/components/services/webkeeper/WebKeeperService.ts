import WebKeeper from './WebKeeper';

class WebKeeperService {
    ref: WebKeeper;

    constructor({ ref }: { ref: WebKeeper }) {
        this.ref = ref;
    }

    async isReady() {
        try {
            await this.ref.lib.login();
            return true;
        } catch (err) {
            return false;
        }
    }

    async transfer(address: string, amount: string | number, assetId: string) {
        const { transfer } = this.ref.lib;

        await transfer({
            amount,
            assetId,
            recipient: address,
        }).broadcast();
    }
}

export default WebKeeperService;
