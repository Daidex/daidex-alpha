const http      = require('http');
const express   = require('express');
const router    = require('./router');
const rp        = require('request-promise');
const fs        = require('fs');
const port      = process.env.PORT || 3000;
const app       = express();
const server    = http.createServer(app);
const request   = require('superagent');
const multipart = require('connect-multiparty')
const Web3      = require("web3");

app.use(multipart())
app.engine('html', require('ejs').renderFile)
app.set('view engine', 'html');
app.use('/', router);
server.listen(port, () => console.log(`server listen in: localhost:${port}`));


/*
const radarrelayBaseURL = "https://api.radarrelay.com/0x/v0/";
const etherscanBaseURL = "https://api.etherscan.io/api/";
const contracts = JSON.parse(fs.readFileSync('js/contracts.json', 'utf8'));
var web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/TsdoDuPiajm8bmj2lOje"));
const etherscan_token = "HH2UBH591DE51FKE1E16VP8E741X7G47NY";
let i = 0;
let contract_addresses = [];
let contract_symbols = [];

function get_contract_addresses(){
  var contracts = rp({
    method: 'GET',
    uri: radarrelayBaseURL + 'token_pairs',
    qs: {},
    json: true,
  }).then((token_pairs) => {
    for(var token of token_pairs){
      contract_addresses.push(String(token.tokenB.address));
    }
    return contract_addresses;
  });
  return contracts;
}

function get_contract_symbol(contract_address){
  var symbol = rp({
    method: 'GET',
    uri: etherscanBaseURL,
    qs: {
      module: "contract",
      action: "getabi",
      address: contract_address,
      apikey: etherscan_token
    },
    json: true,
  }).then(async function(response){
    if(response.status == 1){
      var contract_abi = JSON.parse(response.result);
      var contract_instance = web3.eth.contract(contract_abi).at(contract_address);
      var contract_symbol = await contract_instance.symbol((error,symbol)=>{
        console.log(symbol);
      });
      return contract_symbol;
    }
  }).catch((error)=>{});
  return symbol;
}
async function print_contract_symbols(){
  var addresses = await get_contract_addresses();
  //console.log(contracts);
  for(var address of addresses){
    //console.log(address);
    var symbol = await get_contract_symbol(address);
    console.log(symbol);
  }

}
print_contract_symbols();
*/
