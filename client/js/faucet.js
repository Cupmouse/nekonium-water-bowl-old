import BigNumber from './bignumber.mjs';

const ONE_NUKO = new BigNumber('1e18');
const ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;
const EXPLORER_PREFIX = 'https://nekonium.github.io/proxy/beproxy.html?type=tx&v=';
const HTTP_STATUS_OK = 200;

const onFormSubmit = (event) => {
  event.preventDefault();

  const givenAddress = document.getElementById('address-input').value;

  // Remove form from DOM tree, can not control buttons anymore
  const formElem = document.getElementById('faucet-form');
  formElem.parentNode.removeChild(formElem);

  const request = new XMLHttpRequest();

  request.onreadystatechange = () => {
    if (this.readyState === HTTP_STATUS_OK) {
      onRequestAccepted(this.responseText);
    }
  };

  // Making POST request to this path and true means async request
  request.open('POST', '/api/claim', true);

  // Preparing data
  const formData = new FormData();

  formData.append('token', grecaptcha.getResponse());
  formData.append('address', givenAddress);

  // Send request
  request.send(formData);

  console.log('submitted');
};

const onRequestAccepted = (responseText) => {
  let message;

  try {
    const parsed = JSON.parse(responseText);

    if (parsed[0] === true) {
      // Successful

      const amount = (new BigNumber(parsed[1])).div(ONE_NUKO).round(2); // Round it to 2 digit
      const txElement = parsed[2];
      message = `${amount}NUKO 送金されました😺 <a href="${EXPLORER_PREFIX}${txElement}">トランザクションの確認は、ここをクリック</a>`;
    } else if (parsed[0] === false) {
      // Server side error happened

      // Error code at index 1
      switch (parsed[1]) {
        // TODO
      }
    } else {
      // What? This could not be happening
      message = 'Received malformed response';
    }
  } catch (error) {
    message = 'Received malformed json response';
  }

  // Show message
  document.getElementById('text-result').innerHTML = message;
};

// UI controls

const openHiddenBox = () => {
  const hiddenBox = document.getElementById('hidden-box');
  hiddenBox.style.visibility = 'visible';
  hiddenBox.style.opacity = '100';

  setTimeout(() => {enableClaimButton()}, 1000);
};

const closeHiddenBox = () => {
  const hiddenBox = document.getElementById('hidden-box');
  hiddenBox.style.visibility = 'hidden';
  hiddenBox.style.opacity = '0';
};

const enableClaimButton = () => {
  document.getElementById('submit-button').disabled = false;
};

const disableClaimButton = () => {
  document.getElementById('submit-button').disabled = true;
};


document.getElementById('address-input').addEventListener('input', (event) => {
  if (ADDRESS_REGEX.test(event.target.value)) {
    openHiddenBox();
  } else {
    closeHiddenBox();
  }
});

document.getElementById('faucet-form').addEventListener('submit', onFormSubmit);
