const ctx = document.getElementById('grafico').getContext('2d');
const labels = [];
const data = {
  labels: labels,
  datasets: [{
    label: 'Forma de Onda',
    data: [],
    borderColor: 'rgb(0, 200, 255)',
    tension: 0.2,
    pointRadius: 0
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
          text: 'Amplitude'
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
      }
    }
  }
};

const grafico = new Chart(ctx, config);
let pausado = false;
let bufferPausado = [];

document.getElementById("toggleBtn").addEventListener("click", () => {
  pausado = !pausado;
  toggleBtn.textContent = pausado ? "Retomar" : "Pausar";
});

function calcularMetricas() {
  const valores = data.datasets[0].data;
  if (valores.length === 0) return;

  const soma = valores.reduce((a, b) => a + b, 0);
  const media = (soma / valores.length).toFixed(2);
  const max = Math.max(...valores);
  const min = Math.min(...valores);

  // Estimar frequência pela contagem de cruzamentos pelo zero
  let cruzamentos = 0;
  for (let i = 1; i < valores.length; i++) {
    if ((valores[i - 1] < 0 && valores[i] >= 0) || (valores[i - 1] > 0 && valores[i] <= 0)) {
      cruzamentos++;
    }
  }
  const freq = ((cruzamentos / 2) * 10).toFixed(2);  // 10 Hz se 100ms entre pontos

  document.getElementById("media").textContent = media;
  document.getElementById("max").textContent = max;
  document.getElementById("min").textContent = min;
  document.getElementById("freq").textContent = freq;
}

function checarTrigger(valor) {
  const trigger = parseFloat(document.getElementById("triggerValor").value);
  const status = document.getElementById("triggerStatus");

  if (Math.abs(valor) >= Math.abs(trigger)) {
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
