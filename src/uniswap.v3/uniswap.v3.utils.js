
const BigNumber = require('bignumber.js');
const { fnName } = require('../utils/utils');
const fs = require('fs');
const path = require('path');

const CONSTANT_1e18 = new BigNumber(10).pow(18);
const CONSTANT_TARGET_SLIPPAGE = 20;

/**
 * Calculate the price of token0 vs token1.
 * @param {number} currentTick 
 * @param {number} token0Decimals 
 * @param {number} token1Decimals 
 * @returns {number} the price of token0. which mean how much token1 can 1 token0 buy. 1/this result gives the price of token1 vs token0
 */
function getPriceNormalized(currentTick, token0Decimals, token1Decimals) {
    const token0DecimalFactor = 10 ** token0Decimals;
    const token1DecimalFactor = 10 ** token1Decimals;
    const price = getTickPrice(currentTick);
    const priceToken0VsToken1 = price * token0DecimalFactor / token1DecimalFactor;
    return priceToken0VsToken1;
}

function getTickPrice(tick) {
    return 1.0001 ** tick;
}

function getTickForPrice(price) {
    // price = 1.0001 ^ tick
    // tick = ln(price) / ln(1.0001)
    return Math.log(price) / Math.log(1.0001);
}

/**
 * Get the next lower tick as the current tick returned can sometimes not be in the valid range
 * @param {number} currentTick 
 * @param {number} tickSpacing 
 * @returns {number} Valid tick
 */
function getNextLowerTick(currentTick, tickSpacing) {
    return (Math.floor(currentTick / tickSpacing)) * tickSpacing;
}

function getSlippages(currentTick, tickSpacing, sqrtPriceX96, liquidity, token0Decimals, token1Decimals) {
    const token0Slippage = GetXAmountForSlippages(currentTick, tickSpacing, liquidity, token0Decimals, sqrtPriceX96);
    const token1Slippage =  GetYAmountForSlippages(currentTick, tickSpacing, liquidity, token1Decimals, sqrtPriceX96);

    return {token0Slippage, token1Slippage};
}



/**
 * Returns the amount available for X (token0) in a slippageMap from 50 bps to 2000 bps slippage
 * When possible, the notation are the same as https://atiselsts.github.io/pdfs/uniswap-v3-liquidity-math.pdf
 * @param {number} currentTick 
 * @param {number} tickSpacing 
 * @param {{[tick: number]: number}} liquidities 
 * @param {number} tokenDecimals 
 * @param {string} sqrtPriceX96 
 * @returns {[slippageBps: number]: number}
 */
function GetXAmountForSlippages(currentTick, tickSpacing, liquidities, tokenDecimals, sqrtPriceX96) {
    const result = {};
    const _96bits = new BigNumber(2).pow(new BigNumber(96));
    const sqrtP = new BigNumber(sqrtPriceX96).div(_96bits); 
    const P = sqrtP.times(sqrtP).toNumber();
    const decimalFactor = new BigNumber(10).pow(tokenDecimals);

    let workingTick = getNextLowerTick(currentTick, tickSpacing);
    let totalX = 0;

    // store tick [tickNumber]: slippageBps
    const relevantTicks = {};
    for(let slippageBps = 50; slippageBps <= CONSTANT_TARGET_SLIPPAGE * 100; slippageBps += 50) {
        const targetPrice = P * (10000 + slippageBps)/10000;
        const targetPriceTick = getTickForPrice(targetPrice);
        const spacingTargetPriceTick = getNextLowerTick(targetPriceTick, tickSpacing);
        if(!relevantTicks[spacingTargetPriceTick] && spacingTargetPriceTick > workingTick ) {
            relevantTicks[spacingTargetPriceTick] = slippageBps;
        }
    }

    const maxTarget = Math.max(...Object.keys(relevantTicks).map(_ => Number(_)));
    while(workingTick <= maxTarget) {
        const L = new BigNumber(liquidities[workingTick]).times(CONSTANT_1e18);

        if(!L.isNaN()) {
            // pa = lower bound price range
            const lowerBoundTick = getNextLowerTick(workingTick, tickSpacing);
            const pa = getTickPrice(lowerBoundTick);
            const sqrtPa = Math.sqrt(pa);
            // pb = upper bound price range
            const upperBoundTick = lowerBoundTick + tickSpacing;
            const pb = getTickPrice(upperBoundTick);
            const sqrtPb = Math.sqrt(pb);
            let xLiquidityInTick = 0;

            // Assuming P ≤ pa, the position is fully in X, so y = 0
            if(P <= pa) {
                const x = L.times(sqrtPb - sqrtPa).div(sqrtPa * sqrtPb);
                xLiquidityInTick = x.div(decimalFactor).toNumber();
            } 
            // Assuming P ≥ pb, the position is fully in Y , so x = 0:
            else if(P >= pb) {
                // We want X so don't care for this case
            } 
            // If the current price is in the range: pa < P < pb. mix of x and y
            else {
                const x = L.times(sqrtPb - sqrtP).div(sqrtP * sqrtPb);
                xLiquidityInTick = x.div(decimalFactor).toNumber();
            }

            totalX += xLiquidityInTick;
            if(relevantTicks[workingTick]) {
                result[relevantTicks[workingTick]] = totalX;
            }
        }
        
        workingTick += tickSpacing;
    }

    return result;
}

/**
 * Returns the amount available for X (token0) in a slippageMap from 50 bps to 2000 bps slippage
 * When possible, the notation are the same as https://atiselsts.github.io/pdfs/uniswap-v3-liquidity-math.pdf
 * @param {number} currentTick 
 * @param {number} tickSpacing 
 * @param {{[tick: number]: number}} liquidities 
 * @param {number} tokenDecimals 
 * @param {string} sqrtPriceX96 
 * @returns {[slippageBps: number]: number}
 */
function GetYAmountForSlippages(currentTick, tickSpacing, liquidities, tokenDecimals, sqrtPriceX96) {
    const result = {};
    const _96bits = new BigNumber(2).pow(new BigNumber(96));
    const sqrtP = new BigNumber(sqrtPriceX96).div(_96bits);
    const P = sqrtP.times(sqrtP).toNumber();
    const decimalFactor = new BigNumber(10).pow(tokenDecimals);

    let workingTick = getNextLowerTick(currentTick, tickSpacing);
    
    // store tick [tickNumber]: slippageBps
    const relevantTicks = {};
    for(let slippageBps = 50; slippageBps <= CONSTANT_TARGET_SLIPPAGE * 100; slippageBps += 50) {
        const targetPrice = P * (10000 - slippageBps)/10000;
        const targetPriceTick = getTickForPrice(targetPrice);
        const spacingTargetPriceTick = getNextLowerTick(targetPriceTick, tickSpacing);
        if(!relevantTicks[spacingTargetPriceTick] && spacingTargetPriceTick < workingTick ) {
            relevantTicks[spacingTargetPriceTick] = slippageBps;
        }
    }
    
    const minTarget = Math.min(...Object.keys(relevantTicks).map(_ => Number(_)));

    let totalY = 0;
    while(workingTick >= minTarget) {
        const L = new BigNumber(liquidities[workingTick]).times(CONSTANT_1e18);
        if(!L.isNaN()) {
            // pa = lower bound price range
            const lowerBoundTick = getNextLowerTick(workingTick, tickSpacing);
            const pa = getTickPrice(lowerBoundTick);
            const sqrtPa = Math.sqrt(pa);
            // pb = upper bound price range
            const upperBoundTick = lowerBoundTick + tickSpacing;
            const pb = getTickPrice(upperBoundTick);
            const sqrtPb = Math.sqrt(pb);
            let yLiquidityInTick = 0;

            // Assuming P ≤ pa, the position is fully in X, so y = 0
            if(P <= pa) {
            // We want X so don't care for this case
            } 
            // Assuming P ≥ pb, the position is fully in Y , so x = 0:
            else if(P >= pb) {
                const y = L.times(sqrtPb - sqrtPa);
                yLiquidityInTick = y.div(decimalFactor).toNumber();
            } 
            // If the current price is in the range: pa < P < pb. mix of x and y
            else {
                const y = L.times(sqrtP - sqrtPa);
                yLiquidityInTick = y.div(decimalFactor).toNumber();
            }

            totalY += yLiquidityInTick;
            if(relevantTicks[workingTick]) {
                result[relevantTicks[workingTick]] = totalY;
            }
        }

        workingTick -= tickSpacing;
    }

    return result;
}

function getAvailableUniswapV3(dataDir) {
    const available = {};
    const files = fs.readdirSync(`${dataDir}/uniswapv3/`).filter(_ => _.endsWith('.csv'));
    for(const file of files) {
        const splitted = file.split('-');

        const tokenA = splitted[0];
        const tokenB = splitted[1];
        if(!available[tokenA]) {
            available[tokenA] = [];
        }
        if(!available[tokenB]) {
            available[tokenB] = [];
        }

        if(!available[tokenA].includes(tokenB)) {
            available[tokenA].push(tokenB);
        }

        if(!available[tokenB].includes(tokenA)) {
            available[tokenB].push(tokenA);
        }
    }

    return available;
}

function getUniV3DataFiles(dataDir, fromSymbol, toSymbol) {
    
    const allUniv3Files = fs.readdirSync(path.join(dataDir, 'uniswapv3')).filter(_ => _.endsWith('.csv'));
    
    let searchKey = `${fromSymbol}-${toSymbol}`;
    let reverse = false;
    let selectedFiles = allUniv3Files.filter(_ => _.startsWith(searchKey));
    if(selectedFiles.length == 0) {
        let searchKey = `${toSymbol}-${fromSymbol}`;
        reverse = true;
        selectedFiles = allUniv3Files.filter(_ => _.startsWith(searchKey));

    }

    return {selectedFiles, reverse};
}

/**
 * 
 * @param {string} dataDir 
 * @param {string} fromSymbol 
 * @param {string} toSymbol 
 * @param {number[]} blockRange 
 * @returns {{[targetBlock: number]: {blockNumber: number, price: number, slippageMap: {[slippagePct: number]: number}}}}
 */
function getUniV3DataforBlockInterval(dataDir, fromSymbol, toSymbol, sinceBlock, toBlock) {
    console.log(`${fnName()}: Searching for ${fromSymbol}/${toSymbol} since ${sinceBlock} to ${toBlock}`);
    
    const results = {};

    const {selectedFiles, reverse} = getUniV3DataFiles(dataDir, fromSymbol, toSymbol);

    if(selectedFiles.length == 0) {
        console.log(`Could not find univ3 files for ${fromSymbol}/${toSymbol}`);
        return results;
    }

    const dataContents = getUniV3DataContents(selectedFiles, dataDir, sinceBlock);

    // select base file = the file with the most lines
    let baseFile = selectedFiles[0];
    const keys = {};
    keys[baseFile] = Object.keys(dataContents[baseFile]);
    for(let i = 1; i < selectedFiles.length; i++) {
        const selectedFile = selectedFiles[i];
        keys[selectedFile] = Object.keys(dataContents[selectedFile]);
        if(Object.keys(dataContents[baseFile]).length < keys[selectedFile].length) {
            baseFile = selectedFile;
        }
    }

    for(const targetBlock of keys[baseFile]) {
        if(targetBlock > toBlock) {
            break;
        }
        // find the closest value from the basefile and init the result with the data
        const nearestBlockNumbers = keys[baseFile].filter(_ => Number(_) <= targetBlock);
        if(nearestBlockNumbers.length == 0) {
            // if no data, ignore block
            continue;
        }

        const nearestBlockNumber = Number(nearestBlockNumbers.at(-1));
        // console.log(`[${targetBlock}] ${baseFile} nearest block value is ${nearestBlockNumber}. Distance: ${targetBlock-nearestBlockNumber}`);
        results[targetBlock] = {
            blockNumber: nearestBlockNumber,
            price: reverse ? dataContents[baseFile][nearestBlockNumber].p1vs0 : dataContents[baseFile][nearestBlockNumber].p0vs1,
        };

        // clone the data because we need to modify it without modifying the source
        const baseSlippageMap = {};
        const baseFileSlippageMap = dataContents[baseFile][nearestBlockNumber][`${fromSymbol}-slippagemap`];
        let slippageBps = 50;
        while (slippageBps <= CONSTANT_TARGET_SLIPPAGE * 100) {
            let slippageValue = baseFileSlippageMap[slippageBps];
            
            if(!slippageValue) {
                // find the closest value that is < slippageBps
                const sortedAvailableSlippageBps = Object.keys(baseFileSlippageMap).filter(_ => _ < slippageBps).sort((a,b) => b - a);
                if(sortedAvailableSlippageBps.length == 0) {
                    slippageValue = 0;
                } else {
                    slippageValue = baseFileSlippageMap[sortedAvailableSlippageBps[0]];
                } 
            }
            if(slippageValue < 0) {
                slippageValue = 0;
            }
            baseSlippageMap[slippageBps] = slippageValue;
            slippageBps += 50;
        }

        results[targetBlock].slippageMap = baseSlippageMap;

        // do the same for every other data contents, but only summing the slippagemap
        for(const filename of selectedFiles) {
            if(filename == baseFile) {
                continue; // base file already done
            }

            const nearestBlockNumbers = keys[filename].filter(_ => Number(_) <= targetBlock);
            if(nearestBlockNumbers.length == 0) {
                continue; // no available data in source?
            }

            const nearestBlockNumber = nearestBlockNumbers.at(-1);
            // console.log(`[${targetBlock}] ${filename} nearest block value is ${nearestBlockNumber}. Distance: ${targetBlock-nearestBlockNumber}`);
            const slippageMap = dataContents[filename][nearestBlockNumber][`${fromSymbol}-slippagemap`];

            let slippageBps = 50;
            while (slippageBps <= CONSTANT_TARGET_SLIPPAGE * 100) {
                let volumeToAdd = slippageMap[slippageBps];
                if(!volumeToAdd) {
                    // find the closest value that is < slippageBps
                    const sortedAvailableSlippageBps = Object.keys(slippageMap).filter(_ => _ < slippageBps).sort((a,b) => b - a);
                    if(sortedAvailableSlippageBps.length == 0) {
                        volumeToAdd = 0;
                    } else {
                        volumeToAdd = slippageMap[sortedAvailableSlippageBps[0]];
                    }
                } 

                if(volumeToAdd < 0) {
                    volumeToAdd = 0;
                }
                results[targetBlock].slippageMap[slippageBps] += volumeToAdd;
                slippageBps += 50;
            }
        }
    }

    return results;
}

function getUniV3DataContents(selectedFiles, dataDir, minBlock=0) {
    const dataContents = {};
    for (let i = 0; i < selectedFiles.length; i++) {
        const selectedFile = selectedFiles[i];
        dataContents[selectedFiles[i]] = {};
        const fileContent = fs.readFileSync(path.join(dataDir, 'uniswapv3', selectedFile), 'utf-8').split('\n')
            // remove first line, which is headers
            .splice(1);

        // remove last line, which is empty
        fileContent.pop();

        let lastLine = fileContent[0];
        for (let j = 1; j < fileContent.length; j++) {
            const blockNumber = Number(fileContent[j].split(',')[0]);
            if(blockNumber < minBlock) {
                lastLine = fileContent[j];
                continue;
            }

            // when breaching the minblock, save the last line
            if(blockNumber > minBlock && lastLine) {
                const lastLineBlockNumber = Number(lastLine.split(',')[0]);
                const lastLineJsonStr = lastLine.replace(`${lastLineBlockNumber},`, '');
                const lastLineParsed = JSON.parse(lastLineJsonStr);
                dataContents[selectedFile][lastLineBlockNumber] = lastLineParsed;
                lastLine = null;
            }

            const jsonStr = fileContent[j].replace(`${blockNumber},`, '');
            const parsed = JSON.parse(jsonStr);
            dataContents[selectedFile][blockNumber] = parsed;
        }

        // if lastline is still instancied, it means we never breached the minBlock and that the
        // datacontent for the file is empty
        // in that case, just save the last line as the only point
        if(lastLine && Object.keys(dataContents[selectedFile]) == 0) {
            const lastLineBlockNumber = Number(lastLine.split(',')[0]);
            const lastLineJsonStr = lastLine.replace(`${lastLineBlockNumber},`, '');
            const lastLineParsed = JSON.parse(lastLineJsonStr);
            dataContents[selectedFile][lastLineBlockNumber] = lastLineParsed;
        }
    }
    
    return dataContents;
}

module.exports = { getPriceNormalized, getSlippages, getAvailableUniswapV3, getUniV3DataforBlockInterval };