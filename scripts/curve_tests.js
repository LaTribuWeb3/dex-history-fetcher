const { ethers } = require('ethers');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();
const {tokens} = require('../src/global.config');
const { get_return, get_virtual_price } = require('../src/curve/curve.utils');
const { normalize } = require('../src/utils/token.utils');

async function price3CrvUsdc() {
    
    const _3poolFilePath = './data/curve/3Pool_3Crv_curve.csv';
    const _3poolfileContent = fs.readFileSync(_3poolFilePath, 'utf-8').split('\n');
    
    const daiToken = tokens['DAI'];
    const usdcToken = tokens['USDC'];
    const usdtToken = tokens['USDT'];
    const amount1000e18 = BigInt(1000) * (BigInt(10) ** BigInt(18));
    fs.writeFileSync('./nocommit/3crv_usdc_price.csv', 'blocknumber,Amp factor,price 3crv in usdc,virtual price,virtual price constant A = 100\n');
    for(let i = 1; i < _3poolfileContent.length -1; i++) {
        const splt = _3poolfileContent[i].split(',');
        
        const blockNumber = splt[0];
        if(Number(blockNumber) < 12185217) {
            // ignore block before first block of lusd
            continue;
        }

        const ampFactor = splt[1];
        const lpSupplyNormalized = normalize(splt[2], 18);
        const reserveDAI18Decimals = BigInt(splt[3]);
        const reserveUSDC18Decimals = BigInt(splt[4] + ''.padEnd(18 - usdcToken.decimals, '0'));
        const reserveUSDT18Decimals = BigInt(splt[5] + ''.padEnd(18 - usdtToken.decimals, '0'));
        const amountUsdcFor1000Dai = get_return(0, 1, amount1000e18, [reserveDAI18Decimals, reserveUSDC18Decimals, reserveUSDT18Decimals], Number(ampFactor));
        const priceDaiInUsdc = normalize((amountUsdcFor1000Dai / 1000n).toString(), 18);
        const amountUsdcFor1000usdt = get_return(2, 1, amount1000e18, [reserveDAI18Decimals, reserveUSDC18Decimals, reserveUSDT18Decimals], Number(ampFactor));
        const priceUsdtInUsdc = normalize((amountUsdcFor1000usdt / 1000n).toString(), 18);
        const valueDai = normalize(reserveDAI18Decimals, 18) * priceDaiInUsdc;
        const valueUsdc = normalize(reserveUSDC18Decimals, 18) * 1; // consider 1 USDC = 1$
        const valueUsdt = normalize(reserveUSDT18Decimals, 18) * priceUsdtInUsdc; // consider 1 USDC = 1$
        const normalizedPrice3CrvInUsdc = (valueDai + valueUsdc + valueUsdt) / lpSupplyNormalized;

        const virtualPrice = get_virtual_price([reserveDAI18Decimals, reserveUSDC18Decimals, reserveUSDT18Decimals], BigInt(3), BigInt(ampFactor), lpSupplyNormalized);
        const virtualPriceConstantA100 = get_virtual_price([reserveDAI18Decimals, reserveUSDC18Decimals, reserveUSDT18Decimals], BigInt(3), BigInt(100), lpSupplyNormalized);
        fs.appendFileSync('./nocommit/3crv_usdc_price.csv', `${blockNumber},${ampFactor},${normalizedPrice3CrvInUsdc},${virtualPrice},${virtualPriceConstantA100}\n`);
    }
}
async function lusdvs3crvPrice() {
    /*
    Yaron | B.Protocol & RiskDAOowner
    @Alfulinku on the different front. Can you please run the historical liquidity tool and output results for lusd/3pool? 
    Just balances and price for $1k qty should be enough. But also need to normalize the 3pool to USD somehow.
    */
    const _3crvPriceFilePath = './nocommit/3crv_usdc_virtual_fake_virtual.csv';
    const _3crvPriceLines = fs.readFileSync(_3crvPriceFilePath, 'utf-8').split('\n');
    const _3crvPriceDictionary = {};
    for(let i = 1; i < _3crvPriceLines.length -1; i++) {
        // take the  virtual price from 3crv_usdc_price
        _3crvPriceDictionary[_3crvPriceLines[i].split(',')[0]] = Number(_3crvPriceLines[i].split(',')[3]);
    }

    const priceBlockNumSortedAsc = Object.keys(_3crvPriceDictionary).map(_ => Number(_)).sort((a,b) => a - b);

    const lusdToken = tokens['LUSD'];
    const _3crvToken = tokens['3Crv'];
    const datafilePath = './data/curve/lusd_LUSD3CRV-f_curve.csv';
    const outputfilePath = './nocommit/lusd_3crv_price_history_virtual_price.csv';
    const fileContent = fs.readFileSync(datafilePath, 'utf-8').split('\n');

    fs.writeFileSync(outputfilePath, 'blocknumber,price LUSD in 3CRV,3CRV virtual price,price LUSD in USD,Reserve LUSD,Reserve 3Crv,Amplification Factor\n');
    const amountLusd = BigInt(1000) * (BigInt(10) ** BigInt(18));
    let toWrite = [];
    for(let i = 1; i < fileContent.length -1; i++) {
        const splt = fileContent[i].split(',');
        if(splt.length < 4) {
            console.log('LINE EMPTY?', i, fileContent[i]);
            continue;
        }
        const blockNumber = Number(splt[0]);
        const ampFactor = splt[1];
        const reserveLusd = splt[2];
        const reserve3Crv = splt[3];

        const reservesBigIntWei = [BigInt(reserveLusd), BigInt(reserve3Crv)];
        // console.log('amountLusd', amountLusd);
        const amountOf3Crv = get_return(0, 1, amountLusd, reservesBigIntWei, Number(ampFactor));
        // console.log('amountOf3Crv', amountOf3Crv);
        const price = normalize((amountOf3Crv / 1000n).toString(), 18);
        // console.log('price', price);
        let price3CrvInUsdc = _3crvPriceDictionary[blockNumber];
        if(!price3CrvInUsdc) {
            // if no exact find, find nearest block up and down and select the closest
            const nearestBlockDown = priceBlockNumSortedAsc.filter(_ => _ < blockNumber).slice(-1);
            const nearestBlockUp = priceBlockNumSortedAsc.filter(_ => _ > blockNumber)[0];
            const distanceFromUp = Math.abs(blockNumber - nearestBlockUp);
            const distanceFromDown = Math.abs(blockNumber - nearestBlockDown);

            // select the least distance 
            if(distanceFromUp < distanceFromDown) {
                price3CrvInUsdc = _3crvPriceDictionary[nearestBlockUp];
            } else {
                price3CrvInUsdc = _3crvPriceDictionary[nearestBlockDown];
            }
        }

        toWrite.push(`${blockNumber},${price},${price3CrvInUsdc},${price3CrvInUsdc * price},${reserveLusd},${reserve3Crv},${ampFactor}\n`);

        if(toWrite.length >= 10000) {
            fs.appendFileSync(outputfilePath, toWrite.join(''));
            toWrite = [];
        }
    }

    if(toWrite.length >= 0) {
        fs.appendFileSync(outputfilePath, toWrite.join(''));
    }
}

// lusdvs3crvPrice();

async function compareTwoCsvCurve(){
    const datafilePath = './data/curve/3Pool_curve.csv';
    const datafilePathOld = './data/curve/3Pool_curve.csv-old';
    const fileContent = fs.readFileSync(datafilePath, 'utf-8').split('\n');
    const fileContentOld = fs.readFileSync(datafilePathOld, 'utf-8').split('\n');

    for(let i = 1; i < fileContentOld.length -1; i++) {
        const dataNew = fileContent[i].split(',');
        const dataOld = fileContentOld[i].split(',');

        const blockNew = dataNew[0];
        const blockOld = dataOld[0];

        if(blockNew != blockOld) {
            
            console.log('BLOCK MISMATCH', blockNew, blockOld);

        }

        const token0New =  dataNew[3];
        const token0Old =  dataOld[2];
        const token1New =  dataNew[4];
        const token1Old =  dataOld[3];
        const token2New =  dataNew[5];
        const token2Old =  dataOld[4];

        if(token0New != token0Old) {
            console.log('ERROR T0 AT BLOCK', blockNew);
        }
        if(token1New != token1Old) {
            console.log('ERROR T1 AT BLOCK', blockNew);
        }
        if(token2New != token2Old) {
            console.log('ERROR T2 AT BLOCK', blockNew);
        }
    }
}

async function test() {
    const files = fs.readdirSync('./data/curve');
    for(const file of files) {
        const datafilePathOld = './data/curve/' + file;
        const fileContentOld = fs.readFileSync(datafilePathOld, 'utf-8').split('\n');
        let lastBlock = Number(fileContentOld[1].split(',')[0]);
        for(let i = 2; i < fileContentOld.length -1; i++) {
            const block = Number(fileContentOld[i].split(',')[0]);
            if(block == lastBlock) {
                console.log('DUPLICATE BLOCK', block, 'on file', file);
            }
    
            lastBlock = block;
        }
    }
}
lusdvs3crvPrice();