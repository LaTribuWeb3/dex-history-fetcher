const fs = require('fs');
const { normalize, getConfTokenBySymbol } = require('../utils/token.utils');
const { getAvailableUniswapV2, getUniV2DataforBlockRange, computeLiquidityUniV2Pool, computeUniswapV2Price } = require('../uniswap.v2/uniswap.v2.utils');
const { pairsToCompute } = require('./precomputer.config');
const { fnName, logFnDuration } = require('../utils/utils');
const path = require('path');


const DATA_DIR = process.cwd() + '/data';

/**
 * Compute slippage data for a blockrange and target slippage array
 * @param {number[]} blockRange 
 * @param {number[]} targetSlippages
 */
async function precomputeCurveData(blockRange, targetSlippages, daysToFetch) {
    console.log(`${fnName()}: Starting CURVE Precomputer for days to fetch: ${daysToFetch}`);
    console.log(`${fnName()}: Ending CURVE Precomputer for days to fetch: ${daysToFetch}`);
    
}
module.exports = { precomputeCurveData };