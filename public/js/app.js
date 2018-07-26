// Checking if Web3 has been injected by the browser (Mist/MetaMask)
if (typeof web3 !== 'undefined') {
  // Use Mist/MetaMask's provider
  web3 = new Web3(web3.currentProvider);
  document.getElementById('meta-mask-required').innerHTML = 'Metamask plugin detected'
} else {
  document.getElementById('meta-mask-required').innerHTML = 'You need <a href="https://metamask.io/">MetaMask</a> browser plugin to run this example'
  web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/TsdoDuPiajm8bmj2lOje"));
}

document.getElementById('web3-version').innerHTML = "Web3 version: " + web3.version.api;

// Now you can start your app & access web3 freely:
web3.version.getNetwork(function(err, netId){
  var network = ""
  switch (netId) {
    case "1":
      network = "Mainnet";
      break;
    case "2":
      network = "Morden(Deprecated)";
      break;
    case "3":
      network = "Ropsten";
      break;
    case "4":
      network = "Rinkeby";
      break;
    case "42":
      network = "Kovan";
      break;
    default:
      console.log('This is an unknown network.');
      network = "unknown"
  }
  document.getElementById('network').innerHTML = "Network: " + network;
})

var account0 = web3.eth.getAccounts(function(error, accounts) {
    account0 = accounts[0];
    document.getElementById('account').innerHTML = "Account: " + account0;
});

web3.eth.getCoinbase(function(error, coinbase) {
  document.getElementById('coinbase').innerHTML = "Coinbase: " + coinbase;
});

document.getElementById('web3-provider').innerHTML = "Current Web3 provider: " + web3.currentProvider.__proto__.constructor.name

document.getElementById('is-connected').innerHTML = "Is connected: " + web3.isConnected();;

web3.eth.getGasPrice(function(error, gasPrice){
    document.getElementById('current-gas-price').innerHTML = "Gas price: " + gasPrice.toString(10);
});

function getBalance(){
  web3.eth.getBalance(account0, function(error, balance){
    document.getElementById('balance').innerHTML = "Balances: " + web3.fromWei(balance.toNumber()) + " ETH";
  });
}

const etherscanBaseURL = "https://api.etherscan.io/api";
const WETH_CONTRACT_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const DAI_CONTRACT_ADDRESS = "0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359";
const MANA_CONTRACT_ADDRESS = "0x0f5d2fb29fb7d3cfee444a200298f468908cc942";
const BAT_CONTRACT_ADDRESS = "0x0d8775f648430679a709e98d2b0cb6250d2887ef";

function getErc20Balance(contractAddress, ethAddress, componentId){
  $.getJSON(
    etherscanBaseURL + '?module=contract&action=getabi&address=' + contractAddress,
    function(data){
      var contractABI = JSON.parse(data.result);
      if (contractABI != ''){
        var tokenContract = web3.eth.contract(contractABI);
        var contractInstance = tokenContract.at(contractAddress);
        var tokenBalance = contractInstance.balanceOf(ethAddress, (error, result)=>{
          var decimal = contractInstance.decimals((error, decimals)=>{
            decimal = decimals.c[0];
            var tokenBalance = result.c[0] / Math.pow(10, 4);
            if (result.c.length == 2){
                tokenBalance += result.c[1] / Math.pow(10, decimals);
            }
            var tokenSymbol = contractInstance.symbol((error, symbol)=>{
              if (symbol.slice(0,2) == "0x"){
                tokenSymbol = hex_to_ascii(symbol.slice(2));
              }else{
                tokenSymbol = symbol;
              }
              if (tokenSymbol == "WETH" && result.e[0]==15){
                tokenBalance = tokenBalance = result.c[0] / Math.pow(10, decimals);
              }
              document.getElementById(componentId).innerHTML = "Balances: " + tokenBalance + " " + tokenSymbol;
            });
          });
        });
      }else {
        document.getElementById(componentId).innerHTML = "ERROR";
      }
  });
}

function hex_to_ascii(str1){
  var hex  = str1.toString();
  var str = '';
  for (var n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
}
