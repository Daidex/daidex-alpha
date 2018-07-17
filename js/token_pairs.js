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
  
  const WETH_CONTRACT ={
    address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    symbol: "WETH"
  }
  const DAI_CONTRACT ={
    address: "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359",
    symbol: "DAI"
  }

  async function exec_async1(){
    let rr_token_pairs = await get_rr_token_pairs(WETH_CONTRACT.address);
    let contract_abis = [];
    let markets_list = "";
    for(var token_pair of rr_token_pairs){
      if (token_pair.tokenA.address == WETH_CONTRACT.address){
        var contract_abi = await get_contract_abi(token_pair.tokenB.address);
        var token_symbol = await get_contract_symbol(contract_abi, token_pair.tokenB.address);
        markets_list += "<li>" + token_symbol + " / " + WETH_CONTRACT.symbol + " (address: " + token_pair.tokenB.address + ")</li><br>";
        document.getElementById("weth-markets-list").innerHTML = markets_list;
      }
    }
  }

  async function exec_async2(){
    let rr_token_pairs = await get_rr_token_pairs(DAI_CONTRACT.address);
    let contract_abis = [];
    let markets_list = "";
    for(var token_pair of rr_token_pairs){
      if (token_pair.tokenA.address == DAI_CONTRACT.address){
        var contract_abi = await get_contract_abi(token_pair.tokenB.address);
        var token_symbol = await get_contract_symbol(contract_abi, token_pair.tokenB.address);
        markets_list += "<li>" + token_symbol + " / " + DAI_CONTRACT.symbol + " (address: " + token_pair.tokenB.address + ")</li><br>";
        document.getElementById("dai-markets-list").innerHTML = markets_list;
      }
    }
  }

  exec_async1();
  exec_async2();
});
