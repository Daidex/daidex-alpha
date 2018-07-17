const radarrelayBaseURL = "https://api.radarrelay.com/0x/v0/";

async function get_rr_contract_addresses(){
  let rr_contract_addresses = [];
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

async function get_rr_orderbook(base_token_address, quote_token_address){
  let orders;
  let params = {
    baseTokenAddress: base_token_address,
    quoteTokenAddress: quote_token_address,
  }
  let url = new URL(radarrelayBaseURL + 'orderbook');
  url.search = new URLSearchParams(params);
  await fetch(url)
  .then((resp) => resp.json())
  .then(function(data){
    //console.log(data);
    orders = data;
  })
  .catch(function(error){
    console.log(error);
  });
  return orders;
}

async function get_rr_order_fees(order){
  let order_fees;
  await fetch(radarrelayBaseURL + 'fees', {
    method: 'POST', // or 'PUT'
    body: JSON.stringify(order), // data can be `string` or {object}!
    headers:{ 'Content-Type': 'application/json'}})
    .then(res => res.json())
    .catch(error => console.error('Error:', error))
    .then(response => {
      order_fees = response;
      console.log('Success:', response);
    });
  return order_fees;
}

async function get_rr_token_pairs(token_base){
  let rr_token_pairs;
  let params = { tokenA: token_base };
  let url = new URL(radarrelayBaseURL + 'token_pairs');
  url.search = new URLSearchParams(params);
  await fetch(url)
  .then((resp) => resp.json())
  .then(function(token_pairs) {
    rr_token_pairs = token_pairs;
  })
  .catch(function(error) {
    console.log(error);
  });
  return rr_token_pairs;
}


async function get_rr_orders(exchange_contract_address){
  let rr_orders;
  let params = { exchangeContractAddress: exchange_contract_address };
  let url = new URL(radarrelayBaseURL + 'orders');
  url.search = new URLSearchParams(params);
  await fetch(url)
  .then((resp) => resp.json())
  .then(function(orders) {
    rr_orders = orders;
  })
  .catch(function(error) {
    console.log(error);
  });
  return rr_orders;
}