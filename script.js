//描画領域の縦横幅
const width = 600;
const height = 500;

//描画用変数
let canvas;
let context;

// タイマー処理用
let timer = false;

// 温度を格納する変数
let temp;

//xy分割数
let divide;

// 終了条件
let epsilon;
// sor法 定数
let omega;

// ステップ数
let step;

//　描画用フラグ (1:マウスで描画中, 0:なし)
let pointerFlag = 0;

// HTMl要素を読み込んだら実行
window.onload = function () {
  initialize();
  canvas = document.getElementById("canvas");
  context = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;
  //HTMl要素にイベント追加
  setEvent();
  // 描画
  draw();
};

// 初期化
function initialize() {
  step = 0;
  // キャンバス分割数
  divide = Number(document.getElementById("div").value);
  if (!divide || divide < 0) {
    divide = 20;
    document.getElementById("div").value = divide;
  }
  epsilon = Number(document.getElementById("epsilon").value);
  if (!epsilon || epsilon < 0) {
    epsilon = 0.01;
    document.getElementById("epsilon").value = epsilon;
  }
  // 温度の初期値
  temp = new Array(divide + 1);
  for (i = 0; i < temp.length; i++) {
    temp[i] = new Array(temp.length);
    for (ii = 0; ii < temp.length; ii++) {
      temp[i][ii] = (50 * i) / temp.length + (50 * ii) / temp.length;
    }
  }
}

// HTMl要素にイベントを追加
function setEvent() {
  document.getElementById("start").addEventListener("click", start);
  document.getElementById("reset").addEventListener("click", reset);
  document.getElementById("draw").addEventListener("click", paintMode);
  document.getElementById("div").addEventListener("input", reset);
  canvas.addEventListener("pointerdown", mouseDown);
  canvas.addEventListener("pointerup", mouseUp);
  canvas.addEventListener("pointermove", mouseMove);
}

//----- グラフの描画 -----
function draw() {
  context.clearRect(0, 0, width, height);
  drawXY();
  drawTempBar();
  drawTemp();
}

//----- XY平面座標の描画関数 -----
function drawXY() {
  // 描画スタイル設定
  context.strokeStyle = "rgb(50,50,50)";
  context.textAlign = "center";
  context.font = "20px Arial";
  context.fillStyle = "rgb(50,50,50)";
  context.beginPath();
  // xy軸描画
  context.moveTo(X(0), Y(0));
  context.lineTo(X(divide) + 20, Y(0));
  context.moveTo(X(0), Y(0));
  context.lineTo(X(0), Y(divide) - 20);
  // context.closePath();
  // 目盛描画
  for (let i = 0; i <= divide; i++) {
    if (i % 5) {
      context.moveTo(X(i), Y(0));
      context.lineTo(X(i), Y(-0.2));
      context.moveTo(X(0), Y(i));
      context.lineTo(X(-0.2), Y(i));
    } else if (i) {
      context.moveTo(X(i), Y(-0.4));
      context.lineTo(X(i), Y(0.4));
      context.moveTo(X(-0.4), Y(i));
      context.lineTo(X(0.4), Y(i));

      context.fillText(i, X(i), Y(-0.2) + 30);
      context.fillText(i, X(-0.2) - 25, Y(i - 0.3));
    }
  }
  context.closePath();
  context.stroke();
  context.fillText("O", X(0) - 10, Y(0) + 20);

  // xy軸の矢印描画
  context.fillStyle = "rgb(50,50,50)";
  context.beginPath();
  context.moveTo(X(divide) + 20, Y(0));
  context.lineTo(X(divide) + 10, Y(0) + 5);
  context.lineTo(X(divide) + 10, Y(0) - 5);

  context.moveTo(X(0), Y(divide) - 20);
  context.lineTo(X(0) + 5, Y(divide) - 10);
  context.lineTo(X(0) - 5, Y(divide) - 10);
  context.closePath();
  context.fill();
}

//----- 温度軸描画 -----
function drawTempBar() {
  for (i = 0; i <= 100; i++) {
    context.fillStyle = color(i);
    context.fillRect(500, height - i * 4 - 60, 30, 4);
    if (i % 10 == 0) {
      context.fillStyle = "rgb(50,50,50)";
      context.fillText(i + "℃", 560, height - i * 4 - 50);
    }
  }
}

function drawTemp() {
  for (let i = 0; i < temp.length - 1; i++) {
    for (let ii = 0; ii < temp[i].length - 1; ii++) {
      t =
        (temp[i][ii] +
          temp[i + 1][ii] +
          temp[i][ii + 1] +
          temp[i + 1][ii + 1]) /
        4;
      context.fillStyle = color(t);
      context.fillRect(X(i), Y(ii), X(i + 1) - X(i), Y(ii + 1) - Y(ii));
    }
  }
}

//----- 温度->色 変換 -----
function color(x) {
  max = 100;
  min = 0;
  if (x > max) x = max;
  if (x < min) x = min;
  palette = [
    [0, 0, 0],
    [0, 0, 255],
    [0, 255, 255],
    [0, 255, 0],
    [255, 255, 0],
    [255, 0, 0],
    [255, 255, 255],
  ];

  index = Math.floor((x / (max - min)) * (palette.length - 1));
  rate = (x / (max - min)) * (palette.length - 1) - index;
  if (x == max) {
    red = palette[index][0];
    green = palette[index][1];
    blue = palette[index][2];
  } else {
    red = Math.floor(
      palette[index][0] * (1 - sigmoid(rate)) +
        palette[index + 1][0] * sigmoid(rate)
    );
    green = Math.floor(
      palette[index][1] * (1 - sigmoid(rate)) +
        palette[index + 1][1] * sigmoid(rate)
    );
    blue = Math.floor(
      palette[index][2] * (1 - sigmoid(rate)) +
        palette[index + 1][2] * sigmoid(rate)
    );
  }

  return "rgb(" + [red, green, blue].join(",") + ")";
}

// ----- シグモイド関数(色グラデーション用) -----
function sigmoid(x) {
  gain = 5; // 勾配を調整する定数
  offsetX = -0.5; // x座標平行移動
  return (Math.tanh(((x + offsetX) * gain) / 2) + 1) / 2;
}

//----- 座標変換関数 -----
//   ( xy平面座標 -> canvas座標 )
function X(x) {
  return (420 * x) / divide + 50;
}

function Y(y) {
  return height - (420 * y) / divide - 50;
}

// ----- 実行 -----
function start() {
  if (!timer) {
    timer = setInterval(update, 1);
    document.getElementById("start").innerHTML = "ストップ";
  } else {
    clearTimeout(timer);
    timer = false;
    document.getElementById("start").innerHTML = "実行";
  }
}

// ----- 実行終了 -----
function end() {
  if (timer) {
    clearTimeout(timer);
    timer = false;
    document.getElementById("start").innerHTML = "終了";
  }
}

// ----- 初期状態に -----
function reset() {
  initialize();

  if (timer) {
    clearTimeout(timer);
    timer = false;
  }
  document.getElementById("start").innerHTML = "実行";

  draw();
}

// ----- すべてを0℃に -----
function paintMode() {
  initialize();
  temp = new Array(divide + 1);
  for (i = 0; i < temp.length; i++) {
    temp[i] = new Array(temp.length);
    for (ii = 0; ii < temp.length; ii++) {
      temp[i][ii] = 0;
    }
  }
  draw();
}

// ----- 演算を実行してグラフを更新 -----
function update() {
  switch (document.getElementById("method").value) {
    case "jacobi":
      calcJacobi();
      break;
    case "GaussSeidel":
      calcGaussSeidel();
      break;
    case "SOR":
      calcSor();
      break;
  }
  draw();
  step += 1;
  document.getElementById("step").innerHTML = step;
}

//----- 演算 -----
// ヤコビ法
function calcJacobi() {
  newTemp = new Array(temp.length);
  maxDiff = 0;
  for (let i = 0; i < temp.length; i++) {
    newTemp[i] = new Array(temp.length);
    for (let ii = 0; ii < temp[i].length; ii++) {
      sum = 0;
      count = 0;

      if (i - 1 >= 0) {
        sum += temp[i - 1][ii];
        count += 1;
      }
      if (ii - 1 >= 0) {
        sum += temp[i][ii - 1];
        count += 1;
      }
      if (i + 1 < temp.length) {
        sum += temp[i + 1][ii];
        count += 1;
      }
      if (ii + 1 < temp.length) {
        sum += temp[i][ii + 1];
        count += 1;
      }
      newTemp[i][ii] = sum / count;
      if (Math.abs(newTemp[i][ii] - temp[i][ii]) > maxDiff) {
        maxDiff = Math.abs(newTemp[i][ii] - temp[i][ii]);
      }
    }
  }

  temp = newTemp;
  document.getElementById("max-diff").innerHTML = maxDiff.toFixed(5);
  if (maxDiff <= epsilon) {
    end();
  }
}

// ガウス＝ザイデル法
function calcGaussSeidel() {
  newTemp = new Array(temp.length);
  maxDiff = 0;
  for (let i = 0; i < temp.length; i++) {
    newTemp[i] = new Array(temp.length);
    for (let ii = 0; ii < temp[i].length; ii++) {
      sum = 0;
      count = 0;

      if (i - 1 >= 0) {
        sum += newTemp[i - 1][ii];
        count += 1;
      }
      if (ii - 1 >= 0) {
        sum += newTemp[i][ii - 1];
        count += 1;
      }
      if (i + 1 < temp.length) {
        sum += temp[i + 1][ii];
        count += 1;
      }
      if (ii + 1 < temp.length) {
        sum += temp[i][ii + 1];
        count += 1;
      }
      newTemp[i][ii] = sum / count;
      if (Math.abs(newTemp[i][ii] - temp[i][ii]) > maxDiff) {
        maxDiff = Math.abs(newTemp[i][ii] - temp[i][ii]);
      }
    }
  }

  temp = newTemp;
  document.getElementById("max-diff").innerHTML = maxDiff.toFixed(5);
  if (maxDiff <= epsilon) {
    end();
  }
}

// SOR法
function calcSor() {
  omega = Number(document.getElementById("omega").value);
  if (!omega) {
    omega = 1.5;
    document.getElementById("omega").value = omega;
  }
  newTemp = new Array(temp.length);
  maxDiff = 0;
  for (let i = 0; i < temp.length; i++) {
    newTemp[i] = new Array(temp.length);
    for (let ii = 0; ii < temp[i].length; ii++) {
      sum = 0;
      count = 0;

      if (i - 1 >= 0) {
        sum += newTemp[i - 1][ii];
        count += 1;
      }
      if (ii - 1 >= 0) {
        sum += newTemp[i][ii - 1];
        count += 1;
      }
      if (i + 1 < temp.length) {
        sum += temp[i + 1][ii];
        count += 1;
      }
      if (ii + 1 < temp.length) {
        sum += temp[i][ii + 1];
        count += 1;
      }
      newTemp[i][ii] = temp[i][ii] + omega * (sum / count - temp[i][ii]);
      if (Math.abs(newTemp[i][ii] - temp[i][ii]) > maxDiff) {
        maxDiff = Math.abs(newTemp[i][ii] - temp[i][ii]);
      }
    }
  }

  temp = newTemp;
  document.getElementById("max-diff").innerHTML = maxDiff.toFixed(5);
  if (maxDiff <= epsilon) {
    end();
  }
}

// ----- マウス操作 -----
function mouseDown(e) {
  pointerFlag = 1;
}

function mouseUp(e) {
  pointerFlag = 0;
}

function mouseMove(e) {
  if (pointerFlag && !timer) {
    let size = Number(document.getElementById("draw-size").value);
    let strength = Number(document.getElementById("draw-strength").value);
    console.log(strength);
    if (!size || size <= 0) {
      size = 1;
      document.getElementById("draw-size").value = size;
    }
    // if (!strength || strength <= 0) {
    //   size = 1
    //   document.getElementById("draw-strength").value = strength
    // }

    let eX = canvas.getBoundingClientRect().x;
    let eY = canvas.getBoundingClientRect().y;
    //canvas座標からxy座標に変換 (X(),Y()の逆関数)
    x = ((e.clientX - eX - 50) / 420) * divide;
    y = (-(e.clientY - eY + 50 - height) / 420) * divide;

    // マウスで描画された座標に温度を加える
    for (i = 0; i < temp.length; i++) {
      for (ii = 0; ii < temp.length; ii++) {
        if ((x - i) * (x - i) + (y - ii) * (y - ii) <= size * size) {
          temp[i][ii] += strength;
        }
        if (temp[i][ii] < 0) {
          temp[i][ii] = 0;
        } else if (temp[i][ii] > 100) {
          temp[i][ii] = 100;
        }
      }
    }
    document.getElementById("start").innerHTML = "実行";
    draw();
  }
}
