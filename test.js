const bitcoinMessage = require('bitcoinjs-message');

let address = "mz9nDD4zq1S7m9kshZNAgg9GWgRxiixTma"
let message = "mz9nDD4zq1S7m9kshZNAgg9GWgRxiixTma:1638697212:starRegistry"
let sign1 = "H0Ye44GQE74n/8dBkXISPTJgiUVnc9OcdDsJAUeCBRxlXVcFKFGAB0BrsieyELKWcCN+DDee/RLSp6HwCJLG9Y4="
let sign2 = "H0Ye44GQE74n/8dBkXISPTJgiUVnc9OcdDsJAUeCBRxlXVcFKFGAB0BrsieyELKWcCN+DDee/RLSp6HwCJLG9Y5="

console.log(bitcoinMessage.verify(message,address, sign1));
console.log(bitcoinMessage.verify(message,address, sign2));