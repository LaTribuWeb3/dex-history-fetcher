const fs = require('fs');
const { getSlippages } = require('./src/uniswap.v3/uniswap.v3.utils.js');
const { processEvents } = require('./src/uniswap.v3/uniswap.v3.history.fetcher.js');
const { default: BigNumber } = require('bignumber.js');
const { ethers, Contract } = require('ethers');
const univ3Config = require('./src/uniswap.v3/uniswap.v3.config');

// Read the latestdata.json file
fs.readFile('latestdata.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    try {
        // Parse the JSON data
        const latestData = JSON.parse(data);

        const slippage_test = false;

        if (slippage_test) {
            // Call the getSlippages function with the parsed data
            const slippages = getSlippages(
                latestData.currentTick,
                latestData.tickSpacing,
                latestData.currentSqrtPriceX96.toString(),
                latestData.ticks,
                18, // Assuming token0.decimals is always equal to 18
                18 // Assuming token1.decimals is always equal to 18
            );

            // Write the output to a file
            fs.writeFile('slippages_output.json', JSON.stringify(slippages, null, 2), (err) => {
                if (err) {
                    console.error('Error writing file:', err);
                    return;
                }
                console.log('Output written to slippages_output.json');
            });
        } else {
            fs.readFile('latestDataLiquidityUpdates.json', 'utf8', (err, rawEvents) => {
                let events = JSON.parse(rawEvents);

                let iface = new ethers.utils.Interface(univ3Config.uniswapV3PairAbi);

                let token0 = {
                    decimals: 18,
                    address: "0xae78736Cd615f374D3085123A210448E74Fc6393",
                    dustAmount: 0.0001,
                    symbol: "rETH",
                };

                let token1 = {
                    decimals: 18,
                    address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
                    dustAmount: 0.0001,
                    symbol: "WETH",
                };

                processEvents(events, iface, latestData, token0, token1, "lastdatacomputation.json", "datacomputation.json", 16668466);
            });

            // updateLatestDataLiquidity(latestData, 17853406, 760, 770, new BigNumber('1327971805933120100761600'));
        }
    } catch (error) {
        console.error('Error parsing JSON:', error);
    }
});