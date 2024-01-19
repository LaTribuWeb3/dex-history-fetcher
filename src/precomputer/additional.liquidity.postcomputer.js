const { RecordMonitoring } = require('../utils/monitoring');
const { fnName, roundTo, sleep, readLastLine } = require('../utils/utils');

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { additionalLiquidityConfig } = require('./precomputer.config');
const { DATA_DIR } = require('../utils/constants');
const { extractDataFromUnifiedLine } = require('../data.interface/internal/data.interface.utils');
const { getPrices } = require('../data.interface/internal/data.interface.price');
dotenv.config();

const runEverySec = 60 * 60;

const WORKER_NAME = 'Additional Liquidity Computer';

async function AdditionalLiquidityComputer(onlyOnce = false) {
    // eslint-disable-next-line no-constant-condition
    console.log('Starting additional liquidity computer');
    // eslint-disable-next-line no-constant-condition
    while(true) {
        const start = Date.now();
        try {
            await RecordMonitoring({
                'name': WORKER_NAME,
                'status': 'running',
                'lastStart': Math.round(start/1000),
                'runEvery': runEverySec
            });

            // get config to know what tokens to transform
            for(const platform of Object.keys(additionalLiquidityConfig)) {
                const platformConfig = additionalLiquidityConfig[platform];
                console.log(`working on ${platform}`, {platformConfig});

                for(const onePlatformConfig of platformConfig) {
                    const itemsToTransform = getFilesForPlatform(onePlatformConfig.from, onePlatformConfig.pivot, platform);
                    console.log(`Working on ${itemsToTransform.length} files: ${itemsToTransform.map(_ => _.filename).join(',')}`);

                    for(const itemToTransform of itemsToTransform) {
                        await transformLiquidityDataForFilename(platform, onePlatformConfig, itemToTransform);
                    }
                }
            }

            const runEndDate = Math.round(Date.now()/1000);
            await RecordMonitoring({
                'name': WORKER_NAME,
                'status': 'success',
                'lastEnd': runEndDate,
                'lastDuration': runEndDate - Math.round(start/1000),
            });
        } catch(error) {
            const errorMsg = `An exception occurred: ${error}`;
            console.log(errorMsg);
            await RecordMonitoring({
                'name': WORKER_NAME,
                'status': 'error',
                'error': errorMsg
            });
        }

        if(onlyOnce) {
            return;
        }
        const sleepTime = runEverySec * 1000 - (Date.now() - start);
        if(sleepTime > 0) {
            console.log(`${fnName()}: sleeping ${roundTo(sleepTime/1000/60)} minutes`);
            await sleep(sleepTime);
        }
    }
}

function getFilesForPlatform(from, to, platform) {
    const filenamesToTransform = [];
    const filenames = fs.readdirSync(path.join(DATA_DIR, 'precomputed', platform)).filter(_ => _.endsWith('unified-data.csv'));
    for(const filename of filenames) {
        const base = filename.split('-')[0];
        const quote = filename.split('-')[1];

        if(base == from && quote == to) {
            filenamesToTransform.push({filename, reversed: false, base, quote});
        }

        if(base == to && quote == from) {
            filenamesToTransform.push({filename, reversed: true, base, quote});
        }
    }

    return filenamesToTransform;
}

async function transformLiquidityDataForFilename(platform, config, itemToTransform) {
    console.log(`Working on ${platform} for file ${itemToTransform.filename}`);

    const precomputedInputDataFullFilePath = path.join(DATA_DIR, 'precomputed', platform, itemToTransform.filename);

    // stETH-WETH-stETHngPool-unified-data.csv
    const targetFileName = itemToTransform.filename.replace(config.from, config.to);
    const precomputedOutputDataFullFilePath = path.join(DATA_DIR, 'precomputed', platform, targetFileName);

    const preComputedData = getDataFromFile(precomputedInputDataFullFilePath);
    const prices = getPrices(config.priceSource, config.priceFrom, config.priceTo);

    const reverse = config.from == itemToTransform.quote;
    const linesToWrite = [];
    let startIndex = 0;

    if (!fs.existsSync(precomputedOutputDataFullFilePath)) {
        linesToWrite.push('blocknumber,price,slippagemap\n');
    } else {
        startIndex = await getStartIndexFromExistingOuptput(preComputedData, precomputedOutputDataFullFilePath);
        console.log('Found existing file ' + targetFileName + ' to store additional liquidities. Will start from line ' + startIndex);
    }

    for (let i = startIndex; i < preComputedData.length - 1; i++) {
        const lineToTransform = preComputedData[i];
        const unifiedData = extractDataFromUnifiedLine(lineToTransform);
        const closestPrice = getClosestPrice(prices, unifiedData.blockNumber);
        if(!closestPrice) {
            continue;
        }

        const targetUnifiedData = structuredClone(unifiedData);
        targetUnifiedData.price = reverse ? unifiedData.price/closestPrice : unifiedData.price * closestPrice;
        for(const slippageBps of Object.keys(targetUnifiedData.slippageMap)) {
            if(reverse) {
                targetUnifiedData.slippageMap[slippageBps].quote /= closestPrice;
            } else {
                targetUnifiedData.slippageMap[slippageBps].base /= closestPrice;
            }
        }

        const lineToWrite = `${targetUnifiedData.blockNumber},${targetUnifiedData.price},${JSON.stringify(targetUnifiedData.slippageMap)}\n`;
        linesToWrite.push(lineToWrite);
    }

    if(linesToWrite.length >= 0) {
        fs.appendFileSync(precomputedOutputDataFullFilePath, linesToWrite.join(''));
    }
}

// Written by ChatGPT
function binarySearchFirstLineIndexStartingWith(target, fileContent) {
    let left = 0;
    let right = fileContent.length - 1;
    let result = -1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const currentLine = fileContent[mid];

        if (currentLine.startsWith(target)) {
            // Found a line that starts with the target string
            result = mid;
            right = mid - 1; // Continue searching to the left
        } else if (currentLine < target) {
            // Target is in the right half of the remaining lines
            left = mid + 1;
        } else {
            // Target is in the left half of the remaining lines
            right = mid - 1;
        }
    }

    return result;
}

async function getStartIndexFromExistingOuptput(preComputedData, outputFile) {
    const lastOutputLine = await readLastLine(outputFile);
    const lastComputedBlock = lastOutputLine.split(',')[0];
    // We add one because the file starts with the header line and the pre computed data does
    // not contain it.
    return binarySearchFirstLineIndexStartingWith(lastComputedBlock, preComputedData) + 1;
}

function getDataFromFile(fullfilename) {
    return fs.readFileSync(fullfilename, 'utf-8').split('\n').slice(1);
}

function getClosestPrice(prices, blocknumber) {
    // Filter out blocks with blocknumber greater than the input
    const eligiblePrices = prices.filter(item => item.block <= blocknumber);

    // If no eligible prices, return null or a default value
    if (!eligiblePrices.length) {
        return undefined;
    } 

    // Sort the eligible prices by the closest blocknumber
    eligiblePrices.sort((a, b) => b.block - a.block);

    // Return the price of the closest blocknumber
    return eligiblePrices[0].price;
}

// AdditionalLiquidityComputer(true);
module.exports = { AdditionalLiquidityComputer };