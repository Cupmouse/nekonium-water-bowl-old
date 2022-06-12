import BigNumber from './bignumber.mjs';

const ONE_NUKO = new BigNumber('1e18');
const ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;
const EXPLORER_PREFIX = 'https://nekonium.github.io/proxy/beproxy.html?type=tx&v=';
const API_URL = 'http://localhost:9876/api/claim';
const HTTP_STATUS_OK = 200;

let inputDisabled;

const onFormSubmit = (event) => {
  event.preventDefault();

  if (inputDisabled) {
    return;
  }

  disableClaimButton();

  const givenAddress = document.getElementById('address-input').value;

  // Can not control buttons anymore
  inputDisabled = true;

  const request = new XMLHttpRequest();

  request.onreadystatechange = () => {
    if (request.readyState === HTTP_STATUS_OK) {
      onRequestAccepted(this.responseText);
    }
  };

  // Making POST request to this path and true means async request
  request.open('POST', API_URL, true);

  // Preparing data
  const post = {
    token: grecaptcha.getResponse(),
    address: givenAddress,
  };

  // Send request
  request.send(JSON.stringify(post));

  console.log('submitted');
};

const onRequestAccepted = (responseText) => {
  let message;

  try {
    const parsed = JSON.parse(responseText);

    console.log(parsed);

    if (parsed[0] === true) {
      // Successful

      const amount = (new BigNumber(parsed[1])).div(ONE_NUKO).round(2); // Round it to 2 digit
      const txElement = parsed[2];
      message = `${amount}NUKO 送金されました😺 <a href="${EXPLORER_PREFIX}${txElement}">トランザクションの確認は、ここをクリック</a>`;
    } else if (parsed[0] === false) {
      // Server side error happened

      // Error code at index 1
      switch (parsed[1]) {
        case 10:
        case 11:
        case 12:
          // ロボットチェックがなってない
          message = '肉球チェックに失敗しました。ページを再読込みして、もう一度やり直して下さい。\nCaptcha failed. Please reload and try again.';
          break;
        // case 102:
        //   // 短期間に更に受け取ろうとした
        //   t_res.textContent = "3時間経過していません。最後の受け取りは、UTC(協定世界時)" + parsed['t'] + "です。お待ち下さい。\nYou have to wait 3 hours to get more nuko, last time you get is the time above.";
        //   break;
        // case 300:
        //   // コインの扱い時のエラーは詳細も含まれる
        //   t_res.textContent = "エラー" + parsed['c'] + "が発生しました" + "/" + parsed['d'] + "\nSome error occurred.";
        //   break;
        // case 401:
        //   // データベース関連エラー()
        //   t_res.textContent = "データベース関連エラーです。管理人に報告して下さい。\nDatabase error occurred, please contact to the faucet dev: discord @かばやき";
        //   break;
        case 100:
          // ロボットチェックがなってない
          message = '肉球チェックに失敗しました。ページを再読込みして、もう一度やり直して下さい。\nCaptcha failed. Please reload and try again.';
          break;
        default:
          message = `エラー${parsed['c']}が発生しました`;
          break;
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
  if (inputDisabled) {
    return;
  }

  if (ADDRESS_REGEX.test(event.target.value)) {
    openHiddenBox();
  } else {
    closeHiddenBox();
  }
});

document.getElementById('faucet-form').addEventListener('submit', onFormSubmit);
