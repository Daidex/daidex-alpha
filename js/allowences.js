
if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

async function modifyAllowence(symbol){
  var checkedValue = document.querySelector('.messageCheckbox').checked;
  let account = await get_user_account();
  let netId = await getNetwork();
  let tokenAddress = await getTokenAddressByNetId(symbol, netId);
  if (checkedValue == true){
    let txId = await enableTokenTrading(tokenAddress, account, netId);
    document.getElementById(symbol.toLowerCase() + '-msg').innerHTML = txId;
    console.log(txId);
  } else {
    let txId = await disableTokenTrading(tokenAddress, account, netId);
    document.getElementById(symbol.toLowerCase() + '-msg').innerHTML = txId;
    console.log(txId);
  }
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
  const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
  const disableTx = await zeroEx.token.setProxyAllowanceAsync(
    tokenAddress,
    accountAddress,
    new BigNumber.BigNumber("0"),
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
    default:
      return undefined;
  }
}

async function getTokenAllowence(){
  let netId = await getNetwork();
  const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
  let balance = await zeroEx.token.getProxyAllowanceAsync(
    await getTokenAddressByNetId("WETH", netId),
    await get_user_account(),
  );
  return balance.toNumber();
}

console.log(getTokenAllowence());
