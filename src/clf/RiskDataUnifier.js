const DATA_DIR = process.cwd() + '/data';
const path = require('path');
const fs = require('fs');
const { jsDateToString } = require('../utils/utils');




function unifyRiskData(protocol, chain) {
    let currentDay = new Date();
    const day = jsDateToString(currentDay);
    const folderPath = DATA_DIR + `/clf/${protocol}/` + day;
    const generalFileName = `${day}_${protocol}_CLFs.json`;
    const graphDataFileName = `${day}_${protocol}_graphData.json`;
    const averagesFileName = `${day}_${protocol}_average_CLFs.json`;
    const generalFilePath = path.join(folderPath, generalFileName);
    const graphDataFilePath = path.join(folderPath, graphDataFileName);
    const averagesFilePath = path.join(folderPath, averagesFileName);
    const finalObject = {};
    try {
        const generalContents = fs.readFileSync(generalFilePath, 'utf8');
        const generalLatestData = JSON.parse(generalContents);
        const graphDataContents = fs.readFileSync(graphDataFilePath, 'utf8');
        const graphData = JSON.parse(graphDataContents);
        const averagesContents = fs.readFileSync(averagesFilePath, 'utf8');
        const averagesData = JSON.parse(averagesContents);

        finalObject['protocolName'] = generalLatestData.protocol;
        finalObject['global'] = [];
        finalObject['items'] = [];

        const globalObject = {};
        globalObject['chain'] = chain;
        globalObject['averageRiskLevelHistory'] = averagesData.protocolAverageHistory;

        
        const items = [];
        for(const market of Object.keys(generalLatestData.results)){
            const item = {
                name: market,
                chain: chain,
                baseAsset: market,
                riskLevels: []
            };
            items.push(item);
        }




    }
    catch { throw new Error(); }
}