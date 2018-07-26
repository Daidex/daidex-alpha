let account, network, balance, weth_balance;

const kovan = {
  weth: {
    address: "0xd0a1e359811322d97991e03f863a0c30c2cf029c",
    symbol: "WETH"
  },
  id: 42
}
const ropsten = {
  weth: {
    address: "0xc778417e063141139fce010982780140aa0cd5ab",
    symbol: "WETH"
  },
  id: 3
}
const rinkeby = {
  weth: {
    address: "0xc778417e063141139fce010982780140aa0cd5ab",
    symbol: "WETH"
  },
  id: 4
}
const mainnet = {
  weth: {
    address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    symbol: "WETH",
  },
  id: 1
}

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

  async function fill_data(){
    account = await get_user_account();
    network = await get_eth_network();
    balance = await get_eth_balance(account);
    document.getElementById('network').innerHTML = "Network: " + network;
    document.getElementById('account').innerHTML = "Account: " + account;
    document.getElementById('eth-balance').innerHTML = "Balance: " + balance + " ETH";
    let zeroEx;
    switch (network) {
      case "Kovan":
        zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: kovan.id });
        weth_balance = await zeroEx.token.getBalanceAsync(kovan.weth.address, account) * Math.pow(10, -18);
        document.getElementById('weth-balance').innerHTML = "Balance: " + weth_balance  + " WETH";
        break;
      case "Rinkeby":
        zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: rinkeby.id });
        weth_balance = await zeroEx.token.getBalanceAsync(kovan.weth.address, account) * Math.pow(10, -18);
        document.getElementById('weth-balance').innerHTML = "Balance: " + weth_balance  + " WETH";
        break;
      case "Ropsten":
        zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: ropsten.id });
        weth_balance = await zeroEx.token.getBalanceAsync(kovan.weth.address, account) * Math.pow(10, -18);
        document.getElementById('weth-balance').innerHTML = "Balance: " + weth_balance  + " WETH";
        break;
      case "Mainnet":
        zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: mainnet.id });
        weth_balance = await zeroEx.token.getBalanceAsync(mainnet.weth.address, account) * Math.pow(10, -18);
        document.getElementById('weth-balance').innerHTML = "Balance: " + weth_balance  + " WETH";
        break;
      default:
        document.getElementById('weth-balance').innerHTML = "Balance: UNKNOWN";
    }

  }
  fill_data();
});

async function wrap(){
  let amount_to_wrap = document.getElementById("amount").value;
  amount_to_wrap = parseFloat(amount_to_wrap);
  console.log(amount_to_wrap);
  if(balance > amount_to_wrap && amount_to_wrap > 0 && balance > 0){
    let txId;
    switch (network) {
      case "Kovan":
        txId = await wrap_ether(amount_to_wrap, kovan.weth.address);
        document.getElementById('msg').innerHTML = "Tx: " + "<a href=https://kovan.etherscan.io/tx/" + txId + ">See transaction</a>";
        break;
      case "Ropsten":
        txId = await wrap_ether(amount_to_wrap, ropsten.weth.address);
        document.getElementById('msg').innerHTML = "Tx: " + "<a href=https://ropsten.etherscan.io/tx/" + txId + ">See transaction</a>";
        break;
      case "Rinkeby":
        txId = await wrap_ether(amount_to_wrap, rinkeby.weth.address);
        document.getElementById('msg').innerHTML = "Tx: " + "<a href=https://rinkeby.etherscan.io/tx/" + txId + ">See transaction</a>";
        break;
      case "Mainnet":
        txId = await wrap_ether(amount_to_wrap, mainnet.weth.address);
        document.getElementById('msg').innerHTML = "Tx: " + "<a href=https://etherscan.io/tx/" + txId + ">See transaction</a>";
        break;
      default:
        document.getElementById('msg').innerHTML = "Network not supported.";
    }
  }else{
    document.getElementById('msg').innerHTML = "Insuficient funds/Invalid value.";
  }
}

async function unwrap(){
  let amount_to_unwrap = document.getElementById("w-amount").value;
  amount_to_unwrap = parseFloat(amount_to_unwrap);
  if(weth_balance > amount_to_unwrap && amount_to_unwrap > 0 && balance > 0){
    let txId;
    switch (network) {
      case "Kovan":
        txId = await unwrap_ether(amount_to_unwrap, kovan.weth.address);
        document.getElementById('w-msg').innerHTML = "Tx: " + "<a href=https://kovan.etherscan.io/tx/" + txId + ">See transaction</a>";
        break;
      case "Ropsten":
        txId = await unwrap_ether(amount_to_unwrap, ropsten.weth.address);
        document.getElementById('w-msg').innerHTML = "Tx: " + "<a href=https://ropsten.etherscan.io/tx/" + txId + ">See transaction</a>";
        break;
      case "Rinkeby":
        txId = await unwrap_ether(amount_to_unwrap, rinkeby.weth.address);
        document.getElementById('w-msg').innerHTML = "Tx: " + "<a href=https://rinkeby.etherscan.io/tx/" + txId + ">See transaction</a>";
        break;
      case "Mainnet":
        txId = await unwrap_ether(amount_to_unwrap, mainnet.weth.address);
        document.getElementById('w-msg').innerHTML = "Network not supported.";
        break;
      default:
        document.getElementById('w-msg').innerHTML = "Network not supported.";
    }
  }else{
    document.getElementById('w-msg').innerHTML = "Insuficient funds/Invalid value.";
  }
}
