const { getUnifiedDataForInterval } = require("../data.interface/internal/data.interface.utils");
const { DEFAULT_STEP_BLOCK } = require("./constants");

const MAX_JUMPS = 2;

function generatePermutations(array) {
    let result = [];
  
    // Helper function to swap array elements
    function swap(arr, i, j) {
        let temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
  
    // Recursive function to generate permutations
    function permute(arr, startIndex, endIndex) {
        if (startIndex === endIndex) {
            result.push(arr.slice()); // Use slice to clone the array
        } else {
            for (let i = startIndex; i <= endIndex; i++) {
                swap(arr, startIndex, i); // Swap current element with start
                permute(arr, startIndex + 1, endIndex); // Generate all permutations for the rest
                swap(arr, startIndex, i); // Backtrack to previous state
            }
        }
    }
  
    permute(array, 0, array.length - 1);
    return result;
}

  
function generateAllRoutes(base, quote, pivots, maxJumps) {
    let allRoutes = [];
  
    // Ensure pivots are unique and exclude base and quote
    let uniquePivots = [...new Set(pivots.filter(pivot => pivot !== base && pivot !== quote))];
  
    // Generate routes with 0 jumps (direct route, if allowed)
    if (maxJumps >= 0) {
        allRoutes.push([base, quote]);
    }
  
    // Helper function to build routes
    function buildRoutes(currentRoute, availablePivots, jumpsRemaining) {
        if (jumpsRemaining === 0) {
            allRoutes.push(currentRoute.concat(quote));
            return;
        }
  
        availablePivots.forEach((pivot, index) => {
        // Skip pivot if it's already in the route
            if (!currentRoute.includes(pivot)) {
                // Build next route with current pivot and reduce available pivots
                let nextRoute = currentRoute.concat(pivot);
                let nextAvailablePivots = availablePivots.slice(0, index).concat(availablePivots.slice(index + 1));
                buildRoutes(nextRoute, nextAvailablePivots, jumpsRemaining - 1);
            }
        });
    }
  
    // Generate routes for each possible jump count up to maxJumps
    for (let jumps = 1; jumps <= maxJumps; jumps++) {
        buildRoutes([base], uniquePivots, jumps);
    }
  
    return allRoutes;
}

  
function generateAllOptions(jumpSize, total, numVars) {
    if (numVars === 1) {
        return [[total]];
    }
    // else
    let result = [];
    let maxValue = total - (numVars - 1) * jumpSize;
    for (let i = 0; i < Math.floor(maxValue / jumpSize); i++) {
        let value = (i + 1) * jumpSize;
        let options = generateAllOptions(jumpSize, total - value, numVars - 1);
        let currList = [value];
        for (let anOption of options) {
            result.push(currList.concat(anOption));
        }
    }
    return result;
}

  
/**
 * Compute the aggregated volume from 3 segments
 * Example wBETH->ETH + ETH->USDT + USDT->TUSD
 * @param {{base: number, quote: number}[]} segments
 * @returns {{base: number, quote: number}}
 */
function computeAggregate(segments) {
    let baseUtilization = 1; // Start with 100% utilization
    let previousQuote = 0;
    let rate = 0;
    let cumulativeRate = 0;
  
    const usedForSegments = [];
    // Iterate over each segment, calculating rates and utilizations as needed
    for(let index = 0; index < segments.length; index++) {
        const segment = segments[index];
        if (index === 0) {
            rate = segment.quote / segment.base;
            cumulativeRate = rate;
            previousQuote = segment.base * rate;
            usedForSegments[index] = { base: segment.base, quote: segment.quote};
        } else {
            rate = segment.quote / segment.base;
            cumulativeRate *= rate;
            // Compute base utilization if the previous segment's quote exceeds the current segment's base
            // it means we don't fully use the availabe liquidity so we need to down the amount used
            if (previousQuote > segment.base) {
                const currentBaseUtilization = segment.base / previousQuote;
                baseUtilization *= currentBaseUtilization;
                previousQuote = segment.base * rate;
                for(let i = 0; i < index; i++) {
                    usedForSegments[i].base *= currentBaseUtilization;
                    usedForSegments[i].quote *= currentBaseUtilization;
                }
                usedForSegments[index] = { base: segment.base, quote: segment.quote};
            } else {
                previousQuote = previousQuote * rate;
                usedForSegments[index] = { base: segment.base, quote: segment.quote};
            }
        }
    }
  
    // Calculate the base used and the final quote obtained
    const firstSegment = segments[0];
    // const lastRate = segments[segments.length - 1].quote / segments[segments.length - 1].base;
    const baseUsed = firstSegment.base * baseUtilization;
    const quoteObtained = baseUsed * cumulativeRate;
  
    return { base: baseUsed, quote: quoteObtained, usedForSegments };
}
  
/**
 * 
 * @param {{base: string, quote: string, slippageMap: {[slippageBps: number]: {base: number, quote: number}[]}}} segments 
 * @param {number} targetSlippageBps
 * @returns {{base: number, quote: number, usedForSegments: {base: number, quote: number}[]}}
 */
function computeAggregatedVolume(segments, targetSlippageBps) {
    let maxBase = 0;
    let quote = 0;
    let selectedOptions = [];
    let usedForSegments = [];
  
    const allOptions = generateAllOptions(50, targetSlippageBps, segments.length);
    for (const options of allOptions) {
        const segmentsData = [];
        for(let i = 0; i < segments.length; i++) {
            segmentsData.push(segments[i].slippageMap[options[i]]);
        }
  
        const data = computeAggregate(segmentsData);
  
        if (data.base > maxBase) {
            selectedOptions = options;
            maxBase = data.base;
            quote = data.quote;
            usedForSegments = data.usedForSegments;
        }
    }
  
    console.log(`Best options: ${selectedOptions}`);
    return { base: maxBase, quote: quote, usedForSegments };
}

function test() {
    let totalBase = 0;
    let totalQuote = 0;
    const base = 'wstETH';
    const quote = 'USDC';
    const platform = 'uniswapv3';
    const targetSlippage = 500;
    const usedPools = [];

    const pivots = ['WETH'];

    const allRoutes = generateAllRoutes(base, quote, pivots, MAX_JUMPS);

    const allSegments = {};

    // fetch data from all the pairs
    for(const route of allRoutes) {
        for(let i = 1; i < route.length; i++) {
            const from = route[i-1];
            const to = route[i];
            if(!allSegments[from] || !allSegments[from][to]) {
                const data = getUnifiedDataForInterval(platform, from, to, 19481972, 19481972, DEFAULT_STEP_BLOCK, usedPools);
                usedPools.push(...data.usedPools);
                if(!allSegments[from]) {
                    allSegments[from] = {};
                }

                allSegments[from][to] = {};
                for(const slippageBps of Object.keys(data.unifiedData[19481972].slippageMap)) {
                    if(slippageBps <= targetSlippage) {
                        allSegments[from][to][slippageBps] = data.unifiedData[19481972].slippageMap[slippageBps];
                    }
                }
            }
        }
    }
    const allPermutations = generatePermutations(pivots);

    for(const pivotPermutation of allPermutations) {
        let permutationBase = 0;
        let permutationQuote = 0;
        const routes = generateAllRoutes(base, quote, pivotPermutation, MAX_JUMPS);
        for(const route of routes) {
            const routeSegments = [];
            for(let i = 1; i < route.length; i++) {
                const from = route[i-1];
                const to = route[i];
                routeSegments.push({
                    base: from,
                    quote: to,
                    slippageMap: allSegments[from][to]
                });
            }
            const liquidityData = computeAggregatedVolume(routeSegments, targetSlippage);
            permutationBase += liquidityData.base;
            permutationQuote += liquidityData.quote;
            console.log(liquidityData);

            // update remaining in segments
            for(let i = 0; i < routeSegments.length; i++) {
                const usedForSegment = liquidityData.usedForSegments[i];
                const from = routeSegments[i].base;
                const to = routeSegments[i].quote;
                console.log(`for segment ${routeSegments[i].base}->${routeSegments[i].quote}: used:`, usedForSegment);
                console.log('liquidity before:', allSegments[from][to]);
                for(const slippageBps of Object.keys(allSegments[from][to])) {
                    allSegments[from][to][slippageBps].base = Math.max(0, allSegments[from][to][slippageBps].base - usedForSegment.base);
                    allSegments[from][to][slippageBps].quote = Math.max(0, allSegments[from][to][slippageBps].quote - usedForSegment.quote);
                }
                console.log('liquidity after:', allSegments[from][to]);
                console.log('-----');
            }
        }

        if(totalBase < permutationBase) {
            totalBase = permutationBase;
            totalQuote = permutationQuote;
        }
    }

    return {base: totalBase, quote: totalQuote};
}

test();
module.exports = { computeAggregatedVolume };