let etherscanBaseURL = "https://api.etherscan.io/api";
const etherscan_key = "HH2UBH51E51FKE1E16VP8E741X7G47NY";

async function get_contract_abi(contract_address){
  let contract_abi;
  let params = { module: 'contract',
                 action: 'getabi',
                 address: contract_address,
                 apikey: etherscan_key
               }
  let url = new URL(etherscanBaseURL);
  url.search = new URLSearchParams(params);
  await fetch(url)
  .then((resp) => resp.json())
  .then(function(data) {
    if (data.status == 1){
      contract_abi = JSON.parse(data.result);
    }
    else{
      console.log(data.result);
    }
  })
  .catch(function(error){
    console.log(error);
  });
  return contract_abi;
}

async function get_token_balance_by_etherscan(contract_address, account_address){
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

//This method requires web3 injection
async function get_contract_instance(contract_address){
  let contract_instance;
  let params = { module: 'contract',
                 action: 'getabi',
                 address: contract_address,
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
