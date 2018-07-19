function get_contract_symbol(contract_abi, contract_address){
  if(contract_abi == undefined){
    console.log("No contract abi provided for: " + contract_address);
    return undefined;
  }
  let contract_instance = web3.eth.contract(contract_abi).at(contract_address);
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
          if ('name' in contract_instance){
            contract_instance.name((error, name)=>{
              resolve(name);
            });
          }else{
            resolve(contract_instance.address);
          }
        }
      });
    }else{
      if ('name' in contract_instance){
        contract_instance.name((error, name)=>{
          resolve(name);
        });
      }else{
        console.log()
        resolve(contract_instance.address);
      }
    }
  });
}

function wrap_ether(amount, weth_address){
  return new Promise(resolve => {
    web3.eth.contract([{
      "constant": false,
      "inputs": [],
      "name": "deposit",
      "outputs": [],
      "payable": true,
      "stateMutability": "payable",
      "type": "function"
    }])
    .at(weth_address).deposit({
      value: amount * (10**18),
      // You can optionally pass in the gas price and gas limit you would like to use
      //gasLimit: 80000,
      //gasPrice: new BigNumber(10**10),
    },(err, res) => {
      resolve(res);
      console.log(res) // Transaction id
    });
  });
}

function unwrap_ether(amount, weth_address){
  let value = amount * (10**18);
  return new Promise(resolve => {
    web3.eth.contract([{
      "constant": false,
      "inputs": [{
        "name": "wad",
        "type": "uint256"
      }],
      "name": "withdraw",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }])
    .at(weth_address).withdraw(
      value, {
        // You can optionally pass in the gas price and gas limit you would like to use
        //gasLimit: 80000,
        //gasPrice: new BigNumber(10**10),
      },
      (err, res) => {
        resolve(res);
        console.log(res) // Transaction id
      });
    });
}

function get_eth_network(){
  return new Promise(resolve => {
    web3.version.getNetwork(function(err, netId){
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
          network = "unknown"
          break;
      }
      resolve(network);
    });
  });
}

function get_user_account(){
  return new Promise(resolve =>{
    web3.eth.getAccounts((error, accounts) => {
      resolve(accounts[0]);
    });
  });
}

function get_eth_balance(account){
  return new Promise(resolve =>{
    web3.eth.getBalance(account, function(error, balance){
      resolve(web3.fromWei(balance.toNumber()));
    });
  });
}

function get_token_balance_by_web3(contract_abi, contract_address, account_address){
  if(contract_abi == undefined){
    return undefined;
  }
  let contract_instance = web3.eth.contract(contract_abi).at(contract_address);
  return new Promise(resolve => {
    contract_instance.balanceOf(account_address, (error, result)=>{
      //var tokenBalance = result.c[0] / Math.pow(10, 4);
      resolve(result.c[0]);
    });
  });
}

function getTokenSymbolByContractInstance(contract_instance){
  if(contract_instance == undefined){
    return undefined;
  }
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
