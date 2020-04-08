import { IOrder } from 'routes/BondsDashboard/types';

export enum OrderUrgency {
    BY_REQUEST = 0,
    INSTANT,
}
export enum FormDefaults {
    WAVES_AMOUNT = 1000,
    NSBT_AMOUNT = 1000,
    USDN_AMOUNT = 1000,
}
export interface Props {
    bondOrders: Record<string, string>[] | IOrder[];
    controlPrice: number;
    baseCurrency: string;
    quoteCurrency: string;
    // pairName: string;
    roi: number; // like wavelets
}
export type InputForm = { send: number; receive: number; price: number; };
export type State = {
    orderUrgency: OrderUrgency;
    buy: InputForm;
    liquidate: InputForm;
};