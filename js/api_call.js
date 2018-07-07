const etherscanBaseURL = "https://api.etherscan.io/api";
const radarrelayBaseURL = "https://api.radarrelay.com/0x/v0/";
const etherscan_key = "HH2UBH51E51FKE1E16VP8E741X7G47NY";
const WETH_CONTRACT_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

// Checking if Web3 has been injected by the browser (Mist/MetaMask)
if (typeof web3 !== 'undefined') {
  // Use Mist/MetaMask's provider
  web3 = new Web3(web3.currentProvider);
  document.getElementById('meta-mask-required').innerHTML = 'Metamask plugin detected'
} else {
  document.getElementById('meta-mask-required').innerHTML = 'You need <a href="https://metamask.io/">MetaMask</a> browser plugin to run this example'
  web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/TsdoDuPiajm8bmj2lOje"));
}

async function get_erc20_instance(contract_address){
  let contract_instance;
  let params = { module: 'contract',
                 action: 'getabi',
                 address: WETH_CONTRACT_ADDRESS,
                 apikey: etherscan_key
               }
  let url = new URL(etherscanBaseURL);
  url.search = new URLSearchParams(params);
  await fetch(url)
  .then((resp) => resp.json())
  .then(function(data) {
    if (data.status == 1){
      var contract_abi = JSON.parse(data.result);
      contract_instance = web3.eth.contract(contract_abi).at(contract_address);
    }
  })
  .catch(function(error){
    console.log(error);
  });
  return contract_instance;
}

async function get_rr_contract_addresses(){
  let rr_contract_addresses = [];
  rr_contract_addresses.push(WETH_CONTRACT_ADDRESS);
  await fetch(radarrelayBaseURL + 'token_pairs')
  .then((resp) => resp.json())
  .then(function(token_pairs) {
    for(let i = token_pairs.length / 2; i < token_pairs.length; i++){
      rr_contract_addresses.push(token_pairs[i].tokenB.address);
    }
  })
  .catch(function(error) {
    console.log(error);
  });
  return rr_contract_addresses;
}

async function get_erc20_balance(contract_address, account_address){
  let balance;
  let params = { module: 'account',
                 action: 'tokenbalance',
                 contractaddress: contract_address,
                 address: account_address,
                 tag: 'latest',
                 apikey: etherscan_key
               }
  let url = new URL(etherscanBaseURL);
  url.search = new URLSearchParams(params);
  await fetch(url)
  .then((resp) => resp.json())
  .then(function(data) {
    if (data.status == 1){
      balance = parseInt(data.result) * Math.pow(10,-18);
    }
  })
  .catch(function(error){
    console.log(error);
  });
  return balance;
}

function get_erc20_symbol(contract_instance){
  return new Promise(resolve => {
    if ('symbol' in contract_instance){
      contract_instance.symbol((error, symbol)=>{
        if(symbol != null){
          if (symbol.slice(0,8) == "0x444149"){
            token_symbol = "DAI";
          }else{
            if (symbol.slice(0,8) == "0x4d4b52"){
              toke_symbol = "MKR";
            }else{
              token_symbol = symbol;
            }
          }
          resolve(token_symbol);
        }else{
          console.log(contract_instance);
          resolve(contract_instance.address + "AQUI");
        }
      });
    }else{
      console.log(contract_instance);
      resolve(contract_instance.address);
    }
  });
}

function get_erc20_balance_by_web3(contract_instance, account_address){
  return new Promise(resolve => {
    contract_instance.balanceOf(account_address, (error, result)=>{
      //var tokenBalance = result.c[0] / Math.pow(10, 4);
      resolve(result.c[0]);
    });
  });
}

function get_user_address(){
  return new Promise(resolve => {
    web3.eth.getAccounts(function(error, accounts) {
        account0 = accounts[0];
        document.getElementById('account').innerHTML = "Account: " + account0;
        resolve(account0);
    });
  });
}

async function exec_async1(){
  let balances_list = "<ul>";
  let account = await get_user_address();
  let rr_contract_addresses = await get_rr_contract_addresses();
  let amount_balances = rr_contract_addresses.length;
  let i = 0;
  for(let contract_address of rr_contract_addresses){
    let balance = await get_erc20_balance(contract_address, account);
    let contract_instance = await get_erc20_instance(contract_address);
    let symbol = await get_erc20_symbol(contract_instance);
    balances_list += "<li>" + balance + " " + symbol +"</li>";
    document.getElementById("balances_by_ethscan").innerHTML = balances_list;
    document.getElementById("balances-ethscan-loaded").innerHTML = "Balances loaded: " + i++ + "/" + amount_balances;
  }
}

async function exec_async2(){
  let balances_list = "<ul>";
  let account = await get_user_address();
  let rr_contract_addresses = await get_rr_contract_addresses();
  let amount_balances = rr_contract_addresses.length;
  let i = 0;
  for(let contract_address of rr_contract_addresses){
    let contract_instance = await get_erc20_instance(contract_address);
    let balance = await get_erc20_balance_by_web3(contract_instance, account);
    let symbol = await get_erc20_symbol(contract_instance);
    balances_list += "<li>" + balance + " " + symbol +"</li>";
    document.getElementById("balances_by_web3").innerHTML = balances_list;
    document.getElementById("balances-web3-loaded").innerHTML = "Balances loaded: " + i++ + "/" + amount_balances;
  }
}

exec_async1();
exec_async2();
