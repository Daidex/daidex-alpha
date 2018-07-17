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

  const MAINNET_CONTRACT_ADDRESS = "0x12459C951127e0c374FF9105DdA097662A027093";
  const ROPSTEN_CONTRACT_ADDRESS = "0x479CC461fEcd078F766eCc58533D6F69580CF3AC";
  const KOVAN_CONTRACT_ADDRESS = "0x90fe2af704b34e0224bf2299c838e04d4dcf1364";
  const RINKEBY_CONTRACT_ADDRESS = "0x1D16EF40FAC01cEC8aDAC2AC49427b9384192C05";
  const KOVAN_NETWORK_ID = 42;
  const MAIN_NETWORK_ID = 1;
  const WETH_MAIN ={
    address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    symbol: "WETH"
  }
  const WETH_KOVAN ={
    address: "0xd0A1E359811322d97991E03f863a0C30C2cF029C",
    symbol: "WETH"
  }

  // Initialize 0x.js with the web3 current provider and provide it the network
  const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: MAIN_NETWORK_ID });
  const exchangeContractAddress = zeroEx.exchange.getContractAddress();
  
  async function exec_async(){
    //let token_pairs = await get_ercdex_token_pairs(KOVAN_NETWORK_ID);
    //console.log(token_pairs);
    let orders = await get_ercdex_orders(KOVAN_NETWORK_ID, "", "");
    console.log(orders);
  }
  exec_async();


});