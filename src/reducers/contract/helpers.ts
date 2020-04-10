
// roi = 100*(b - w*cp)/(w*cp)
export const computeROI = (bondsAmount: number, wavesAmount: number, currentPrice: number) =>
    (100 * (bondsAmount - wavesAmount * (currentPrice / 100))) / (wavesAmount * (currentPrice / 100));

// b = ((roi/100) + 1)*(w*cp)
export const computeBondsAmountFromROI = (roi: number, wavesAmount: number, currentPrice: number) => (
    ((roi / 100) + 1) * (wavesAmount * currentPrice)
)

// w = (b/((roi/100) + 1))/cp
export const computeWavesAmountFromROI = (roi: number, bondsAmount: number, currentPrice: number) => (
    (bondsAmount / ((roi / 100) + 1)) / currentPrice
)