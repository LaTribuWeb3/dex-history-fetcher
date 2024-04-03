const { getLiquidity, getLiquidityAll } = require('../src/data.interface/data.interface');
const { watchedPairs, jumpViaEth } = require('../src/global.config');
const { PLATFORMS } = require('../src/utils/constants');
const fs = require('fs');
const { roundTo } = require('../src/utils/utils');
const { getPrices } = require('../src/data.interface/internal/data.interface.price');

async function checkLiquidity() {

    const block = 19573833; //19539915;
    fs.writeFileSync('liquidity_check.csv', 'platform,base,quote,old liquidity,new liquidity\n');
    // const pairsToFetch = [];
    const pairsToFetch = [{
        base: 'WBTC',
        quote: 'USDC'
    }];
    // for(const base of Object.keys(watchedPairs)) {
    //     for(const item of watchedPairs[base]) {
    //         if(!item.exportToInternalDashboard) {
    //             continue;
    //         }

    //         const quote = item.quote;

    //         pairsToFetch.push({
    //             base,
    //             quote
    //         });
    //         pairsToFetch.push({
    //             base: quote,
    //             quote: base
    //         });
    //     }
    // }
    for(const pairToFetch of pairsToFetch) {
        console.log(`Working on ${pairToFetch.base}/${pairToFetch.quote}`);
        const base = pairToFetch.base;
        const quote = pairToFetch.quote;

        for(const platform of PLATFORMS) {
            const liquidityOld = getLiquidity(platform, base, quote, block, block);
            const liquidityNoJump = getLiquidity(platform, base, quote, block, block, false);
            const liquidityOldVal = liquidityOld ? liquidityOld[block].slippageMap[500].base : 0;
            jumpViaEth.push('wstETH');
            const liquidityNew = getLiquidity(platform, base, quote, block, block);
            const liquidityNewVal = liquidityNew ? liquidityNew[block].slippageMap[500].base : 0;

            fs.appendFileSync('liquidity_check.csv', `${platform},${base},${quote},${liquidityOldVal},${liquidityNewVal}\n`);
            jumpViaEth.pop();
        }

        const liquidityOld = getLiquidityAll(base, quote, block, block);
        const liquidityOldVal = liquidityOld ? liquidityOld[block].slippageMap[500].base : 0;
        jumpViaEth.push('wstETH');
        const liquidityNew = getLiquidityAll(base, quote, block, block);
        const liquidityNewVal = liquidityNew ? liquidityNew[block].slippageMap[500].base : 0;
        fs.appendFileSync('liquidity_check.csv', `all,${base},${quote},${liquidityOldVal},${liquidityNewVal}\n`);
        jumpViaEth.pop();
    }
}

checkLiquidity();

function computePairLiquidity(base, quote) {
    const block = 19539915;
    const univ3Liquidity = getLiquidity(base, quote, block, block);

    const newLiquidity = getLiquidityAll(base, quote, block, block);
    const newLqty = newLiquidity[block].slippageMap[500].base;
    console.log(`${base}/${quote} new liquidity: ${newLqty}`);
    const line = `${base},${quote},${newLqty}`;
    console.log(line);
    fs.appendFileSync('liquidityresult.csv', line + '\n');
}
