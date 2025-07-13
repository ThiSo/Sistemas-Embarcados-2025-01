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

function adicionarDado(valor) {
  labels.push('');
  data.datasets[0].data.push(valor);

  if (labels.length > 100) {
    labels.shift();
    data.datasets[0].data.shift();
  }

  grafico.update();
}

// 👇 Coloque o IP real do seu PC aqui
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
  }
};

socket.onerror = (err) => {
  console.error("Erro no WebSocket:", err);
};
