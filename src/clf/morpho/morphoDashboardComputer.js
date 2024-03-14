const { ethers } = require('ethers');
const dotenv = require('dotenv');
const path = require('path');
const { fnName, getDay, roundTo, retry } = require('../../utils/utils');
const fs = require('fs');
const { default: axios } = require('axios');
dotenv.config();
const { getBlocknumberForTimestamp } = require('../../utils/web3.utils');
const { normalize, getConfTokenBySymbol, getTokenSymbolByAddress } = require('../../utils/token.utils');
const { config, morphoBlueAbi, metamorphoAbi } = require('./morphoFlagshipComputer.config');
const { RecordMonitoring } = require('../../utils/monitoring');
const { DATA_DIR } = require('../../utils/constants');
const { getRollingVolatility, getLiquidityAll } = require('../../data.interface/data.interface');
const spans = [30];

morphoDashboardSummaryComputer(60);
/**
 * Compute the Summary values for Morpho
 * @param {number} fetchEveryMinutes 
 */
async function morphoDashboardSummaryComputer(fetchEveryMinutes, startDate = Date.now()) {
    const MONITORING_NAME = 'Morpho Flagship Dashboard Summary Computer';
    const start = Date.now();
    try {
        await RecordMonitoring({
            'name': MONITORING_NAME,
            'status': 'running',
            'lastStart': Math.round(start / 1000),
            'runEvery': fetchEveryMinutes * 60
        });
        if (!process.env.RPC_URL) {
            throw new Error('Could not find RPC_URL env variable');
        }

        console.log(new Date(startDate));

        if (!fs.existsSync(path.join(DATA_DIR, 'clf'))) {
            fs.mkdirSync(path.join(DATA_DIR, 'clf'));
        }

        console.log(`${fnName()}: starting`);
        const web3Provider = new ethers.providers.StaticJsonRpcProvider(process.env.RPC_URL);
        const fromBlock = await getBlocknumberForTimestamp(Math.round(startDate / 1000) - (30 * 24 * 60 * 60));
        const currentBlock = await getBlocknumberForTimestamp(Math.round(startDate / 1000));

        const results = {};
        const startDateUnixSecond = Math.round(startDate / 1000);

        /// for all vaults in morpho config
        for (const vault of Object.values(config.vaults)) {
            const clfValue = await computeCLFForVault(config.blueAddress, vault.address, vault.name, vault.baseAsset, web3Provider, fromBlock, currentBlock, startDateUnixSecond);
            if (clfValue) {
                results[vault.baseAsset] = clfValue;
                console.log(`results[${vault.baseAsset}]`, results[vault.baseAsset]);
            } else {
                console.log(`not data for vault ${vault.name}`);
            }
        }

        const sortedData = sortData(results);

        console.log('firing record function');
        recordResults(sortedData, startDate);

        console.log('Morpho Dashboard Summary Computer: ending');

        const runEndDate = Math.round(Date.now() / 1000);
        await RecordMonitoring({
            'name': MONITORING_NAME,
            'status': 'success',
            'lastEnd': runEndDate,
            'lastDuration': runEndDate - Math.round(start / 1000),
            'lastBlockFetched': currentBlock
        });
    } catch (error) {
        const errorMsg = `An exception occurred: ${error}`;
        console.error(errorMsg);
        await RecordMonitoring({
            'name': MONITORING_NAME,
            'status': 'error',
            'error': errorMsg
        });
    }
}

/**
 * Compute CLF value for a vault
 * @param {string} cometAddress 
 * @param {string} baseAsset 
 * @param {{index: number, symbol: string, address: string, coinGeckoID: string}[]} collaterals 
 * @param {ethers.providers.StaticJsonRpcProvider} web3Provider 
 * @param {number} fromBlock 
 * @param {number} endBlock 
 * @returns {Promise<{collateralsData: {[collateralSymbol: string]: {collateral: {inKindSupply: number, usdSupply: number}, clfs: {7: {volatility: number, liquidity: number}, 30: {volatility: number, liquidity: number}, 180: {volatility: number, liquidity: number}}}}>}
 */
async function computeCLFForVault(blueAddress, vaultAddress, vaultName, baseAsset, web3Provider, fromBlock, endBlock, startDateUnixSec) {
    const resultsData = {
        collateralsData: {}
    };

    console.log(`Started work on Morpho flagship --- ${baseAsset} --- vault`);
    const morphoBlue = new ethers.Contract(blueAddress, morphoBlueAbi, web3Provider);
    const metamorphoVault = new ethers.Contract(vaultAddress, metamorphoAbi, web3Provider);

    // find the vault markets
    const marketIds = await getVaultMarkets(metamorphoVault, endBlock);

    if (marketIds.length == 0) {
        return undefined;
    }

    const baseToken = getConfTokenBySymbol(baseAsset);

    // compute clf for all markets with a collateral
    for (const marketId of marketIds) {
        const marketParams = await morphoBlue.idToMarketParams(marketId, { blockTag: endBlock });
        if (marketParams.collateralToken != ethers.constants.AddressZero) {
            const collateralTokenSymbol = getTokenSymbolByAddress(marketParams.collateralToken);
            const uniqueId = `${collateralTokenSymbol}_${marketId}`;
            console.log(`market collateral is ${collateralTokenSymbol}`);
            const collateralToken = getConfTokenBySymbol(collateralTokenSymbol);
            const marketConfig = await metamorphoVault.config(marketId, { blockTag: endBlock });
            const blueMarket = await morphoBlue.market(marketId, { blockTag: endBlock });
            // assetParameters { liquidationBonusBPS: 1200, supplyCap: 900000, LTV: 70 }
            const LTV = normalize(marketParams.lltv, 18) * 100;
            const liquidationBonusBPS = getLiquidationBonusForLtv(LTV / 100);
            // max(config cap from metamorpho vault, current market supply)
            const configCap = normalize(marketConfig.cap, baseToken.decimals);
            const currentSupply = normalize(blueMarket.totalSupplyAssets, baseToken.decimals);
            const supplyCap = Math.max(configCap, currentSupply);
            const assetParameters = {
                liquidationBonusBPS,
                supplyCap,
                LTV
            };

            resultsData.collateralsData[uniqueId] = {};
            // collateral data { inKindSupply: 899999.9260625947, usdSupply: 45764996.240282945 }
            const basePrice = await getHistoricalPrice(baseToken.address, startDateUnixSec);
            resultsData.collateralsData[uniqueId].collateral = {
                inKindSupply: currentSupply,
                usdSupply: currentSupply * basePrice
            };

            const resultsAndParameters = await computeMarketCLFBiggestDailyChange(marketId, assetParameters, collateralToken.symbol, baseAsset, fromBlock, endBlock, startDateUnixSec, web3Provider, vaultName);
            resultsData.collateralsData[uniqueId].clfs = resultsAndParameters.results;
            resultsData.collateralsData[uniqueId]['marketParameters'] = resultsAndParameters.parameters;
            resultsData.collateralsData[uniqueId].assetParameters = resultsAndParameters.assetParameters;
        }
    }

    return resultsData;
}

function getLiquidationBonusForLtv(ltv) {
    switch (ltv) {
        default:
            throw new Error(`No liquidation bonus for ltv ${ltv}`);
        case 0.98:
            return 50;
        case 0.965:
            return 100;
        case 0.945:
            return 150;
        case 0.915:
            return 250;
        case 0.86:
            return 400;
        case 0.77:
            return 700;
        case 0.625:
            return 1250;
    }
}

async function getVaultMarkets(vault, currentBlock) {
    try {
        const marketIds = [];
        const withdrawQueueLengthBn = await vault.withdrawQueueLength({ blockTag: currentBlock });
        const vaultQueueLength = Number(withdrawQueueLengthBn.toString());
        for (let i = 0; i < vaultQueueLength; i++) {
            const marketId = await vault.withdrawQueue(i, { blockTag: currentBlock });
            marketIds.push(marketId);
        }

        return marketIds;
    } catch (e) {
        console.warn(e);
        return [];
    }
}

async function getHistoricalPrice(tokenAddress, dateUnixSec) {
    const apiUrl = `https://coins.llama.fi/prices/historical/${dateUnixSec}/ethereum:${tokenAddress}?searchWidth=12h`;
    const historicalPriceResponse = await retry(axios.get, [apiUrl], 0, 100);
    return historicalPriceResponse.data.coins[`ethereum:${tokenAddress}`].price;
}

function findRiskLevelFromParameters(volatility, liquidity, liquidationBonus, ltv, borrowCap) {
    const sigma = volatility;
    const d = borrowCap;
    const beta = liquidationBonus;
    const l = liquidity;
    ltv = Number(ltv) / 100;

    const sigmaTimesSqrtOfD = sigma * Math.sqrt(d);
    const ltvPlusBeta = ltv + beta;
    const lnOneDividedByLtvPlusBeta = Math.log(1 / ltvPlusBeta);
    const lnOneDividedByLtvPlusBetaTimesSqrtOfL = lnOneDividedByLtvPlusBeta * Math.sqrt(l);
    const r = sigmaTimesSqrtOfD / lnOneDividedByLtvPlusBetaTimesSqrtOfL;

    return r;
}

/**
 * 
 * @param {{collateralsData: {[collateralSymbol: string]: {collateral: {inKindSupply: number, usdSupply: number}, clfs: {7: {volatility: number, liquidity: number}, 30: {volatility: number, liquidity: number}, 180: {volatility: number, liquidity: number}}}}} poolData 
 * @returns 
 */

/**
 * 
 * @param {{[baseAsset: string]: {totalCollateral: number, weightedCLF: number}}} protocolData 
 * @returns 
 */

function recordResults(results) {
    if (!fs.existsSync(`${DATA_DIR}/precomputed/morpho-dashboard/`)) {
        fs.mkdirSync(`${DATA_DIR}/precomputed/morpho-dashboard/`, { recursive: true });
    }
    const summaryFilePath = path.join(DATA_DIR, 'precomputed/morpho-dashboard/morpho-summary.json');
    const objectToWrite = JSON.stringify(results, null, 2);
    console.log('recording results');
    try {
        fs.writeFileSync(summaryFilePath, objectToWrite, 'utf8');
    }
    catch (error) {
        console.error(error);
        console.log('Morpho Computer failed to write files');
    }
}


/**
 * 
 * @param {{liquidationBonusBPS: number, supplyCap: number, LTV: number}} assetParameters 
 * @param {{index: number, symbol: string, volatilityPivot: string, address: string, coinGeckoID: string}} collateral 
 * @param {string} baseAsset 
 * @param {{[span: number]: number}]} fromBlocks 
 * @param {number} endBlock 
 * @returns {Promise<{7: {volatility: number, liquidity: number}, 30: {volatility: number, liquidity: number}, 180: {volatility: number, liquidity: number}}>}
 */
async function computeMarketCLFBiggestDailyChange(marketId, assetParameters, collateralSymbol, baseAsset, fromBlock, endBlock, startDateUnixSec, web3Provider, vaultname) {
    const startDate = new Date(startDateUnixSec * 1000);
    const from = collateralSymbol;

    const parameters = {};

    // for each platform, compute the volatility and the avg liquidity
    // only request one data (the biggest span) and recompute the avg for each spans
    const rollingVolatility = await getRollingVolatility('all', from, baseAsset, web3Provider);
    const volatilityAtBlock = rollingVolatility.history.filter(_ => _.blockStart <= endBlock && _.blockEnd >= endBlock)[0];

    let volatility = 0;
    if (volatilityAtBlock) {
        volatility = volatilityAtBlock.current;
    } else if (rollingVolatility.latest && rollingVolatility.latest.current) {
        volatility = rollingVolatility.latest.current;
    }
    else {
        throw new Error('CANNOT FIND VOLATILITY');
    }

    console.log(`[${from}-${baseAsset}] volatility: ${roundTo(volatility * 100)}%`);

    for (const span of spans) {
        parameters[span] = {
            volatility,
            liquidity: 0,
        };
    }


    const oldestBlock = fromBlock;
    const fullLiquidity = getLiquidityAll(from, baseAsset, oldestBlock, endBlock);
    const allBlockNumbers = Object.keys(fullLiquidity).map(_ => Number(_));


    const blockNumberForSpan = allBlockNumbers.filter(_ => _ >= fromBlock);

    let liquidityToAdd = 0;
    if (blockNumberForSpan.length > 0) {
        let sumLiquidityForTargetSlippageBps = 0;
        for (const blockNumber of blockNumberForSpan) {
            sumLiquidityForTargetSlippageBps += fullLiquidity[blockNumber].slippageMap[assetParameters.liquidationBonusBPS].quote;
        }

        liquidityToAdd = sumLiquidityForTargetSlippageBps / blockNumberForSpan.length;
    }

    parameters['30'].liquidity += liquidityToAdd;
    console.log(`[${from}-${baseAsset}] [30d] all dexes liquidity: ${liquidityToAdd}`);

    console.log('parameters', parameters);


    const results = {};
    for (const volatilitySpan of spans) {
        results[volatilitySpan] = {};
        for (const liquiditySpan of spans) {
            results[volatilitySpan][liquiditySpan] = findRiskLevelFromParameters(parameters[volatilitySpan].volatility, parameters[liquiditySpan].liquidity, assetParameters.liquidationBonusBPS / 10000, assetParameters.LTV, assetParameters.supplyCap);
        }
    }

    console.log('results', results);
    return { results, parameters, assetParameters };
}

function sortData(data) {
    // Initialize the result object to store the transformed data
    const result = {};

    // Iterate over each top-level currency (like "WETH", "USDC", "USDT")
    Object.entries(data).forEach(([currency, { collateralsData }]) => {
        // Initialize an array to store subMarket data for each currency
        let subMarkets = [];
        // Initialize a variable to track the highest riskLevel
        let maxRiskLevel = 0;

        // Process each collateral to calculate riskLevel and other properties
        Object.entries(collateralsData).forEach(([key, collateral]) => {
            const { clfs, marketParameters, assetParameters } = collateral;

            // Assuming riskLevel is derived from `clfs["30"]["30"]`, adjust as necessary
            const riskLevel = clfs['30']['30'];
            // Update maxRiskLevel if this collateral's riskLevel is higher
            maxRiskLevel = Math.max(maxRiskLevel, riskLevel);

            const { volatility, liquidity } = marketParameters['30'];
            const { LTV, liquidationBonusBPS, supplyCap } = assetParameters;

            // Extract the "quote" from the property key
            const quote = key.split('_')[0]; // Splits the key and takes the first part

            // Convert liquidationBonusBPS to a decimal for liquidationBonus
            const liquidationBonus = liquidationBonusBPS / 10000;

            // Construct the subMarket entry and add it to the subMarkets array
            subMarkets.push({
                quote,
                riskLevel,
                LTV: LTV / 100, // Convert LTV to a decimal
                liquidationBonus,
                supplyCapInKind: supplyCap,
                volatility,
                liquidity,
            });
        });

        // Assign the calculated data to the result object, using maxRiskLevel for the currency
        result[currency] = {
            riskLevel: maxRiskLevel,
            subMarkets,
        };
    });

    return result;
}


module.exports = { morphoDashboardSummaryComputer };