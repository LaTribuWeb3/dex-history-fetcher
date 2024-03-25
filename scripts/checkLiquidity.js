const { getLiquidity, getLiquidityAll } = require('../src/data.interface/data.interface');
const { watchedPairs } = require('../src/global.config');
const { PLATFORMS, BLOCK_PER_DAY } = require('../src/utils/constants');
const fs = require('fs');
const { roundTo } = require('../src/utils/utils');

async function checkLiquidity() {

    const base = 'wstETH';
    const quote = 'USDC';

    const atBlock = 19461360- BLOCK_PER_DAY * 15;
    // const atBlock = 19461360;
    const newLiquidity = getLiquidityAll(base, quote, atBlock, atBlock);
    console.log(`${base}/${quote} TOTAL 5% SLIPPAGE: ${newLiquidity[atBlock].slippageMap[500].base} ${base}`);


    // fs.writeFileSync('liquidityresult.csv', 'base,quote,liquidity\n');
    // computePairLiquidity('rETH', 'WETH');
    
}

checkLiquidity();

function computePairLiquidity(base, quote) {
    const newLiquidity = getLiquidityAll(base, quote, 19405598, 19405598);
    const newLqty = newLiquidity[19405598].slippageMap[500].base;
    console.log(`${base}/${quote} new liquidity: ${newLqty}`);
    const line = `${base},${quote},${newLqty}`;
    console.log(line);
    fs.appendFileSync('liquidityresult.csv', line + '\n');
}
