const ercdexBaseURL = "https://api.ercdex.com/api/standard/";

const kovan_network_id = 42;
const main_network_id = 1;

async function get_ercdex_contract_addresses(){
  let rr_contract_addresses = [];
  await fetch(ercdexBaseURL + 'token_pairs')
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

async function get_ercdex_orderbook(base_token_address, quote_token_address){
  let orders;
  let params = {
    baseTokenAddress: base_token_address,
    quoteTokenAddress: quote_token_address,
  }
  let url = new URL(ercdexBaseURL + 'orderbook');
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

async function get_ercdex_order_fees(order){
  let order_fees;
  await fetch(ercdexBaseURL + 'fees', {
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

async function get_ercdex_token_pairs(net_id){
  let rr_token_pairs;
  await fetch(ercdexBaseURL + String(net_id) + "/v0/token_pairs")
  .then((resp) => resp.json())
  .then(function(token_pairs) {
    rr_token_pairs = token_pairs;
  })
  .catch(function(error) {
    console.log(error);
  });
  return rr_token_pairs;
}


async function get_ercdex_orders(net_id, maker_token_address, taker_token_address){
  let ercdex_orders;
  let params = { makerTokenAddress: maker_token_address,
                 takerTokenAddress: taker_token_address
               };
  let url = new URL(ercdexBaseURL + String(net_id) +'/v0/orders');
  url.search = new URLSearchParams(params);
  await fetch(url)
  .then((resp) => resp.json())
  .then(function(orders) {
    ercdex_orders = orders;
  })
  .catch(function(error) {
    console.log(error);
  });
  return ercdex_orders;
}