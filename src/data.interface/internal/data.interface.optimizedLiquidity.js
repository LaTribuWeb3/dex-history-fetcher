

const { DEFAULT_STEP_BLOCK } = require('../utils/constants');





function getLiquidityOptimized(platform, fromSymbol, toSymbol, fromBlock, toBlock, withJumps = true, stepBlock = DEFAULT_STEP_BLOCK) {
    /// transform the input parameters into linear optimization inputs

     /// function which takes platform, from block, to block, et qui retourne toutes les pairs disponibles sur la plateform avec les liquidités
        //// precompute map before calling for all the different pairs
    //  const liquidity = {
    //     "a" : {"eth" : [123, 256, 890, 2001, 5000],
    //            "usdc" : [123, 3167, 3333, 9000, 10000]},
    //     "eth" : {"usdc" : [5000, 6000, 7000, 8000, 9000],
    //              "dai" : [4000, 5000, 6000, 7000, 8000],
    //              "usdt" : [4200, 5500, 6500, 7500, 8500],
    //              "b" : [666, 777, 888, 999, 1010],
    //              "steth" : [1e6, 2e6, 3e6, 4e6, 5e6]},
    //     "usdc" : {"usdt" : [1e6, 2e6, 3e6, 4e6, 5e6],
    //               "dai" : [1.1e6, 2.1e6, 3.2e6, 4.3e6, 5.4e6],
    //               "b" : [185, 222, 333, 444, 555] },
    //     "dai" : {"usdt" : [1e6, 2e6, 3.5e6, 4e6, 6e6],
    //              "usdc" : [1.2e6, 2.2e6, 3.2e6, 4.2e6, 5.2e6],
    //              "b" : [185, 212, 331, 544, 655] },
    //     "usdt" : {"dai" : [1e6, 2e6, 3.5e6, 4e6, 6e6],
    //               "usdc" : [1.2e6, 2.2e6, 3.2e6, 4.2e6, 5.2e6],
    //               "b" : [285, 312, 431, 644, 755]},
    //     "steth" : {"eth" : [1e6, 2e6, 3e6, 4e6, 5e6]}
    // }

        /// function that builds the input for the linear optimization
          //// just take Yaron's code

          //// call the linear optimization function


    /// transform linear optimization outputs into slippageMap for interval, add route to slippageMap top level
        /// parse the columns output to get the total liquidity and the route(s)
            {
                routes:
                {
                    eth to usd (300)
                
                }
            }


    return liquidity;
}