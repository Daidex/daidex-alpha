
if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

async function modifyAllowence(symbol){
  var checkedValue = document.getElementById(symbol.toLowerCase() + '-checkbox').checked;
  document.getElementById(symbol.toLowerCase() + '-checkbox').disabled = true;
  document.getElementById(symbol.toLowerCase() + '-loader').hidden = false;
  document.getElementById(symbol.toLowerCase() + '-span').hidden = true;
  let account = await get_user_account();
  let netId = await getNetwork();
  let tokenAddress = await getTokenAddressByNetId(symbol, netId);
  const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
  let msg;// msg can be an error if transaction rejected or tx hash if success
  if (checkedValue == true){
    try{
      msg = await enableTokenTrading(tokenAddress, account, netId);
      await zeroEx.awaitTransactionMinedAsync(msg, 1500);
    }
    catch(error){
      console.log(error);
      msg = error;
    }
  } else {
    try{
      msg = await disableTokenTrading(tokenAddress, account, netId);
      await zeroEx.awaitTransactionMinedAsync(msg, 1500);
    }catch(error){
      msg = error;
    }
  }
  document.getElementById(symbol.toLowerCase() + '-msg').innerHTML = msg;
  loadTokenAllowences(symbol);
}

async function enableTokenTrading(tokenAddress, accountAddress, netId){
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

async function disableTokenTrading(tokenAddress, accountAddress, netId){
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

async function loadNetworksFile(){
  let networks;
  await fetch("networks.json")
  .then((resp) => resp.json())
  .then(function(data){
    networks = data;
  })
  .catch(function(error){
    console.log(error);
  });
  return networks;
}

function getNetwork(){
  return new Promise(resolve => {
    web3.version.getNetwork((error, netId) => {
      resolve(parseInt(netId));
    });
  });
}

// Tokens have different addresses depending on the network
async function getTokenAddressByNetId(symbol, networkId){
  let networks = await loadNetworksFile();
  switch (symbol) {
    case "WETH":
      switch (networkId) {
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
      switch (networkId) {
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
      switch (networkId) {
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
      switch (networkId) {
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
      switch (networkId) {
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
      switch (networkId) {
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

async function getTokenAllowence(symbol){
  let netId = await getNetwork();
  const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
  let balance = await zeroEx.token.getProxyAllowanceAsync(
    await getTokenAddressByNetId(symbol, netId),
    await get_user_account(),
  );
  return balance.toNumber();
}

async function loadTokenAllowences(symbol){
  if (await getTokenAllowence(symbol) > 0){
    document.getElementById(symbol.toLowerCase() + '-checkbox').checked = true;
  }else{
    document.getElementById(symbol.toLowerCase() + '-checkbox').checked = false;
  }
  document.getElementById(symbol.toLowerCase() + '-checkbox').disabled = false;
  document.getElementById(symbol.toLowerCase() + '-loader').hidden = true;
  document.getElementById(symbol.toLowerCase() + '-span').hidden = false;
}

loadTokenAllowences("WETH");
loadTokenAllowences("ZRX");
loadTokenAllowences("DAI");
loadTokenAllowences("DGD");
loadTokenAllowences("MKR");
loadTokenAllowences("REP");
