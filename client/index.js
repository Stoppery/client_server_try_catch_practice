const app = document.getElementById('app');
let tries = 0;

async function renderCard(data, image) {
  const dataContainer = document.createElement('div');
  let counter = 0;

  dataContainer.id = 'data-container';

  dataContainer.classList.add(
    'container',
    'd-flex',
    'justify-content-between',
    'flex-wrap',
    'py-4',
  );

  for (const elem of data) {
    const card = document.createElement('div');
    const cardBody = document.createElement('div');
    const title = document.createElement('h5');
    const price = document.createElement('p');

    cardBody.classList.add('card-body');
    title.classList.add('card-title');
    price.classList.add('card-text');

    card.classList.add(
      'card',
      'my-2',
    );
    card.style.width = '18rem';

    title.textContent = elem.name;
    price.textContent = elem.price;

    cardBody.append(image[counter]);
    cardBody.append(title);
    cardBody.append(price);
    card.append(cardBody);
    dataContainer.append(card);
    counter++;
  }

  app.append(dataContainer);
}

async function getImg(link) {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.classList.add('card-img-top');
    img.src = link;

    img.onload = () => resolve(img);
    img.onerror = () => reject(link);
  });
}

function finishSpinner(spanText, spanSpinner, btn) {
  spanText.textContent = 'Загрузить данные с сервера';
  spanSpinner.classList.add('visually-hidden');
  btn.disabled = false;
}

async function renderData(data, spanText, spanSpinner, btn) {
  const imgLink = [];
  const errorsBlock = document.getElementById('errors-block');
  if (errorsBlock) {
    errorsBlock.remove();
  }

  data.forEach((product) => {
    imgLink.push(product.image);
  });

  Promise.all(imgLink.map(getImg)).then((images) => {
    renderCard(data, images);
    finishSpinner(spanText, spanSpinner, btn);
  });
}

function renderError(err, color) {
  const errorContainer = document.createElement('div');
  const errorContainerText = document.createElement('p');

  app.classList.add('position-relative');

  errorContainerText.innerText = err.message;
  errorContainer.style.height = '200px';
  errorContainer.style.width = '400px';
  errorContainer.style.backgroundColor = color;
  errorContainer.style.color = '#FFFFFF';
  errorContainer.style.padding = '30px';
  errorContainer.style.borderRadius = '5px';

  errorContainerText.style.margin = '0';

  errorContainer.append(errorContainerText);

  return errorContainer;
}

function renderErrorBlock(err, color) {
  if (document.getElementById('errors-block')) {
    const errorContainer = renderError(err, color);
    document.getElementById('errors-block').append(errorContainer);
    setTimeout(() => {
      errorContainer.remove();
      if (!document.getElementById('errors-block').hasChildNodes()) {
        document.getElementById('errors-block').remove();
      }
    }, 3000);
  } else {
    const errors = document.createElement('div');

    errors.classList.add('position-absolute');
    errors.id = 'errors-block';
    errors.style.bottom = '-90vh';
    errors.style.left = '70%';

    const errorContainer = renderError(err, color);
    errors.append(errorContainer);
    setTimeout(() => {
      errorContainer.remove();
      if (!errors.hasChildNodes()) {
        errors.remove();
      }
    }, 3000);
    app.append(errors);
  }
}

async function getData() {
  let dataReq = {};
  const connection = window.navigator.onLine;
  const error = new TypeError();

  if (!connection) {
    error.message = 'Произошла ошибка, проверьте подключение к интернету';
    tries = 0;
    throw error;
  }

  try {
    dataReq = await fetch('/api/products');
  } catch (err) {
    error.message = 'Произошла ошибка, проверьте подключение к интернету';
    tries = 0;
    throw error;
  }

  if (dataReq.status === 404) {
    error.message = 'Список товаров пуст';
    tries = 0;
    throw error;
  } else if (dataReq.status === 500) {
    if (tries < 2) {
      tries++;
      return getData();
    }
    tries = 0;
    error.message = 'Произошла ошибка, попробуйте обновить страницу позже';
    throw error;
  } else if (dataReq.status === 200) {
    let data = {};
    try {
      data = await dataReq.json();
    } catch (err) {
      tries = 0;
      error.message = 'Произошла ошибка, попробуйте обновить страницу позже';
      throw error;
    }
    return data;
  }
  tries = 0;
  throw new Error('Не известный сбой, попробуйте еще раз');
}

window.addEventListener('offline', () => {
  const error = new TypeError();
  error.message = 'Произошла ошибка, проверьте подключение к интернету';
  renderErrorBlock(error, '#FF6666');
});

window.addEventListener('online', () => {
  const online = {};
  online.message = 'Соединение восстановлено!';
  renderErrorBlock(online, '#66FF33');
});

(function () {
  const container = document.createElement('div');
  const btn = document.createElement('button');
  const spanText = document.createElement('span');
  const spanSpinner = document.createElement('span');

  container.classList.add('container', 'd-flex', 'justify-content-center', 'mt-3');

  btn.classList.add('btn', 'btn-primary');

  spanText.classList.add('before-click');
  spanText.textContent = 'Загрузить данные с сервера';

  spanSpinner.classList.add('spinner-grow', 'spinner-grow-sm', 'visually-hidden');

  btn.append(spanText);
  btn.append(spanSpinner);

  btn.addEventListener('click', (evnt) => {
    evnt.preventDefault();
    const dataContainer = document.getElementById('data-container');
    if (dataContainer) {
      dataContainer.remove();
    }
    spanSpinner.classList.remove('visually-hidden');
    spanText.textContent = 'Загружаю   ';
    btn.disabled = true;
    getData()
      .then((res) => {
        renderData(res.products, spanText, spanSpinner, btn);
      })
      .catch((err) => {
        renderErrorBlock(err, '#FF6666');
        finishSpinner(spanText, spanSpinner, btn);
      });
  });

  app.append(container);
  container.append(btn);
}());
