// global variables
let networks;
let clientAddress;
let netId;
let link = document.createElement("a");
link.target = "_blank";
let etherscanBaseURL = "";
let orderbooks = {};
const TOKEN_DECIMALS = 18;
const DECIMALS_TO_SHOW = 9;
// BigNumber.config({ ERRORS: false });

window.addEventListener('load', async function() {
  if (typeof web3 !== 'undefined') {
    // Use Mist/MetaMask's provider
    web3 = new Web3(web3.currentProvider);
    //document.getElementById('meta-mask-required').innerHTML = 'Metamask plugin detected';
  } else {
    link.innerText = "Go to metamask.io";
    link.href = "https://metamask.io/";
    swal({ title: "MetaMask plugin no detected.",
           text: 'To start trading please install MetaMask and fund your account.',
           icon: "info",
           button: true,
           content: link,
           dangerMode: false });
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    //document.getElementById('meta-mask-required').innerHTML = 'You need <a href="https://metamask.io/">MetaMask</a> browser plugin to run this example'
    //web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/TsdoDuPiajm8bmj2lOje"));
    // TODO block form and buttons
    return;
  }
  clientAddress = web3.eth.coinbase;
  netId = await getNetworkId();

  // Given the current ethereum network, assign a base ethersan url.
  switch (netId) {
    case 1: etherscanBaseURL = "https://etherscan.io/tx/";
      break;
    case 42: etherscanBaseURL = "https://kovan.etherscan.io/tx/";
      break;
    case 3: etherscanBaseURL = "https://ropsten.etherscan.io/tx/";
      break;
    case 4: etherscanBaseURL = "https://rinkeby.etherscan.io/tx/";
      break;
    default: etherscanBaseURL = "https://etherscan.io/tx/";
  }
  await fetch("js/networks.json")
  .then((resp) => resp.json())
  .then(function(data){
    networks = data;
  })
  .catch(function(error){
    console.log(error);
  });
  subscribeToOrderbooksWebSockets();
  if(clientAddress == undefined){
    swal({ title: "MetaMask wallet locked.",
           text: 'To start trading please log in to your MataMask wallet.',
           icon: "warning",
           button: true,
           dangerMode: false,
    });
    document.getElementById("client-address").innerHTML = "UNKNOWN";
    // TODO block form and buttons
  }else{
    let clientAddressSubstr = clientAddress.substring(0, 8) +
                              "..." +
                              clientAddress.substring(clientAddress.length-6, clientAddress.length);
    swal("MetaMask wallet connected.", "Address: " + clientAddressSubstr, "success");
    document.getElementById("client-address").innerHTML = clientAddressSubstr;
    web3.eth.getBalance(clientAddress, function(error, balance){
      document.getElementById("eth-balance").innerHTML = web3.fromWei(balance);
    });
    const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
    zeroEx.token.getBalanceAsync(getTokenAddressBySymbol("WETH"), clientAddress).then((balance) => {
      document.getElementById("weth-balance").innerHTML = parseFloat(
        ZeroEx.ZeroEx.toUnitAmount(balance, TOKEN_DECIMALS)).toFixed(DECIMALS_TO_SHOW);
    });
  }
  let tokenSelect1 = document.getElementById("token-select1");
  let tokenSelect2 = document.getElementById("token-select2");
  networks.Symbols.map(tokenSymbol => {
    let selectOption = document.createElement("option");
    selectOption.text = tokenSymbol;
    selectOption.value = tokenSymbol;
    tokenSelect1.add(selectOption);
    selectOption = document.createElement("option");
    selectOption.text = tokenSymbol;
    selectOption.value = tokenSymbol;
    tokenSelect2.add(selectOption);
  });
  loadDropdownMenu();
});

function sortOrderbook(orderbook){
  const sortedAsks = orderbook.asks.sort((orderA, orderB) => {
    const orderRateA = new BigNumber(orderA.takerTokenAmount).div(new BigNumber(orderA.makerTokenAmount));
    const orderRateB = new BigNumber(orderB.takerTokenAmount).div(new BigNumber(orderB.makerTokenAmount));
    return orderRateA.comparedTo(orderRateB);
  });
  const sortedBids = orderbook.bids.sort((orderA, orderB) => {
    const orderRateA = new BigNumber(orderA.makerTokenAmount).div(new BigNumber(orderA.takerTokenAmount));
    const orderRateB = new BigNumber(orderB.makerTokenAmount).div(new BigNumber(orderB.takerTokenAmount));
    return orderRateB.comparedTo(orderRateA);
  });
  sortedBids.map( bidOrder => {
    bidOrder.takerTokenAmount = new BigNumber(bidOrder.takerTokenAmount);
    bidOrder.makerTokenAmount = new BigNumber(bidOrder.makerTokenAmount);
    bidOrder.takerFee = new BigNumber(bidOrder.takerFee);
    bidOrder.makerFee = new BigNumber(bidOrder.makerFee);
    bidOrder.expirationUnixTimestampSec = new BigNumber(bidOrder.expirationUnixTimestampSec);
  });
  sortedAsks.map(askOrder => {
    askOrder.takerTokenAmount = new BigNumber(askOrder.takerTokenAmount);
    askOrder.makerTokenAmount = new BigNumber(askOrder.makerTokenAmount);
    askOrder.takerFee = new BigNumber(askOrder.takerFee);
    askOrder.makerFee = new BigNumber(askOrder.makerFee);
    askOrder.expirationUnixTimestampSec = new BigNumber(askOrder.expirationUnixTimestampSec);
  });
  return { 'asks': sortedAsks, 'bids': sortedBids };
}

const socket = new WebSocket('wss://ws.kovan.radarrelay.com/0x/v0/ws')
socket.addEventListener('message', function (event) {
  data = JSON.parse(event.data)
  if(data.channel == 'orderbook'){
    orderbooks[data.quoteTokenAddress] = sortOrderbook(data.payload);
    console.log('Change detected in orderbook');
  }
});

function subscribeToOrderbooksWebSockets(){
  networks.Symbols.map( tokenSymbol => {
    if (tokenSymbol != "WETH"){
      socket.addEventListener('open', function (event) {
          socket.send(`{
            "type": "subscribe",
            "channel": "orderbook",
            "requestId": 1,
            "payload": {
              "baseTokenAddress": "${getTokenAddressBySymbol('WETH')}",
              "quoteTokenAddress": "${getTokenAddressBySymbol(tokenSymbol)}",
              "snapshot": true,
              "limit": 100
              }
            }`);
      });
    }
  });
}
/*
returns amount to pay given asks or bids orders and amount to pay
parameters:
  * amountToPay -> BigNumber
  * orders -> Array
*/
async function getAmountToReceive(amountToPay, orders){
  let amountToReceive = new BigNumber(0);
  const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
  for(order of orders){
    let takerFilledAmount = await zeroEx.exchange.getFilledTakerAmountAsync(
      ZeroEx.ZeroEx.getOrderHashHex(order));
    let takerFilledAmountCut = takerFilledAmount.div(new BigNumber(10**(TOKEN_DECIMALS - DECIMALS_TO_SHOW)));
    takerFilledAmountCut = new BigNumber(parseInt(takerFilledAmountCut.toNumber()));
    let rate = order.makerTokenAmount.div(order.takerTokenAmount);
    let makerFilledAmount = takerFilledAmount.times(rate);
    let makerFilledAmountCut = makerFilledAmount.div(new BigNumber(10**(TOKEN_DECIMALS - DECIMALS_TO_SHOW)));
    makerFilledAmountCut = new BigNumber(parseInt(makerFilledAmountCut.toNumber()));
    let takerTokenAmountCut = order.takerTokenAmount.div(new BigNumber(10**(TOKEN_DECIMALS - DECIMALS_TO_SHOW)));
    takerTokenAmountCut = new BigNumber(parseInt(takerTokenAmountCut.toNumber())).minus(takerFilledAmountCut);
    let makerTokenAmountCut = order.makerTokenAmount.div(new BigNumber(10**(TOKEN_DECIMALS - DECIMALS_TO_SHOW)));
    makerTokenAmountCut = new BigNumber(parseInt(makerTokenAmountCut.toNumber())).minus(makerFilledAmountCut);;
    if(takerTokenAmountCut.lt(amountToPay)) {
      amountToReceive = amountToReceive.plus(makerTokenAmountCut);
      amountToPay = amountToPay.minus(takerTokenAmountCut);
    } else {
      amountToReceive = amountToReceive.plus(amountToPay.times(rate));
      break;
    }
  }
  return amountToReceive;
}

async function displayAmountToReceiveOrPay(textBox){
  this.takerTokenSymbol = document.getElementById("token-select1").value;
  this.makerTokenSymbol = document.getElementById("token-select2").value;
  if(this.takerTokenSymbol == '0' || this.makerTokenSymbol == '0') return;
  const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
  switch (textBox) {
    case 'amountToPay':
      // Read amount to pay
      let takerTokenAmount = parseFloat(document.getElementById('taker-amount').value);
      // validate amount
      if(takerTokenAmount <= 0 || isNaN(takerTokenAmount)) {
        document.getElementById('maker-amount').value = 0;
        return;
      }
      takerTokenAmount = ZeroEx.ZeroEx.toBaseUnitAmount(new BigNumber(takerTokenAmount), DECIMALS_TO_SHOW);
      let amountToReceive = new BigNumber(0);
      // check if paying with wETH
      if(this.takerTokenSymbol == 'WETH'){
        // Choose an orderbook according to the selected token pairs
        this.orderbook = orderbooks[getTokenAddressBySymbol(this.makerTokenSymbol)];
        console.log(orderbook);

        /*zeroEx.exchange.getOrdersInfoAsync(this.orderbook.bids).then( info => {
          console.log(info);
        });*/
        amountToReceive = await getAmountToReceive(takerTokenAmount, this.orderbook.bids);
      } else {
        // paying with another token receiving wETH
        this.orderbook = orderbooks[getTokenAddressBySymbol(this.takerTokenSymbol)];
        console.log(orderbook)
        amountToReceive = getAmountToReceive(takerTokenAmount, this.orderbook.asks);
      }
      document.getElementById("maker-amount").value = ZeroEx.ZeroEx.toUnitAmount(
        new BigNumber(parseInt(amountToReceive)), DECIMALS_TO_SHOW).toNumber();
      break;
    case "amountToReceive"://Pay with WETH
      document.getElementById("taker-amount").value = document.getElementById("maker-amount").value;
      break;
    default:
      console.error("textbox id not found");
  }
}

async function tokenSelected(tokenList){
  this.tokenSymbol = document.getElementById(tokenList).value;
  this.tokenAddress = getTokenAddressBySymbol(this.tokenSymbol);
  const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });

  switch(tokenList){
    case "token-select1":
      zeroEx.token.getBalanceAsync(this.tokenAddress, clientAddress).then((balance) => {
        document.getElementById("balanceA").innerHTML = parseFloat(ZeroEx.ZeroEx
        .toUnitAmount(balance, TOKEN_DECIMALS)).toFixed(DECIMALS_TO_SHOW);
      });
      // Load token allowence
      zeroEx.token.getProxyAllowanceAsync(this.tokenAddress, clientAddress).then((tokenAllowenceAmount) => {
        if (tokenAllowenceAmount > 0)
          document.getElementById('token-checkbox').checked = true;
        else
          document.getElementById('token-checkbox').checked = false;
        document.getElementById('token-checkbox').disabled = false;
        document.getElementById('loader').hidden = true;
        document.getElementById('token-span').hidden = false;
      });
      if(this.tokenSymbol == "WETH"){
        document.getElementById("tokenBList").children[1].innerHTML = "ZRX";
        document.getElementById("token-select2").value = "ZRX";
        zeroEx.token.getBalanceAsync(getTokenAddressBySymbol("ZRX"), clientAddress).then((balance) => {
          document.getElementById("balanceB").innerHTML = parseFloat(ZeroEx.ZeroEx
          .toUnitAmount(balance, TOKEN_DECIMALS)).toFixed(DECIMALS_TO_SHOW);
        });
      }else{
        document.getElementById("tokenBList").children[1].innerHTML = "WETH";
        document.getElementById("token-select2").value = "WETH";
        zeroEx.token.getBalanceAsync(getTokenAddressBySymbol("WETH"), clientAddress).then((balance) => {
          document.getElementById("balanceB").innerHTML = parseFloat(ZeroEx.ZeroEx
          .toUnitAmount(balance, TOKEN_DECIMALS)).toFixed(DECIMALS_TO_SHOW);
        });
      }
      break;
    case "token-select2":
      zeroEx.token.getBalanceAsync(this.tokenAddress, clientAddress).then((balance) => {
        document.getElementById("balanceB").innerHTML = parseFloat(ZeroEx.ZeroEx
        .toUnitAmount(balance, TOKEN_DECIMALS)).toFixed(DECIMALS_TO_SHOW);
      });
      if (this.tokenSymbol == "WETH"){
        document.getElementById("tokenAList").children[1].innerHTML = "ZRX";
        document.getElementById("token-select1").value = "ZRX";
        zeroEx.token.getBalanceAsync(getTokenAddressBySymbol("ZRX"), clientAddress).then((balance) => {
          document.getElementById("balanceA").innerHTML = parseFloat(ZeroEx.ZeroEx
          .toUnitAmount(balance, 18)).toFixed(6);
        });
        zeroEx.token.getProxyAllowanceAsync(getTokenAddressBySymbol("ZRX"), clientAddress).then((tokenAllowenceAmount) => {
          if (tokenAllowenceAmount > 0)
            document.getElementById('token-checkbox').checked = true;
          else
            document.getElementById('token-checkbox').checked = false;
          document.getElementById('token-checkbox').disabled = false;
          document.getElementById('loader').hidden = true;
          document.getElementById('token-span').hidden = false;
        });
      }else{
        document.getElementById("tokenAList").children[1].innerHTML = "WETH";
        document.getElementById("token-select1").value = "WETH";
        zeroEx.token.getBalanceAsync(getTokenAddressBySymbol("WETH"), clientAddress).then((balance) => {
          document.getElementById("balanceA").innerHTML = parseFloat(ZeroEx.ZeroEx
          .toUnitAmount(balance, 18)).toFixed(6);
        });
        zeroEx.token.getProxyAllowanceAsync(getTokenAddressBySymbol("WETH"), clientAddress).then((tokenAllowenceAmount) => {
          if (tokenAllowenceAmount > 0)
            document.getElementById('token-checkbox').checked = true;
          else
            document.getElementById('token-checkbox').checked = false;
          document.getElementById('token-checkbox').disabled = false;
          document.getElementById('loader').hidden = true;
          document.getElementById('token-span').hidden = false;
        });
      }
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
      link.href = etherscanBaseURL + String(msg);
      link.innerText = msg.substring(0, 8) +
                       "..." +
                       msg.substring(msg.length-6, msg.length);
      swal({
        title: "Transaction accepted.",
        text:  "Waiting transaction to be mined. Transaction id: ",
        icon: "info",
        button: false,
        content: link,
      });
      await zeroEx.awaitTransactionMinedAsync(msg, 1500);
      swal({
        title: tokenSymbol + " enabled for trading.",
        text:  "Transaction id: ",
        icon: "success",
        button: true,
        content: link,
      });
    }
    catch(error){
      console.log(error);
      msg = error;
    }
  } else {
    try{
      msg = await disableTokenTrading(tokenAddress, clientAddress);
      link.href = etherscanBaseURL + String(msg);
      link.innerText = msg.substring(0, 8) +
                       "..." +
                       msg.substring(msg.length-6, msg.length);
      swal({
        title: "Transaction accepted.",
        text:  "Waiting transaction to be mined. Transaction id: ",
        icon: "info",
        button: false,
        content: link,
      });
      await zeroEx.awaitTransactionMinedAsync(msg, 1500);
      swal({
        title: tokenSymbol + " disabled for trading.",
        text:  "Transaction id: ",
        icon: "success",
        button: true,
        content: link,
      });
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
  if (await getTokenAllowence(symbol) > 0)
    document.getElementById('token-checkbox').checked = true;
  else
    document.getElementById('token-checkbox').checked = false;
  document.getElementById('token-checkbox').disabled = false;
  document.getElementById('loader').hidden = true;
  document.getElementById('token-span').hidden = false;
}

async function exchange(){
  this.takerTokenSymbol = document.getElementById("token-select1").value;
  this.makerTokenSymbol = document.getElementById("token-select2").value;
  let cond1 = this.takerTokenSymbol in networks.Kovan || this.takerTokenSymbol in networks.Mainnet;
  let cond2 = this.makerTokenSymbol in networks.Kovan || this.makerTokenSymbol in networks.Mainnet;
  let cond3 = this.makerTokenSymbol != this.takerTokenSymbol;
  let cond4 = "WETH" == this.makerTokenSymbol || "WETH" == this.takerTokenSymbol;
  this.takerAmount = parseFloat(document.getElementById("taker-amount").value);
  this.makerAmount = parseFloat(document.getElementById("maker-amount").value);
  let cond5 = this.takerAmount > 0;
  let cond6 = document.getElementById("token-checkbox").checked;
  this.takerTokenBalance = parseFloat(document.getElementById("balanceA").innerHTML);
  let cond7 = this.takerTokenBalance >= this.takerAmount;
  if(!cond1){ swal("Token " + this.takerTokenSymbol + " not supported."); return;  }
  if(!cond2){ swal("Token " + this.makerTokenSymbol + " not supported."); return;  }
  if(!cond3 || !cond4){ swal("Please select a valid token pairs."); return; }
  if(!cond5){ swal("Please enter a valid amount."); return; }
  if(!cond6){ swal("You need to enable " + this.takerTokenSymbol + " for trading."); return; }
  if(!cond7){ swal("Insuficient funds for " + this.takerTokenSymbol); return; }
  // TODO get a relayer for every tesnets
  // TODO add more relayers
  switch (netId) {
    case 1: this.relayerURL = "https://api.radarrelay.com/0x/v0/";
      break;
    case 42: this.relayerURL = "https://api.kovan.radarrelay.com/0x/v0/";
      break;
    case 3: this.relayerURL = "https://api.radarrelay.com/0x/v0/";
      break;
    case 4: this.relayerURL = "https://api.radarrelay.com/0x/v0/";
      break;
    default: this.relayerURL = "https://api.radarrelay.com/0x/v0/";
  }
  const radarRelay = new RadarRelay(this.relayerURL);
  const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
  if(this.takerTokenSymbol != "WETH") this.tokenA = this.takerTokenSymbol;
  else this.tokenA = this.makerTokenSymbol;
  // Requesting orderbook from RadarRelay
  let orderbookResponse = await radarRelay.getOrderbookAsync(
    getTokenAddressBySymbol(this.tokenA),
    getTokenAddressBySymbol("WETH")
  );
  const sortedOrderbook = sortOrderbook(orderbookResponse);
  const sortedAsks = sortedOrderbook.asks;
  const sortedBids = sortedOrderbook.bids;
  let ordersToFill = [];
  let takerTokenAmount = ZeroEx.ZeroEx.toBaseUnitAmount(new BigNumber(this.takerAmount), 18);
  // Paying with WETH, receiving another token
  if(this.takerTokenSymbol == "WETH"){
    // building batch orders to fill
    // TODO read amount of decimals from contract
    for(bidOrder of sortedBids){
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
      link.href = etherscanBaseURL + String(fillTxHash);
      link.innerText = "See transaction details";
      swal({
        title: "Transaction accepted.",
        text:  "Waiting transaction to be mined.",
        icon: "info",
        button: false,
        content: link,
      });
      const transactionData = await zeroEx.awaitTransactionMinedAsync(fillTxHash);
      let amountReceived = transactionData.logs[2].args.filledMakerTokenAmount;
      let amountPaid = transactionData.logs[2].args.filledTakerTokenAmount;
      swal({
        title: "Transaction confirmed. ",
        text:  `Amount received: ${ZeroEx.ZeroEx.toUnitAmount(amountReceived, TOKEN_DECIMALS)} ${this.makerTokenSymbol}
                Amount paid: ${ZeroEx.ZeroEx.toUnitAmount(amountPaid, TOKEN_DECIMALS)} ${this.takerTokenSymbol}`,
        icon: "success",
        button: true,
        content: link,
      });
      zeroEx.token.getBalanceAsync(getTokenAddressBySymbol(this.makerTokenSymbol), clientAddress).then((balance) => {
        document.getElementById("balanceB").innerHTML = parseFloat(ZeroEx.ZeroEx
        .toUnitAmount(balance,TOKEN_DECIMALS)).toFixed(DECIMALS_TO_SHOW);
      });
      zeroEx.token.getBalanceAsync(getTokenAddressBySymbol(this.takerTokenSymbol), clientAddress).then((balance) => {
        document.getElementById("balanceA").innerHTML = parseFloat(ZeroEx.ZeroEx
        .toUnitAmount(balance, TOKEN_DECIMALS)).toFixed(DECIMALS_TO_SHOW);
      });
    }
    catch(error) {
      swal({
        title: "Something went wrong.",
        text:  error.message,
        icon: "error",
        button: true,
      });
    }
  // Paying with another token, receiving WETH
  }else{
    // building batch orders to fill
    for(askOrder of sortedAsks){
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
      link.href = etherscanBaseURL + String(fillTxHash);
      link.innerText = "See transaction details";
      swal({
        title: "Transaction accepted.",
        text:  "Waiting transaction to be mined.",
        icon: "info",
        button: false,
        content: link,
      });
      const transactionData = await zeroEx.awaitTransactionMinedAsync(fillTxHash);
      let amountReceived = transactionData.logs[2].args.filledMakerTokenAmount;
      let amountPaid = transactionData.logs[2].args.filledTakerTokenAmount;
      swal({
        title: "Transaction confirmed. ",
        text:  `Amount received: ${ZeroEx.ZeroEx.toUnitAmount(amountReceived, TOKEN_DECIMALS)} ${this.makerTokenSymbol}
                Amount paid: ${ZeroEx.ZeroEx.toUnitAmount(amountPaid, TOKEN_DECIMALS)} ${this.takerTokenSymbol}`,
        icon: "success",
        button: true,
        content: link,
      });
      zeroEx.token.getBalanceAsync(getTokenAddressBySymbol(this.makerTokenSymbol), clientAddress).then((balance) => {
        document.getElementById("balanceB").innerHTML = parseFloat(ZeroEx.ZeroEx
        .toUnitAmount(balance, TOKEN_DECIMALS)).toFixed(DECIMALS_TO_SHOW);
      });
      zeroEx.token.getBalanceAsync(getTokenAddressBySymbol(this.takerTokenSymbol), clientAddress).then((balance) => {
        document.getElementById("balanceA").innerHTML = parseFloat(ZeroEx.ZeroEx
        .toUnitAmount(balance, TOKEN_DECIMALS)).toFixed(DECIMALS_TO_SHOW);
      });
    }catch(error) {
      swal({
        title: "Something went wrong.",
        text:  error.message,
        icon: "error",
        button: true,
      });
    }
  }
}

function wrap_ether(amount, weth_address){
  return new Promise(resolve => {
    web3.eth.contract([{
      "constant": false,
      "inputs": [],
      "name": "deposit",
      "outputs": [],
      "payable": true,
      "stateMutability": "payable",
      "type": "function"
    }])
    .at(weth_address).deposit({
      value: amount * (10**18),
      // You can optionally pass in the gas price and gas limit you would like to use
      //gasLimit: 80000,
      //gasPrice: new BigNumber(10**10),
    },(err, res) => {
      if(res != undefined){
        resolve(res);
      }else {
        resolve(err.message);
      }
    });
  });
}

function unwrap_ether(amount, weth_address){
  let value = amount * (10**18);
  return new Promise(resolve => {
    web3.eth.contract([{
      "constant": false,
      "inputs": [{
        "name": "wad",
        "type": "uint256"
      }],
      "name": "withdraw",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }])
    .at(weth_address).withdraw(
      value, {
        // You can optionally pass in the gas price and gas limit you would like to use
        //gasLimit: 80000,
        //gasPrice: new BigNumber(10**10),
      },(err, res) => {
        if(res != undefined){
          resolve(res);
        }else {
          resolve(err.message);
        }
      });
    });
}

async function wrap(){
  let amountToWrap = document.getElementById("amount-to-wrap").value;
  amountToWrap = parseFloat(amountToWrap);
  let ethBalance = await new Promise( (resolve) => {
    web3.eth.getBalance(clientAddress, function(error, balance){
      resolve(web3.fromWei(balance));
    });
  });
  if(ethBalance > amountToWrap && amountToWrap > 0 && ethBalance > 0){
    let msg;
    msg = await wrap_ether(amountToWrap, getTokenAddressBySymbol("WETH"));
    if(String(msg).substring(0,2) != "0x") {
      swal({ title: "Error",
             text: String(msg),
             icon: "error",
             button: true,
             dangerMode: false,
      });
    }else{
      msg = String(msg);
      link.href = etherscanBaseURL + String(msg);
      link.innerText = msg.substring(0, 8) +
                       "..." +
                       msg.substring(msg.length-6, msg.length);
      swal({
        title: "Transaction accepted.",
        text:  "Waiting transaction to be mined. Transaction id: ",
        icon: "info",
        button: false,
        content: link,
      });
      const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
      let message = await zeroEx.awaitTransactionMinedAsync(msg, 1500);
      swal({
        title: "Transaction confirmed. ",
        text:  "Transaction id: ",
        icon: "success",
        button: true,
        content: link,
      });
      // Updating ETH/WETH balances
      web3.eth.getBalance(clientAddress, function(error, balance){
        document.getElementById("eth-balance").innerHTML = parseFloat(web3.fromWei(balance)).toFixed(6);;
      });
      zeroEx.token.getBalanceAsync(getTokenAddressBySymbol("WETH"), clientAddress).then((balance) => {
        document.getElementById("weth-balance").innerHTML = parseFloat(ZeroEx.ZeroEx.toUnitAmount(balance, 18)).toFixed(6);
      });
    }
  }else{
    swal("Insuficient funds/Invalid value.");
  }
}

async function unwrap(){
  let amountToUnWrap = document.getElementById("amount-to-unwrap").value;
  amountToUnWrap = parseFloat(amountToUnWrap);
  const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
  let wethBalance = await zeroEx.token.getBalanceAsync(getTokenAddressBySymbol("WETH"), clientAddress)
  if(wethBalance > amountToUnWrap && amountToUnWrap > 0 && wethBalance > 0){
    let msg;
    msg = await unwrap_ether(amountToUnWrap, getTokenAddressBySymbol("WETH"));
    if(String(msg).substring(0,2) != "0x"){
      swal({ title: "Error",
             text: String(msg),
             icon: "error",
             button: true,
             dangerMode: false,
      });
    }else{
      msg = String(msg);
      link.href = etherscanBaseURL + String(msg);
      link.innerText = msg.substring(0, 8) +
                       "..." +
                       msg.substring(msg.length-6, msg.length);
      swal({
        title: "Transaction accepted.",
        text:  "Waiting transaction to be mined. Transaction id: ",
        icon: "info",
        button: false,
        content: link,
      });
      let message = await zeroEx.awaitTransactionMinedAsync(msg, 1500);
      swal({
        title: "Transaction confirmed. ",
        text:  "Transaction id: ",
        icon: "success",
        button: true,
        content: link,
      });
      // Updating ETH/WETH balances
      web3.eth.getBalance(clientAddress, function(error, balance){
        document.getElementById("eth-balance").innerHTML = parseFloat(web3.fromWei(balance)).toFixed(6);;
      });
      zeroEx.token.getBalanceAsync(getTokenAddressBySymbol("WETH"), clientAddress).then((balance) => {
        document.getElementById("weth-balance").innerHTML = parseFloat(ZeroEx.ZeroEx.toUnitAmount(balance, 18)).toFixed(6);
      });
    }
  }else{
    swal("Insuficient funds/Invalid value.");
  }
}
