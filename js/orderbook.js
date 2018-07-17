const WETH_CONTRACT_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

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

  async function exec_async(){
    let rr_contract_addresses = await get_rr_contract_addresses();
    console.log(rr_contract_addresses.length);
    let i = 0;
    let items = '';
    for (let contract_address of rr_contract_addresses){
      console.log(i++);
      var order = await get_rr_orderbook(WETH_CONTRACT_ADDRESS, contract_address);
      const item_init = '<div class="grid-item">';
      const item_end = '</div>';
      let num_bids = "Bids: " + order.bids.length + " ";
      let num_asks = "Asks: " + order.asks.length + "<br>";
      let contract_abi = await get_contract_abi(contract_address);
      let contract_symbol =  await get_contract_symbol(contract_abi, contract_address);
      let market = contract_symbol + " / WETH" + "<br>";
      items += item_init + market + num_bids + num_asks  + item_end;
      document.getElementById("orders").innerHTML = items;
    }
  }

  exec_async();

})
