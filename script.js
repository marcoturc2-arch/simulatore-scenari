const euro = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0
});

const numero = new Intl.NumberFormat("it-IT", {
  maximumFractionDigits: 0
});

const percentualeFormato = new Intl.NumberFormat("it-IT", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1
});

const inputIds = [
  "budgetAdv",
  "cpl",
  "showupWebinar",
  "conversioneApp",
  "showupApp",
  "chiusuraSales",
  "scontrinoMedio",
  "costoServizioPerc",
  "costiFissi",
  "durataApp",
  "oreCommerciale",
  "budgetPrudente",
  "roasPrudente",
  "budgetBase",
  "roasBase",
  "budgetOttimale",
  "roasOttimale"
];

function valore(id) {
  const elemento = document.getElementById(id);
  return elemento ? Number(elemento.value) || 0 : 0;
}

function percentuale(id) {
  return valore(id) / 100;
}

function scrivi(id, valore) {
  const elemento = document.getElementById(id);
  if (elemento) {
    elemento.textContent = valore;
  }
}

let scenarioChart;

function calcolaFunnel() {
  const budgetAdv = valore("budgetAdv");
  const cpl = valore("cpl");
  const showupWebinar = percentuale("showupWebinar");
  const conversioneApp = percentuale("conversioneApp");
  const showupApp = percentuale("showupApp");
  const chiusuraSales = percentuale("chiusuraSales");
  const scontrinoMedio = valore("scontrinoMedio");
  const costoServizioPerc = percentuale("costoServizioPerc");
  const costiFissi = valore("costiFissi");
  const durataApp = valore("durataApp");
  const oreCommerciale = valore("oreCommerciale");

  const leadGenerati = cpl > 0 ? budgetAdv / cpl : 0;
  const presentiWebinar = leadGenerati * showupWebinar;
  const appPrenotati = presentiWebinar * conversioneApp;
  const appSvolti = appPrenotati * showupApp;
  const clienti = appSvolti * chiusuraSales;
  const fatturato = clienti * scontrinoMedio;
  const costoServizio = fatturato * costoServizioPerc;
  const utile = fatturato - costoServizio - budgetAdv - costiFissi;
  const roas = budgetAdv > 0 ? fatturato / budgetAdv : 0;
  const cac = clienti > 0 ? budgetAdv / clienti : 0;

  const oreSalesTotali = (appSvolti * durataApp) / 60;
  const commerciali = oreCommerciale > 0 ? Math.ceil(oreSalesTotali / oreCommerciale) : 0;

  scrivi("leadGenerati", numero.format(leadGenerati));
  scrivi("presentiWebinar", numero.format(presentiWebinar));
  scrivi("appPrenotati", numero.format(appPrenotati));
  scrivi("appSvolti", numero.format(appSvolti));
  scrivi("clienti", numero.format(clienti));
  scrivi("fatturato", euro.format(fatturato));
  scrivi("utile", euro.format(utile));
  scrivi("roas", roas.toFixed(2));
  scrivi("cac", euro.format(cac));
  scrivi("commerciali", numero.format(commerciali));

  calcolaScenari();
}

function calcolaScenario(nome) {
  const budget = valore(`budget${nome}`);
  const roas = valore(`roas${nome}`);
  const costoServizioPerc = percentuale("costoServizioPerc");
  const costiFissi = valore("costiFissi");

  const fatturato = budget * roas;
  const costoServizio = fatturato * costoServizioPerc;
  const utile = fatturato - costoServizio - budget - costiFissi;
  const utileSuFatturato = fatturato > 0 ? (utile / fatturato) * 100 : 0;

  scrivi(`fatturato${nome}`, euro.format(fatturato));
  scrivi(`utile${nome}`, euro.format(utile));
  scrivi(`utilePerc${nome}`, `(${percentualeFormato.format(utileSuFatturato)}%)`);

  return { fatturato, utile };
}

function calcolaScenari() {
  const prudente = calcolaScenario("Prudente");
  const base = calcolaScenario("Base");
  const ottimale = calcolaScenario("Ottimale");

  aggiornaGrafico([prudente, base, ottimale]);
}

function aggiornaGrafico(scenari) {
  const datiFatturato = scenari.map(s => Math.round(s.fatturato));
  const datiUtile = scenari.map(s => Math.round(s.utile));

  const chartColors = {
    text: "#cbd5e1",
    grid: "rgba(148, 163, 184, 0.15)"
  };

  if (!scenarioChart) {
    const canvas = document.getElementById("scenarioChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    scenarioChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Prudente", "Base", "Ottimale"],
        datasets: [
          {
            label: "Fatturato",
            data: datiFatturato,
            borderWidth: 1
          },
          {
            label: "Utile",
            data: datiUtile,
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: {
            labels: {
              color: chartColors.text
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${euro.format(context.raw)}`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: chartColors.text
            },
            grid: {
              color: chartColors.grid
            }
          },
          y: {
            ticks: {
              color: chartColors.text,
              callback: function(value) {
                return euro.format(value);
              }
            },
            grid: {
              color: chartColors.grid
            }
          }
        }
      }
    });
  } else {
    scenarioChart.data.datasets[0].data = datiFatturato;
    scenarioChart.data.datasets[1].data = datiUtile;
    scenarioChart.update();
  }
}

function stampaPdf() {
  calcolaFunnel();

  if (scenarioChart) {
    scenarioChart.resize();
    scenarioChart.update();
  }

  setTimeout(function () {
    window.focus();
    window.print();
  }, 300);
}

document.addEventListener("DOMContentLoaded", function () {
  inputIds.forEach(id => {
    const elemento = document.getElementById(id);
    if (elemento) {
      elemento.addEventListener("input", calcolaFunnel);
    }
  });

  const bottonePdf = document.getElementById("printPdfBtn");
  if (bottonePdf) {
    bottonePdf.addEventListener("click", stampaPdf);
  }

  calcolaFunnel();
});
