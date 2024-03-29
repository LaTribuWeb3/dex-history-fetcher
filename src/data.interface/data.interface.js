////////////////////////////////////////
/////// THIS IS THE DATA INTERFACE /////
// IT ALLOWS EASY ACCESS TO CSV DATA ///
/// IT SHOULD BE THE ONLY THING USED ///
/// TO ACCESS THE DATA GENERATED BY ////
//////////// THE FETCHERS //////////////

const { getPrices } = require('./internal/data.interface.price');
const { getSlippageMapForInterval, getLiquidityAccrossDexes } = require('./internal/data.interface.liquidity');
const { logFnDurationWithLabel } = require('../utils/utils');
const { PLATFORMS, DEFAULT_STEP_BLOCK, LAMBDA } = require('../utils/constants');
const { rollingBiggestDailyChange } = require('../utils/volatility');
const { GetPairToUse } = require('../global.config');


//    _____  _   _  _______  ______  _____   ______        _____  ______     ______  _    _  _   _   _____  _______  _____  ____   _   _   _____ 
//   |_   _|| \ | ||__   __||  ____||  __ \ |  ____|/\    / ____||  ____|   |  ____|| |  | || \ | | / ____||__   __||_   _|/ __ \ | \ | | / ____|
//     | |  |  \| |   | |   | |__   | |__) || |__  /  \  | |     | |__      | |__   | |  | ||  \| || |        | |     | | | |  | ||  \| || (___  
//     | |  | . ` |   | |   |  __|  |  _  / |  __|/ /\ \ | |     |  __|     |  __|  | |  | || . ` || |        | |     | | | |  | || . ` | \___ \ 
//    _| |_ | |\  |   | |   | |____ | | \ \ | |  / ____ \| |____ | |____    | |     | |__| || |\  || |____    | |    _| |_| |__| || |\  | ____) |
//   |_____||_| \_|   |_|   |______||_|  \_\|_| /_/    \_\\_____||______|   |_|      \____/ |_| \_| \_____|   |_|   |_____|\____/ |_| \_||_____/ 
//                                                                                                                                               
// only use these functions when querying csv data :)                                                                                                                                               

/**
 * Get the slippage maps since fromBlock to toBlock
 * Aggregating from each 'platforms' requested and possibly using "jumps"
 * @param {string} fromSymbol base symbol (WETH, USDC...)
 * @param {string} toSymbol quote symbol (WETH, USDC...)
 * @param {number} fromBlock start block of the query (included)
 * @param {number} toBlock endblock of the query (included)
 * @param {string[] | undefined} platforms platforms (univ2, univ3...), default to PLATFORMS
 * @param {bool} withJumps default true. pivot route jump: from UNI to MKR, we will add "additional routes" using UNI->USDC->MKR + UNI->WETH->MKR + UNI->WBTC+MKR
 * @param {number} stepBlock default to 50. The amount of block between each data point
 * @returns {{[blocknumber: number]: {price: number, slippageMap: {[slippageBps: number]: {base: number, quote: number}}}}}
 */
function getLiquidity(platform, fromSymbol, toSymbol, fromBlock, toBlock, withJumps = true, stepBlock = DEFAULT_STEP_BLOCK) {
    const {actualFrom, actualTo} = GetPairToUse(fromSymbol, toSymbol);
    checkPlatform(platform);
    const start = Date.now();
    const liquidity = getSlippageMapForInterval(actualFrom, actualTo, fromBlock, toBlock, platform, withJumps, stepBlock);
    logFnDurationWithLabel(start, `p: ${platform}, [${fromSymbol}/${toSymbol}], blocks: ${(toBlock-fromBlock)}, jumps: ${withJumps}, step: ${stepBlock}`);
    return liquidity;
}

/**
 * Get the aggregated liquidity (using 'jump routes') from all available platforms (dexes)
 * @param {string} fromSymbol 
 * @param {string} toSymbol 
 * @param {number} fromBlock 
 * @param {number} toBlock 
 * @param {number} stepBlock 
 * @returns {{[blocknumber: number]: {price: number, slippageMap: {[slippageBps: number]: {base: number, quote: number}}}}}
 */
function getLiquidityAll(fromSymbol, toSymbol, fromBlock, toBlock, stepBlock = DEFAULT_STEP_BLOCK) {
    const {actualFrom, actualTo} = GetPairToUse(fromSymbol, toSymbol);
    return getLiquidityAccrossDexes(actualFrom, actualTo, fromBlock, toBlock, stepBlock);
}


async function getRollingVolatility(platform, fromSymbol, toSymbol, web3Provider, lambda = LAMBDA) {
    const {actualFrom, actualTo} = GetPairToUse(fromSymbol, toSymbol);
    // find the median file
    const medianPrices = getPrices(platform, actualFrom, actualTo);
    if(!medianPrices) {
        console.warn(`No median prices for ${platform}, ${actualFrom}, ${actualTo}`);
        return undefined;
    }

    return await rollingBiggestDailyChange(medianPrices, web3Provider, lambda);
}

//    _    _  _______  _____  _        _____ 
//   | |  | ||__   __||_   _|| |      / ____|
//   | |  | |   | |     | |  | |     | (___  
//   | |  | |   | |     | |  | |      \___ \ 
//   | |__| |   | |    _| |_ | |____  ____) |
//    \____/    |_|   |_____||______||_____/ 
//                                           
//                                           

/**
 * Check that the platform request is valid
 * @param {string} platform the platform requested (uniswapv2, v3, curve...)
 */
function checkPlatform(platform) {
    if(!PLATFORMS.includes(platform)) {
        throw new Error(`Platform unknown: ${platform}, use one of ${PLATFORMS}`);
    }
}


module.exports = { getLiquidity, getRollingVolatility, getLiquidityAll};