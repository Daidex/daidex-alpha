let networks;
let cleintAddress;
let zeroEx;
window.addEventListener('load', async function() {
  if (typeof web3 !== 'undefined') {
    // Use Mist/MetaMask's provider
    web3 = new Web3(web3.currentProvider);
    //document.getElementById('meta-mask-required').innerHTML = 'Metamask plugin detected';
  } else {
    console.log('No web3? You should consider trying MetaMask!')
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    //document.getElementById('meta-mask-required').innerHTML = 'You need <a href="https://metamask.io/">MetaMask</a> browser plugin to run this example'
    //web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/TsdoDuPiajm8bmj2lOje"));
    //return;
  }

  cleintAddress = web3.eth.coinbase;

  await fetch("js/networks.json")
  .then((resp) => resp.json())
  .then(function(data){
    networks = data;
  })
  .catch(function(error){
    console.log(error);
  });

  let tokenSelect1 = document.getElementById("token-select1");
  for(var tokenSymbol of networks.Symbols){
    let selectOption = document.createElement("option");
    selectOption.text = tokenSymbol;
    selectOption.value = tokenSymbol;
    tokenSelect1.add(selectOption);
  }

  let tokenSelect2 = document.getElementById("token-select2");
  for(var tokenSymbol of networks.Symbols){
    let selectOption = document.createElement("option");
    selectOption.text = tokenSymbol;
    selectOption.value = tokenSymbol;
    tokenSelect2.add(selectOption);
  }

  loadDropdownMenu();


});

async function tokenSelected(tokenList){
  this.tokenSymbol = document.getElementById(tokenList).value;
  switch(this.tokenSymbol){
    case "WETH":
      this.tokenAddress = networks.Kovan.WETH;
      break;
    case "ZRX":
      this.tokenAddress = networks.Kovan.ZRX;
      break;
    case "MKR":
      this.tokenAddress = networks.Kovan.MKR;
      break;
    case "DAI":
      this.tokenAddress = networks.Kovan.DAI;
      break;
  }

  const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: 42 });
  this.balance = await zeroEx.token.getBalanceAsync(this.tokenAddress, cleintAddress);
  console.log(ZeroEx.ZeroEx.toBaseUnitAmount(this.balance, 18));
  switch(tokenList){
    case "token-select1":
      document.getElementById("balanceA").innerHTML = ZeroEx.ZeroEx.toUnitAmount(this.balance, 18);
      break;
      case "token-select2":
      document.getElementById("balanceB").innerHTML = ZeroEx.ZeroEx.toUnitAmount(this.balance, 18);
      break;
  }
}
