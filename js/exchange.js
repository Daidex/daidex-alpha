let networks;
let clientAddress;
let zeroEx;
let netId;
window.addEventListener('load', async function() {
  if (typeof web3 !== 'undefined') {
    // Use Mist/MetaMask's provider
    web3 = new Web3(web3.currentProvider);
    //document.getElementById('meta-mask-required').innerHTML = 'Metamask plugin detected';
  } else {
    console.log('No web3? You should consider trying MetaMask!')
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    //document.getElementById('meta-mask-required').innerHTML = 'You need <a href="https://metamask.io/">MetaMask</a> browser plugin to run this example'
    //web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/TsdoDuPiajm8bmj2lOje"));
    //return;
  }

  clientAddress = web3.eth.coinbase;
  netId = await getNetworkId();

  await fetch("js/networks.json")
  .then((resp) => resp.json())
  .then(function(data){
    networks = data;
  })
  .catch(function(error){
    console.log(error);
  });

  let tokenSelect1 = document.getElementById("token-select1");
  for(var tokenSymbol of networks.Symbols){
    let selectOption = document.createElement("option");
    selectOption.text = tokenSymbol;
    selectOption.value = tokenSymbol;
    tokenSelect1.add(selectOption);
  }

  let tokenSelect2 = document.getElementById("token-select2");
  for(var tokenSymbol of networks.Symbols){
    let selectOption = document.createElement("option");
    selectOption.text = tokenSymbol;
    selectOption.value = tokenSymbol;
    tokenSelect2.add(selectOption);
  }
  loadDropdownMenu();
});

async function tokenSelected(tokenList){
  this.tokenSymbol = document.getElementById(tokenList).value;
  this.tokenAddress = getTokenAddressBySymbol(this.tokenSymbol);

  const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
  switch(tokenList){
    case "token-select1":
      zeroEx.token.getBalanceAsync(this.tokenAddress, clientAddress).then((balance) => {
        document.getElementById("balanceA").innerHTML = parseFloat(ZeroEx.ZeroEx
        .toUnitAmount(balance, 18)).toFixed(6);
      });
      zeroEx.token.getProxyAllowanceAsync(this.tokenAddress, clientAddress).then((tokenAllowenceAmount) => {
        if (tokenAllowenceAmount > 0){
          document.getElementById('token-checkbox').checked = true;
        }else{
          document.getElementById('token-checkbox').checked = false;
        }
        document.getElementById('token-checkbox').disabled = false;
        document.getElementById('loader').hidden = true;
        document.getElementById('token-span').hidden = false;
      });
      document.getElementById("tokenBList").children[1].innerHTML = "WETH";
      document.getElementById("token-select2").value = "WETH";
      zeroEx.token.getBalanceAsync(networks.Kovan.WETH, clientAddress).then((balance) => {
        document.getElementById("balanceB").innerHTML = parseFloat(ZeroEx.ZeroEx
        .toUnitAmount(balance, 18)).toFixed(6);
      });
      break;
    case "token-select2":
      zeroEx.token.getBalanceAsync(this.tokenAddress, clientAddress).then((balance) => {
        document.getElementById("balanceB").innerHTML = parseFloat(ZeroEx.ZeroEx
        .toUnitAmount(balance, 18)).toFixed(6);
      });
      document.getElementById("tokenAList").children[1].innerHTML = "WETH";
      document.getElementById("token-select1").value = "WETH";
      zeroEx.token.getBalanceAsync(networks.Kovan.WETH, clientAddress).then((balance) => {
        document.getElementById("balanceA").innerHTML = parseFloat(ZeroEx.ZeroEx
        .toUnitAmount(balance, 18)).toFixed(6);
      });
      zeroEx.token.getProxyAllowanceAsync(networks.Kovan.WETH, clientAddress).then((tokenAllowenceAmount) => {
        if (tokenAllowenceAmount > 0){
          document.getElementById('token-checkbox').checked = true;
        }else{
          document.getElementById('token-checkbox').checked = false;
        }
        document.getElementById('token-checkbox').disabled = false;
        document.getElementById('loader').hidden = true;
        document.getElementById('token-span').hidden = false;
      });
      break;
  }
}

function getNetworkId(){
  return new Promise(resolve => {
    web3.version.getNetwork((error, networkId) => {
      resolve(parseInt(networkId));
    });
  });
}

async function modifyAllowence(){
  var checkedValue = document.getElementById('token-checkbox').checked;
  document.getElementById('token-checkbox').disabled = true;
  document.getElementById('loader').hidden = false;
  document.getElementById('token-span').hidden = true;
  let tokenSymbol = document.getElementById('token-select1').value;
  let tokenAddress = getTokenAddressBySymbol(tokenSymbol);
  const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
  let msg;// msg can be an error if transaction rejected or tx hash if success
  if(checkedValue == true){
    try{
      msg = await enableTokenTrading(tokenAddress, clientAddress);
      await zeroEx.awaitTransactionMinedAsync(msg, 1500);
    }
    catch(error){
      console.log(error);
      msg = error;
    }
  } else {
    try{
      msg = await disableTokenTrading(tokenAddress, clientAddress);
      await zeroEx.awaitTransactionMinedAsync(msg, 1500);
    }catch(error){
      msg = error;
    }
  }
  loadTokenAllowence(tokenSymbol);
}

async function enableTokenTrading(tokenAddress, accountAddress){
  const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
  const enableTx = await zeroEx.token.setUnlimitedProxyAllowanceAsync(
    tokenAddress,
    accountAddress,
    {
      // You can optionally pass in the gas price and gas limit you would like to use
      // gasLimit: 80000,
      // gasPrice: new BigNumber(10**10),
    }
  );
  return enableTx;
}

async function disableTokenTrading(tokenAddress, accountAddress){
  let amount = new BigNumber("0");
  console.log(typeof amount)
  const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
  const disableTx = await zeroEx.token.setProxyAllowanceAsync(
    tokenAddress,
    accountAddress,
    amount,
    {
      // You can optionally pass in the gas price and gas limit you would like to use
      // gasLimit: 80000,
      // gasPrice: new BigNumber(10**10),
    }
  );
  return disableTx;
}

async function getTokenAllowence(symbol){
  const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
  let balance = await zeroEx.token.getProxyAllowanceAsync(
    getTokenAddressBySymbol(symbol),
    clientAddress,
  );
  return balance.toNumber();
}

// Tokens have different addresses depending on the network
function getTokenAddressBySymbol(symbol){
  switch (symbol) {
    case "WETH":
      switch (netId) {
        case 1:
          return networks.Mainnet.WETH;
          break;
        case 3:
          return networks.Ropsten.WETH;
          break;
        case 4:
          return networks.Rinkeby.WETH;
          break;
        case 42:
          return networks.Kovan.WETH;
          break;
        default:
        return undefined;
      }
      break;
    case "ZRX":
      switch (netId) {
        case 1:
          return networks.Mainnet.ZRX;
          break;
        case 3:
          return networks.Ropsten.ZRX;
          break;
        case 4:
          return networks.Rinkeby.ZRX;
          break;
        case 42:
          return networks.Kovan.ZRX;
          break;
        default:
          return undefined;
      }
      break;
    case "DAI":
      switch (netId) {
        case 1:
          return networks.Mainnet.DAI;
          break;
        case 3:
          return networks.Ropsten.DAI;
          break;
        case 4:
          return networks.Rinkeby.DAI;
          break;
        case 42:
          return networks.Kovan.DAI;
          break;
        default:
          return undefined;
      }
      break;
    case "DGD":
      switch (netId) {
        case 1:
          return networks.Mainnet.DGD;
          break;
        case 3:
          return networks.Ropsten.DGD;
          break;
        case 4:
          return networks.Rinkeby.DGD;
          break;
        case 42:
          return networks.Kovan.DGD;
          break;
        default:
          return undefined;
      }
      break;
    case "MKR":
      switch (netId) {
        case 1:
          return networks.Mainnet.MKR;
          break;
        case 3:
          return networks.Ropsten.MKR;
          break;
        case 4:
          return networks.Rinkeby.MKR;
          break;
        case 42:
          return networks.Kovan.MKR;
          break;
        default:
          return undefined;
      }
      break;
    case "REP":
      switch (netId) {
        case 1:
          return networks.Mainnet.REP;
          break;
        case 3:
          return networks.Ropsten.REP;
          break;
        case 4:
          return networks.Rinkeby.REP;
          break;
        case 42:
          return networks.Kovan.REP;
          break;
        default:
          return undefined;
      }
      break;
    default:
      return undefined;
  }
}

async function loadTokenAllowence(symbol){
  if (await getTokenAllowence(symbol) > 0){
    document.getElementById('token-checkbox').checked = true;
  }else{
    document.getElementById('token-checkbox').checked = false;
  }
  document.getElementById('token-checkbox').disabled = false;
  document.getElementById('loader').hidden = true;
  document.getElementById('token-span').hidden = false;
}

async function exchange(){
  this.takerTokenSymbol = document.getElementById("token-select1").value;
  this.makerTokenSymbol = document.getElementById("token-select2").value;
  this.cond1 = this.takerTokenSymbol in networks.Kovan;
  this.cond2 = this.makerTokenSymbol in networks.Kovan;
  this.cond3 = this.makerTokenSymbol != this.takerTokenSymbol;
  this.cond4 = "WETH" == this.makerTokenSymbol || "WETH" == this.takerTokenSymbol;
  this.takerAmount = parseFloat(document.getElementById("taker-amount").value);
  this.makerAmount = parseFloat(document.getElementById("maker-amount").value);
  this.cond5 = this.takerAmount > 0;
  // this.cond6 = this.makerAmount > 0;
  this.cond6 = document.getElementById("token-checkbox").checked;
  this.takerTokenBalance = parseFloat(document.getElementById("balanceA").innerHTML);
  this.cond7 = this.takerTokenBalance >= this.takerAmount;
  if(cond1 && cond2 && cond3 && cond4 && cond5 && cond6 && cond7){
    const radarRelay = new RadarRelay("https://api.kovan.radarrelay.com/0x/v0/");
    // const ddex = new HttpClient("https://api.ercdex.com/api/standard/42/v0/");
    if(this.takerTokenSymbol != "WETH"){ this.tokenA = this.takerTokenSymbol; }
    else{ this.tokenA = this.makerTokenSymbol; }
    console.log(this.tokenA);
    // Requesting orderbook from RadarRelay
    let orderbookResponse = await radarRelay.getOrderbookAsync(
      getTokenAddressBySymbol(this.tokenA),
      getTokenAddressBySymbol("WETH")
    );
    console.log(orderbookResponse);
    const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
    // Paying with WETH, receiving another token
    if(this.takerTokenSymbol == "WETH"){
      // Sorting asks
      const sortedAsks = orderbookResponse.asks.sort((orderA, orderB) => {
        const orderRateA = new BigNumber(orderA.takerTokenAmount).div(new BigNumber(orderA.makerTokenAmount));
        const orderRateB = new BigNumber(orderB.takerTokenAmount).div(new BigNumber(orderB.makerTokenAmount));
        return orderRateA.comparedTo(orderRateB);
      });
      // Preparing orders
      for(let askOrder of sortedAsks) {
        askOrder.takerTokenAmount = new BigNumber(askOrder.takerTokenAmount);
        askOrder.makerTokenAmount = new BigNumber(askOrder.makerTokenAmount);
        askOrder.takerFee = new BigNumber(askOrder.takerFee);
        askOrder.makerFee = new BigNumber(askOrder.makerFee);
        askOrder.expirationUnixTimestampSec = new BigNumber(askOrder.expirationUnixTimestampSec);
      }
      // building batch orders to fill
      let ordersToFill = [];
      let takerTokenAmount = ZeroEx.ZeroEx.toBaseUnitAmount(new BigNumber(this.takerAmount), 18);
      for(let askOrder of sortedAsks) {
        if(askOrder.takerTokenAmount.lte(takerTokenAmount)) {
          ordersToFill.push({ signedOrder: askOrder, takerTokenFillAmount: askOrder.takerTokenAmount });
          takerTokenAmount.minus(askOrder.takerTokenAmount);
        } else {
          ordersToFill.push({ signedOrder: askOrder, takerTokenFillAmount: takerTokenAmount });
          break;
        }
      }
      // filling orders
      try {
        const fillTxHash = await zeroEx.exchange.batchFillOrdersAsync(ordersToFill, true, clientAddress);
        const hash = await zeroEx.awaitTransactionMinedAsync(fillTxHash);
        console.log(hash);
      }
      catch(error) {
        console.log(error);
      }
    // Paying with another token, receiving WETH
    }else{
      // Sorting bids orders
      const sortedBids = orderbookResponse.bids.sort((orderA, orderB) => {
        const orderRateA = new BigNumber(orderA.makerTokenAmount).div(new BigNumber(orderA.takerTokenAmount));
        const orderRateB = new BigNumber(orderB.makerTokenAmount).div(new BigNumber(orderB.takerTokenAmount));
        return orderRateB.comparedTo(orderRateA);
      });
      // Preparing orders
      for(let bidOrder of sortedBids) {
        bidOrder.takerTokenAmount = new BigNumber(bidOrder.takerTokenAmount);
        bidOrder.makerTokenAmount = new BigNumber(bidOrder.makerTokenAmount);
        bidOrder.takerFee = new BigNumber(bidOrder.takerFee);
        bidOrder.makerFee = new BigNumber(bidOrder.makerFee);
        bidOrder.expirationUnixTimestampSec = new BigNumber(bidOrder.expirationUnixTimestampSec);
      }
      // building batch orders to fill
      let ordersToFill = [];
      let takerTokenAmount = ZeroEx.ZeroEx.toBaseUnitAmount(new BigNumber(this.takerAmount), 18);
      for(let bidOrder of sortedBids) {
        if(bidOrder.takerTokenAmount.lte(takerTokenAmount)) {
          ordersToFill.push({ signedOrder: bidOrder, takerTokenFillAmount: bidOrder.takerTokenAmount });
          takerTokenAmount.minus(bidOrder.takerTokenAmount);
        } else {
          ordersToFill.push({ signedOrder: bidOrder, takerTokenFillAmount: takerTokenAmount });
          break;
        }
      }
      // filling orders
      try {
        const fillTxHash = await zeroEx.exchange.batchFillOrdersAsync(ordersToFill, true, clientAddress);
        const hash = await zeroEx.awaitTransactionMinedAsync(fillTxHash);
        console.log(hash);
      }
      catch(error) {
        console.log(error);
      }
    }
  } else {
    console.log("wrong!");
  }
}
