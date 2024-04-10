/* eslint-disable */
const uniswapV2FactoryAddress = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';

const uniswapV2FactoryABI = [{"inputs":[{"internalType":"address","name":"_feeToSetter","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"token0","type":"address"},{"indexed":true,"internalType":"address","name":"token1","type":"address"},{"indexed":false,"internalType":"address","name":"pair","type":"address"},{"indexed":false,"internalType":"uint256","name":"","type":"uint256"}],"name":"PairCreated","type":"event"},{"constant":true,"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"allPairs","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"allPairsLength","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"}],"name":"createPair","outputs":[{"internalType":"address","name":"pair","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"feeTo","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"feeToSetter","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"getPair","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_feeTo","type":"address"}],"name":"setFeeTo","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_feeToSetter","type":"address"}],"name":"setFeeToSetter","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}]

const uniswapV2PairABI = [{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0In","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1In","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount0Out","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1Out","type":"uint256"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"Swap","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint112","name":"reserve0","type":"uint112"},{"indexed":false,"internalType":"uint112","name":"reserve1","type":"uint112"}],"name":"Sync","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"constant":true,"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"MINIMUM_LIQUIDITY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"PERMIT_TYPEHASH","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"burn","outputs":[{"internalType":"uint256","name":"amount0","type":"uint256"},{"internalType":"uint256","name":"amount1","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getReserves","outputs":[{"internalType":"uint112","name":"_reserve0","type":"uint112"},{"internalType":"uint112","name":"_reserve1","type":"uint112"},{"internalType":"uint32","name":"_blockTimestampLast","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_token0","type":"address"},{"internalType":"address","name":"_token1","type":"address"}],"name":"initialize","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"kLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"mint","outputs":[{"internalType":"uint256","name":"liquidity","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"nonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"permit","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"price0CumulativeLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"price1CumulativeLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"skim","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"amount0Out","type":"uint256"},{"internalType":"uint256","name":"amount1Out","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"swap","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"sync","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"token0","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"token1","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}]


// compound assets + oracle without sale pools
const uniswapV2Pairs = [
  "rETH-WETH",
  "AAVE-USDC",
  "AAVE-WETH",
  "BAT-DAI",
  "BAT-USDC",
  "BAT-WETH",
  "COMP-WETH",
  "DAI-AAVE",
  "DAI-COMP",
  "DAI-MKR",
  "DAI-USDC",
  "DAI-USDT",
  "DAI-WETH",
  "DAI-ZRX",
  "FEI-USDC",
  "FEI-WETH",
  "LINK-DAI",
  "LINK-USDC",
  "LINK-WETH",
  "MANA-WETH",
  "MKR-USDC",
  "MKR-WETH",
  "SNX-WETH",
  "sUSD-WETH",
  "SUSHI-USDC",
  "SUSHI-WETH",
  "TUSD-USDC",
  "TUSD-WETH",
  "UNI-DAI",
  "UNI-USDC",
  "UNI-WETH",
  "USDC-COMP",
  "USDC-USDT",
  "USDC-WETH",
  "USDC-ZRX",
  "USDP-WETH",
  "WBTC-DAI",
  "WBTC-USDC",
  "WBTC-USDT",
  "WBTC-WETH",
  "WETH-USDT",
  "WETH-ZRX",
  "YFI-WETH",
  "stETH-WETH",
  "HarryPotterObamaSonic10Inu-WETH",
  "ezETH-WETH"
]

// // compound assets + oracle 
// const uniswapV2Pairs = [
//   "AAVE-USDC",
//   "AAVE-WETH",
//   "BAT-DAI",
//   "BAT-USDC",
//   "BAT-WBTC",
//   "BAT-WETH",
//   "COMP-WETH",
//   "DAI-AAVE",
//   "DAI-COMP",
//   "DAI-FEI",
//   "DAI-MKR",
//   "DAI-USDC",
//   "DAI-USDP",
//   "DAI-USDT",
//   "DAI-WETH",
//   "DAI-ZRX",
//   "FEI-USDC",
//   "FEI-WETH",
//   "LINK-DAI",
//   "LINK-USDC",
//   "LINK-WETH",
//   "MANA-WETH",
//   "MKR-USDC",
//   "MKR-WETH",
//   "SNX-WETH",
//   "sUSD-WETH",
//   "SUSHI-USDC",
//   "SUSHI-WETH",
//   "TUSD-DAI",
//   "TUSD-USDC",
//   "TUSD-WBTC",
//   "TUSD-WETH",
//   "UNI-DAI",
//   "UNI-USDC",
//   "UNI-WBTC",
//   "UNI-WETH",
//   "USDC-COMP",
//   "USDC-USDT",
//   "USDC-WETH",
//   "USDC-ZRX",
//   "USDP-USDC",
//   "USDP-WETH",
//   "WBTC-AAVE",
//   "WBTC-DAI",
//   "WBTC-LINK",
//   "WBTC-USDC",
//   "WBTC-USDT",
//   "WBTC-WETH",
//   "WETH-USDT",
//   "WETH-ZRX",
//   "YFI-DAI",
//   "YFI-USDC",
//   "YFI-WBTC",
//   "YFI-WETH",
//   "stETH-WETH",
// ]
// compound assets confi
// const uniswapV2Pairs = [
//     "BAT-WETH",
//     "BAT-USDC",
//     "BAT-DAI",
//     "BAT-WBTC",
//     "DAI-WETH",
//     "DAI-USDC",
//     "WBTC-DAI",
//     "USDC-WETH",
//     "WBTC-USDC",
//     "WETH-USDT",
//     "USDC-USDT",
//     "DAI-USDT",
//     "WBTC-USDT",
//     "WBTC-WETH",
//     "WETH-ZRX",
//     "USDC-ZRX",
//     "DAI-ZRX",
//     "UNI-WETH",
//     "UNI-USDC",
//     "UNI-DAI",
//     "UNI-WBTC",
//     "COMP-WETH",
//     "USDC-COMP",
//     "DAI-COMP",
//     "TUSD-WETH",
//     "TUSD-USDC",
//     "TUSD-DAI",
//     "TUSD-WBTC",
//     "LINK-WETH",
//     "LINK-USDC",
//     "LINK-DAI",
//     "WBTC-LINK",
//     "MKR-WETH",
//     "MKR-USDC",
//     "DAI-MKR",
//     "SUSHI-WETH",
//     "SUSHI-USDC",
//     "AAVE-WETH",
//     "AAVE-USDC",
//     "DAI-AAVE",
//     "WBTC-AAVE",
//     "YFI-WETH",
//     "YFI-USDC",
//     "YFI-DAI",
//     "YFI-WBTC",
//     "USDP-WETH",
//     "USDP-USDC",
//     "DAI-USDP",
//     "FEI-WETH",
//     "FEI-USDC",
//     "DAI-FEI"
//   ]
// risk oracle config
// const uniswapV2Pairs = [
//     "USDC-WETH",
//     "WBTC-WETH",
//     "DAI-WETH",
//     "DAI-USDC",
//     "MANA-WETH",
//     "MKR-WETH",
//     "SNX-WETH",
//     "sUSD-WETH",
//     "UNI-WETH",
//     "UNI-USDC",
//     "WETH-USDT",
//     "USDC-USDT",
//     "WBTC-USDT",
//     "WBTC-USDC",
// ]


// const uniswapV2Pairs = [
//     "USDC-WETH",
//     "WBTC-WETH",
//     "WBTC-USDC",
//     "DAI-WETH",
//     "DAI-USDC",
//     "BUSD-USDC",
//     "BUSD-WETH",
//     "MANA-WETH",
//     "LINK-WETH",
//     "LINK-USDC",
//     "MKR-WETH",
//     "SNX-WETH",
//     "sUSD-WETH",
//     "UNI-WETH",
//     "UNI-USDC",
//     "WETH-USDT",
//     "USDC-USDT",
//     "WBTC-USDT",
//     "YFI-WETH",
//     "WETH-ZRX",
//     "FRAX-USDC",
//     "FRAX-WETH",
//     "BAL-WETH",
//     "WETH-CRV",
//     "WBTC-BADGER",
//     "BADGER-WETH",
//     "LDO-WETH",
//     "1INCH-WETH",
//     "stWETH-WETH",
// ]

module.exports = { uniswapV2FactoryAddress, uniswapV2FactoryABI, uniswapV2PairABI, uniswapV2Pairs };