const ctx = document.getElementById('grafico').getContext('2d');
const labels = [];
const data = {
  labels: labels,
  datasets: [{
    label: 'Forma de Onda',
    data: [],
    borderColor: 'rgb(0, 200, 255)',
    tension: 0.2,
    pointRadius: 2
  }]
};

const config = {
  type: 'line',
  data: data,
  options: {
    animation: false,
    responsive: true,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Tempo (ms)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Tensão (mV)'
        },
        suggestedMin: -150,
        suggestedMax: 150
      }
    },
    plugins: {
      legend: {
        display: true
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
        },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'x',
        }
      },
      annotation: {
        annotations: {}
      }
    }
  }
};

const grafico = new Chart(ctx, config);
let pausado = false;
let bufferPausado = [];

document.getElementById("toggleBtn").addEventListener("click", () => { //Botao Pausar
  pausado = !pausado;
  toggleBtn.textContent = pausado ? "Retomar" : "Pausar";
});

document.getElementById("triggerAtivo").addEventListener("change", () => { //Trigger
  const ativo = document.getElementById("triggerAtivo").checked;
  const input = document.getElementById("triggerValor");
  const label = document.getElementById("triggerLabel");

  input.disabled = !ativo;
  if (ativo) {
    label.classList.remove("disabled");
  } else {
    label.classList.add("disabled");
  }
});

let pontosSelecionados = [];

document.getElementById("grafico").onclick = function(evt) { //Selecao de 2 pontos para verificar variacao
  const canvasPosition = Chart.helpers.getRelativePosition(evt, grafico);
  const xScale = grafico.scales.x;
  const xValue = xScale.getValueForPixel(canvasPosition.x);
  const index = Math.round(xValue);

  // Verifica se índice é válido
  if (index < 0 || index >= data.datasets[0].data.length) return;

  const y = data.datasets[0].data[index];
  const x = index;

  pontosSelecionados.push({ x, y });

  const annotations = {};

  if (pontosSelecionados.length === 1) {
    const p1 = pontosSelecionados[0];

    annotations.linha1 = {
      type: 'line',
      xMin: p1.x,
      xMax: p1.x,
      borderColor: 'red',
      borderWidth: 1,
      label: {
        display: true,
        content: 'P1',
        position: 'start'
      }
    };

    annotations.ponto1 = {
      type: 'point',
      xValue: p1.x,
      yValue: p1.y,
      radius: 5,
      backgroundColor: 'red'
    };

    document.getElementById("deltaX").textContent = "0";
    document.getElementById("deltaY").textContent = "0";
  }

  if (pontosSelecionados.length === 2) {
    const [p1, p2] = pontosSelecionados;

    const deltaX = Math.abs(p2.x - p1.x);
    const deltaY = Math.abs(p2.y - p1.y);

    document.getElementById("deltaX").textContent = deltaX.toFixed(2);
    document.getElementById("deltaY").textContent = deltaY.toFixed(2);

    annotations.linha1 = {
      type: 'line',
      xMin: p1.x,
      xMax: p1.x,
      borderColor: 'red',
      borderWidth: 1,
      label: {
        display: true,
        content: 'P1',
        position: 'start'
      }
    };

    annotations.linha2 = {
      type: 'line',
      xMin: p2.x,
      xMax: p2.x,
      borderColor: 'blue',
      borderWidth: 1,
      label: {
        display: true,
        content: 'P2',
        position: 'start'
      }
    };

    annotations.ponto1 = {
      type: 'point',
      xValue: p1.x,
      yValue: p1.y,
      radius: 5,
      backgroundColor: 'red'
    };

    annotations.ponto2 = {
      type: 'point',
      xValue: p2.x,
      yValue: p2.y,
      radius: 5,
      backgroundColor: 'blue'
    };
  }

  grafico.options.plugins.annotation.annotations = annotations;
  grafico.update();
};


document.getElementById("resetSelecao").onclick = function () { //Botao para resetar selecao dos 2 pontos
  pontosSelecionados = [];
  document.getElementById("deltaX").textContent = "0";
  document.getElementById("deltaY").textContent = "0";
  grafico.options.plugins.annotation.annotations = {};
  grafico.update();
};


document.getElementById("grafico").addEventListener("mousemove", (evt) => { //Linha pontilhada no cursor do mouse sobre o grafico
  const rect = grafico.canvas.getBoundingClientRect();
  const x = evt.clientX - rect.left;

  const xScale = grafico.scales.x;
  const xValue = xScale.getValueForPixel(x);

  grafico.options.plugins.annotation.annotations.cursorLine = {
    type: 'line',
    xMin: xValue,
    xMax: xValue,
    borderColor: 'gray',
    borderWidth: 1,
    borderDash: [4, 4],
    label: {
      display: false
    }
  };

  grafico.update('none'); // 'none' para não animar
});

document.getElementById("grafico").addEventListener("mouseleave", () => { //Remove a linha pontilhada ao tirar o mouse do grafico
  delete grafico.options.plugins.annotation.annotations.cursorLine;
  grafico.update('none');
});

function calcularMetricas() {
  const valores = data.datasets[0].data;
  if (valores.length === 0) return;

  const soma = valores.reduce((a, b) => a + b, 0);
  const media = (soma / valores.length).toFixed(2);
  const max = Math.max(...valores).toFixed(2);
  const min = Math.min(...valores).toFixed(2);

  document.getElementById("media").textContent = media;
  document.getElementById("max").textContent = max;
  document.getElementById("min").textContent = min;
}

function checarTrigger(valor) {
  const trigger = parseFloat(document.getElementById("triggerValor").value);
  const status = document.getElementById("triggerStatus");
  const triggerAtivo = document.getElementById("triggerAtivo").checked;

  if (!triggerAtivo) {
    status.textContent = "";
    return;
  }

  if (!isNaN(trigger) && Math.abs(valor - trigger) <= 50) {
    status.textContent = `Trigger disparado em ${valor}`;
    pausado = true;
    toggleBtn.textContent = "Retomar";
  } else {
    status.textContent = "";
  }
}

function adicionarDado(valor) {
  labels.push('');
  data.datasets[0].data.push(valor);

  if (labels.length > 100) {
    labels.shift();
    data.datasets[0].data.shift();
  }

  grafico.update();
}

const socket = new WebSocket("wss://embarcados-gocs.onrender.com/ws");

socket.onopen = () => {
  console.log("Conectado ao WebSocket");
};

socket.onmessage = (event) => {
  console.log("Mensagem recebida:", event.data);
  const [tempoStr, valorStr] = event.data.split(',');
  const tempo = parseFloat(tempoStr);
  const valor = parseFloat(valorStr);
  console.log("Valor recebido:", valor, " | Pausado:", pausado);

  if (pausado) {
    bufferPausado.push(valor);
  } else {
    if (bufferPausado.length > 0) {
      bufferPausado.forEach(v => adicionarDado(v));
      bufferPausado = [];
    }
    adicionarDado(valor);
    calcularMetricas();
    checarTrigger(valor);
  }
};

socket.onerror = (err) => {
  console.error("Erro no WebSocket:", err);
};
