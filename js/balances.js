window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    // Use the browser's ethereum provider
    var provider = web3.currentProvider;
    document.getElementById('meta-mask-required').innerHTML = 'Metamask plugin detected';

  } else {
    console.log('No web3? You should consider trying MetaMask!');
    web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/TsdoDuPiajm8bmj2lOje"));
    document.getElementById('meta-mask-required').innerHTML = 'You need <a href="https://metamask.io/">MetaMask</a> browser plugin to run this example';
  }

  let account;
  let rr_contract_addresses;
  let amount_balances;

  async function setup(){
    account = await get_user_account();
    document.getElementById('account').innerHTML = "Account: " + account;
    rr_contract_addresses = await get_rr_contract_addresses();
    amount_balances = rr_contract_addresses.length;
  }

  async function load_symbols(){
    let balances_list = "";
    var i = 0;
    for(let contract_address of rr_contract_addresses){
      let contract_instance = await get_contract_instance(contract_address);
      let symbol = await getTokenSymbolByContractInstance(contract_instance);
      balances_list += "<li>" + symbol +"</li>";
      document.getElementById("symbols_list").innerHTML = balances_list;
      document.getElementById("symbols-loaded").innerHTML = "Loaded: " + i++ + "/" + amount_balances;
    }
  }

  async function balances_by_ethscan(){
    let balances_list = "";
    var i = 0;
    for(let contract_address of rr_contract_addresses){
      var balance = await get_token_balance_by_etherscan(contract_address, account);
      var contract_abi = await get_contract_abi(contract_address);
      var symbol = await get_contract_symbol(contract_abi, contract_address);
      balances_list += "<li>" + balance + "</li>";
      document.getElementById("balances_by_ethscan").innerHTML = balances_list;
      document.getElementById("balances-ethscan-loaded").innerHTML = "Loaded: " + i++ + "/" + amount_balances;
    }
  }

  async function balances_by_web3(){
    let balances_list = "";
    var i = 0;
    for(let contract_address of rr_contract_addresses){
      var contract_abi = await get_contract_abi(contract_address);
      var balance = await get_token_balance_by_web3(contract_abi, contract_address, account);
      balances_list += "<li>" + balance + "</li>";
      document.getElementById("balances_by_web3").innerHTML = balances_list;
      document.getElementById("balances-web3-loaded").innerHTML = "Loaded: " + i++ + "/" + amount_balances;
    }
  }

  const KOVAN_NETWORK_ID = 42;
  const MAIN_NETWORK_ID = 1;

  // Initialize 0x.js with the web3 current provider and provide it the network
  const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: MAIN_NETWORK_ID });
  async function balances_by_0x(){
    let balances_list = "";
    let i = 0;
    for(let contract_address of rr_contract_addresses){
      let balance = await zeroEx.token.getBalanceAsync(contract_address, account);
      balances_list += "<li>" + balance + "</li>";
      document.getElementById("balances_by_0x").innerHTML = balances_list;
      document.getElementById("balances-0x-loaded").innerHTML = "Loaded: " + i++ + "/" + amount_balances;
    }
  }

  async function general(){
    await setup();
    load_symbols();
    balances_by_ethscan();
    balances_by_web3();
    balances_by_0x();
  }

  general();
});
