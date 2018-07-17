window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    // Use Mist/MetaMask's provider
    web3 = new Web3(web3.currentProvider);
    document.getElementById('meta-mask-required').innerHTML = 'Metamask plugin detected';
  } else {
    console.log('No web3? You should consider trying MetaMask!')
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    document.getElementById('meta-mask-required').innerHTML = 'You need <a href="https://metamask.io/">MetaMask</a> browser plugin to run this example'
    web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/TsdoDuPiajm8bmj2lOje"));
  }
  var account0 = web3.eth.getAccounts(function(error, accounts) {
      account0 = accounts[0];
      document.getElementById('account').innerHTML = "Account: " + account0;
  });
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
  });
  
  // Order will be valid for 24 hours
  var duration = 60 * 60 * 24;

  var order = {
    // The default web3 account address
    maker: web3.eth.accounts[0],
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
  const KOVAN_NETWORK_ID = 42;
  const MAIN_NETWORK_ID = 1;

  // Initialize 0x.js with the web3 current provider and provide it the network
  const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: MAIN_NETWORK_ID });
  order.exchangeContractAddress = zeroEx.exchange.getContractAddress();

  async function exec_async(){
    let order_fees = get_rr_order_fees(order);
    console.log(order_fees);
  }

  exec_async();
});
