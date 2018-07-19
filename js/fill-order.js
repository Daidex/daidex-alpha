window.addEventListener('load', async function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    // Use Mist/MetaMask's provider
    web3 = new Web3(web3.currentProvider);
    document.getElementById('meta-mask-required').innerHTML = 'Metamask plugin detected';
  } else {
    console.log('No web3? You should consider trying MetaMask!')
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    document.getElementById('meta-mask-required').innerHTML = 'You need <a href="https://metamask.io/">MetaMask</a> browser plugin to run this example'
    //web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/TsdoDuPiajm8bmj2lOje"));
    return;
  }

  let account = await get_user_account();
  document.getElementById('account').innerHTML = "Account: " + account;

  let networkName = get_eth_network().then((netName) => {
    networkName = netName;
    document.getElementById('network').innerHTML = "Network: " + networkName;
  });

  let networkId = await new Promise(resolve =>{
    web3.version.getNetwork((err, netId) => {
      resolve(parseInt(netId));
    });
  });

  let networks;
  let ZRX_ADDRESS;
  let WETH_ADDRESS;

  await fetch("networks.json")
  .then((resp) => resp.json())
  .then(function(data){
    networks = data;
  })
  .catch(function(error){
    console.log(error);
  });

  switch (networkId) {
    case 1:
      ZRX_ADDRESS = networks.Mainnet.ZRX;
      WETH_ADDRESS = networks.Mainnet.WETH;
      break;
    case 42:
      ZRX_ADDRESS = networks.Kovan.ZRX;
      WETH_ADDRESS = networks.Kovan.WETH;
      radarrelayBaseURL = "https://api.kovan.radarrelay.com/0x/v0/";
      break;
    default:
  }
  let orderbookResponse = await get_rr_orderbook(ZRX_ADDRESS, WETH_ADDRESS);
  console.log(orderbookResponse);

  const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: networkId });

  const sortedBids = orderbookResponse.bids.sort((orderA, orderB) => {
    const orderRateA = new BigNumber(orderA.makerTokenAmount).div(new BigNumber(orderA.takerTokenAmount));
    const orderRateB = new BigNumber(orderB.makerTokenAmount).div(new BigNumber(orderB.takerTokenAmount));
    return orderRateB.comparedTo(orderRateA);
  });

  // Calculate and print out the WETH/ZRX exchange rate for each order
  const rates = sortedBids.map(order => {
      const rate = new BigNumber(order.makerTokenAmount).div(new BigNumber(order.takerTokenAmount));
      return rate.toString() + ' WETH/ZRX';
  });
  console.log(rates);

  // Get token information
  const wethTokenInfo = await zeroEx.tokenRegistry.getTokenBySymbolIfExistsAsync('WETH');
  const zrxTokenInfo = await zeroEx.tokenRegistry.getTokenBySymbolIfExistsAsync('ZRX');

  // Get balances before the fill
  const zrxBalanceBeforeFill = await zeroEx.token.getBalanceAsync(ZRX_ADDRESS, account);
  const wethBalanceBeforeFill = await zeroEx.token.getBalanceAsync(WETH_ADDRESS, account);
  console.log('ZRX Before: ' + ZeroEx.ZeroEx.toUnitAmount(zrxBalanceBeforeFill, zrxTokenInfo.decimals).toString());
  console.log('WETH Before: ' + ZeroEx.ZeroEx.toUnitAmount(wethBalanceBeforeFill, wethTokenInfo.decimals).toString());

  // Completely fill the best bid
  const bidToFill = sortedBids[0];
  console.log(bidToFill);
  console.log(new BigNumber(bidToFill.takerTokenAmount));
  //var amount = new BigNumber.BigNumber(bidToFill.takerTokenAmount);
  var amount = BigNumber(String(bidToFill.takerTokenAmount));
  //console.log(amount.);
  const fillTxHash = await zeroEx.exchange.fillOrderAsync(bidToFill, BigNumber( new BigNumber(amount)), true, account);
  await zeroEx.awaitTransactionMinedAsync(fillTxHash);

  /*
  // Get balances after the fill
  const zrxBalanceAfterFill = await zeroEx.token.getBalanceAsync(ZRX_ADDRESS, zrxOwnerAddress);
  const wethBalanceAfterFill = await zeroEx.token.getBalanceAsync(WETH_ADDRESS, zrxOwnerAddress);
  console.log('ZRX After: ' + ZeroEx.toUnitAmount(zrxBalanceAfterFill, zrxTokenInfo.decimals).toString());
  console.log('WETH After: ' + ZeroEx.toUnitAmount(wethBalanceAfterFill, wethTokenInfo.decimals).toString());

  */
/*
  // Order will be valid for 24 hours
  var duration = 60 * 60 * 24;

  var order = {
    // The default web3 account address
    maker: account,
    // Anyone may fill the order
    taker: "0x0000000000000000000000000000000000000000",
    // The ZRX token contract on mainnet
    makerTokenAddress: "0xe41d2489571d322189246dafa5ebde1f4699f498",
    // The WETH token contract on mainnet
    takerTokenAddress: "0x2956356cd2a2bf3202f771f50d3d14a367b48070",
    // A BigNumber objecct of 1000 ZRX. The base unit of ZRX has 18
    // decimal places, the number here is 10^18 bigger than the
    // base unit.
    makerTokenAmount: new BigNumber("1000000000000000000000"),
    // A BigNumber objecct of 0.7 WETH. The base unit of WETH has
    // 18 decimal places, the number here is 10^18 bigger than the
    // base unit.
    takerTokenAmount: new BigNumber("700000000000000000"),
    // Add the duration (above) to the current time to get the unix
    // timestamp
    expirationUnixTimestampSec: parseInt(
      (new Date().getTime()/1000) + duration).toString(),
    // We need a random salt to distinguish different orders made by
    // the same user for the same quantities of the same tokens.
    salt: ZeroEx.ZeroEx.generatePseudoRandomSalt()
  }

  order.exchangeContractAddress = zeroEx.exchange.getContractAddress();

  async function exec_async(){
    let order_fees = get_rr_order_fees(order);
    console.log(order_fees);
  }

  exec_async();
  */
});
