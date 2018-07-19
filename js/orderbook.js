let WETH_CONTRACT_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

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
    web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/TsdoDuPiajm8bmj2lOje"));
  }

  let currentNetId = await new Promise(resolve =>{
    web3.version.getNetwork(function(err, netId){
      resolve(parseInt(netId));
    });
  });
  const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: currentNetId });
  let netName = prompt("Please enter ethereum network", "mainnet");
  netName = netName.toLowerCase();
  console.log(netName);
  let metamasknet = await get_eth_network();
  metamasknet = metamasknet.toLowerCase();
  switch (netName) {
    case "mainnet":
      if(metamasknet != "mainnet"){
        requestChangeMetaMaskNet("mainnet.");
        return;
      }
      break;
    case "kovan":
      if(metamasknet != "kovan"){
        requestChangeMetaMaskNet("kovan.");
        return;
      }
      radarrelayBaseURL = "https://api.kovan.radarrelay.com/0x/v0/";
      etherscanBaseURL = "http://api-kovan.etherscan.io/api";
      WETH_CONTRACT_ADDRESS = "0xd0a1e359811322d97991e03f863a0c30c2cf029c";
      break;
  }

  function requestChangeMetaMaskNet(networkToChange){
    alert("Please set MataMask Network to " + networkToChange);
    document.getElementById("msg").innerHTML = "Please set MataMask Network to " + networkToChange;
  }

  async function exec_async(){
    let rr_contract_addresses = await get_rr_contract_addresses();
    console.log(rr_contract_addresses.length);
    let i = 0;
    let items = '';
    for (let contract_address of rr_contract_addresses){
      console.log(i++);
      var orderbook = await get_rr_orderbook(WETH_CONTRACT_ADDRESS, contract_address);
      const item_init = '<div class="grid-item">';
      const item_end = '</div>';
      let num_bids = "Bids: " + orderbook.bids.length + " ";
      let num_asks = "Asks: " + orderbook.asks.length + "<br>";

      let contract_abi = await get_contract_abi(contract_address);
      let token_symbol =  await get_contract_symbol(contract_abi, contract_address);
      if(token_symbol == undefined){
        token_symbol = await zeroEx.tokenRegistry.getTokenIfExistsAsync(contract_address);
        if(token_symbol == undefined){
          market = " unknown / WETH" + "<br>";
        } else {
          market = token_symbol.symbol + " / WETH" + "<br>";
        }
      }else {
        market = token_symbol + " / WETH" + "<br>";
      }
      items += item_init + market + num_bids + num_asks  + item_end;
      document.getElementById("orders").innerHTML = items;
    }
  }

  exec_async();

});
