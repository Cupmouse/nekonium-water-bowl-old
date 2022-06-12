import Web3 from 'web3';
import HTTP from 'http';
import URL from 'url';
import Request from 'request';

// FIXME This thing can ok from the perspective of security?

/*
 Error codes

 x parameter
 0 - post param 'token' is undefined
 1 - post param 'address' is undefined

 1x robot check
 10 - Google server response invalid
 11 - Google server says invalid token'n stuff
 12 - Google server response malformed

 1xx web3 error
 100 - general error, probably node is dead
  */

const ROOT_DIR = '/api/';
const getCaptchaSecret = () => '6Le8ICoUAAAAAKj0_9Fz4csmGL9lZrKLCs253g1C';
const getFaucetAddress = () => '0x58a0a1d5e941bd2213a51f6362a8fc2728a16905';

const genJSONError = (errorCode) => `[false, "${errorCode}"]`;
export const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const handleClaim = (data, response) => {
  let parsed;

  try {
    parsed = JSON.parse(data);
  } catch (error) {
    console.error(error);
    console.log(data);
    response.end();
    return;
  }

  console.log(parsed);

  if (typeof parsed.token !== 'string') {
    response.write(genJSONError(0));
    response.end();
    return;
  }
  if (typeof parsed.address !== 'string') {
    response.write(genJSONError(1));
    response.end();
    return;
  }

  console.log('parsed');

  const options = {
    uri: 'https://www.google.com/recaptcha/api/siteverify',
    headers: {
      'Content-Type': 'application/json',
    },
    form: {
      'secret': getCaptchaSecret(),
      'response': parsed.token,
    },
    timeout: 3000,
  };

  Request.post(options, (error, googleResp, body) => {
    console.log('wow');

    if (error) {
      console.error(error);
      response.write(genJSONError(10));
      response.end();
      return;
    }

    console.log(body);

    let googleParsed;

    try {
      googleParsed = JSON.parse(body);
    } catch (error) {
      console.error(error);
      response.end();
      return;
    }

    if (typeof googleParsed.success === 'undefined') {
      response.write(genJSONError(12));
      response.end();
      return;
    }

    if (googleParsed.success === false) {
      response.write(genJSONError(11));
      response.end();
      return;
    }
    console.log('No way');

    web3.personal.sendTransaction({
      from: getFaucetAddress(),
      to: parsed.address,
      value: web3.toWei(0.01, 'ether'),
    }, (error, txHash) => {
      console.log('yay');

      if (error) {
        console.error(error);
        response.write(genJSONError(100));
        response.end();
        return;
      }

      // ALL Success!!!
      response.write(`[true, "${txHash}"]`);
      response.end();
    });
  });
};


// Creating server
const server = HTTP.createServer((request, response) => {
  let path;

  try {
    path = URL.parse(request.url).path;
  } catch (error) {
    console.error(error);
    request.end();
    return;
  }

  if (path === `${ROOT_DIR}claim` && request.method === 'POST') {
    let data = '';

    request.on('data', (fragment) => {
      data += fragment;
    });

    request.on('end', () => handleClaim(data, response));

    response.writeHead(200, {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'});
  } else {
    console.log('Invalid ');
    response.writeHead(403, {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'});
    response.write('[false, "what do you want to do?"]');
    response.end();
  }

  console.log(`Got request for ${path}`);
}).listen(9876);

console.log('server running on port 9876');

