const radarrelayBaseURL = "https://api.radarrelay.com/0x/v0/";
const etherscanBaseURL = "https://api.etherscan.io/api";
const etherscan_key = "HH2UBH591DE51FKE1E16VP8E741X7G47NY";
markets_list = "<ul>";
if (typeof web3 !== 'undefined') {
  // Use Mist/MetaMask's provider
  web3 = new Web3(web3.currentProvider);
  document.getElementById('meta-mask-required').innerHTML = 'Metamask plugin detected'
}else{
  web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/TsdoDuPiajm8bmj2lOje"));
}

var contracts = {};
$.getJSON("contracts.json", function(json) {
  contracts = json;
});

//var json3 = $.extend(json1, json2);
var i = 1;
var amount_markets = 0;

async function get_token_pairs(){
  var token_pairs;
  await $.getJSON(
    radarrelayBaseURL + 'token_pairs',
    function(response){
      token_pairs = response;
      amount_markets = token_pairs.length;
    });
  return token_pairs;
}

async function get_token_instance(contract_address){
  var contract_instance;
  var token_symbol;
  try{
    await $.getJSON(
      etherscanBaseURL +
      '?module=contract&action=getabi&address=' +
      contract_address +
      "&apikey=" +
      etherscan_key,
      function(response){
        if(response.status == 1){
          var contract_abi = JSON.parse(response.result);
          var contract_instance = web3.eth.contract(contract_abi).at(contract_address);
          token_instance =  contract_instance;
        }else{
          console.log(response.result + ". Address: " + contract_address);
          token_instance = null;
        }
      });
  }catch(error){
    token_instance = null;
  }
  return token_instance;
}

function get_token_symbol(token_instance){
  if (token_instance != null){
    if ("symbol" in token_instance){
      var token_symbol = token_instance.symbol((error, symbol)=>{
        if (symbol.slice(0,8) == "0x444149"){
          token_symbol = "DAI";
        }else{
          if (symbol.slice(0,8) == "0x4d4b52"){
            toke_symbol = "MKR";
          }else{
            token_symbol = symbol;
          }
        }
        var token_base;
        if(i < 356/2){
          token_base = "DAI";
        }else{
          token_base = "WETH";
        }
        document.getElementById("markets-loaded").innerHTML = "Markets loaded: " + i + "/" + amount_markets;
        markets_list += "<li>" + token_symbol + " / " + token_base + " (address: " + token_instance.address + ")</li>";
        document.getElementById("markets").innerHTML = markets_list;
        console.log(token_symbol + ". Number " + i++);
      });
    }else{
        console.log("UNKNOWN. Number: " + i++);
    }
  }else{
    console.log("UNKNOWN. Number: " + i++);
  }
}

async function print_token_symbol(){
  var token_addresses = await get_token_pairs();
  console.log(token_addresses.length);
  for(var address of token_addresses){
    var token_instance = await get_token_instance(address.tokenB.address);
    var token_symbol = get_token_symbol(token_instance);
  }
}

print_token_symbol();

//markets_list += "</ul>";
