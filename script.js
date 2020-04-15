//api config

const config = {
  headers: {
    'x-rapidapi-host': 'covid-193.p.rapidapi.com',
    'x-rapidapi-key': '0009bb59ecmsh2c893d8a2130a3cp157529jsn0a9e04b5d42a',
  },
};

//selectors

const datePicker = document.querySelector('input[type="date"]');
const deathsElement = document.querySelector('#deaths');
const countryPicker = document.querySelector('#countryPicker');
const country = document.querySelector('#country');
const criticalCasesElement = document.querySelector('#critical-cases');
const ctx = document.getElementById('myChart').getContext('2d');

let pickedCountry = 'Netherlands'; //set initial country
country.innerText = pickedCountry;

let deaths = 0;
let criticalCases = 0;
let maxTicks = 1000;

//date

let pickedDate = Date.now(); //set initial date to today

pickedDate = formatDate(pickedDate);
datePicker.setAttribute('value', pickedDate);

datePicker.addEventListener('change', () => {
  pickedDate = datePicker.value;
  api(pickedDate, pickedCountry);
  changeChart();
});

function formatDate(date) {
  var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

const today = () => {
  pickedDate = formatDate(Date.now());
  datePicker.value = pickedDate;
  api(pickedDate, pickedCountry);
  changeChart();
};

//countries

const getCountries = async () => {
  try {
    const request = await axios.get(
      'https://covid-193.p.rapidapi.com/countries',
      config
    );
    const countries = request.data.response;
    countries.forEach((country) => {
      const option = document.createElement('option');
      option.innerText = country;
      if (country === pickedCountry) {
        option.setAttribute('selected', 'selected');
      }
      countryPicker.appendChild(option);
    });
  } catch (error) {
    console.log(error);
  }
};

getCountries();

countryPicker.addEventListener('change', () => {
  pickedCountry = countryPicker.value;
  country.innerText = pickedCountry;
  api();
});

//api

const api = async () => {
  try {
    await calculateMaxTicks();
    const request = await axios.get(
      `https://covid-193.p.rapidapi.com/history?day=${pickedDate}&country=${pickedCountry}`,
      config
    );
    const { response } = request.data;
    if (request.data.results > 0) {
      deaths = response[0].deaths.total;
      criticalCases = response[0].cases.critical;
      deathsElement.innerText = deaths;
      criticalCasesElement.innerText = criticalCases;

      changeChart();
    } else {
      deaths = 0;
      criticalCases = 0;
      deathsElement.innerHTML =
        '<span style="color: red;">no data available</span>';
      criticalCasesElement.innerHTML =
        '<span style="color: red;">no data available</span>';
      changeChart();
    }
  } catch (error) {
    throw error;
  }
};

//chart

const calculateMaxTicks = async () => {
  try {
    const request = await axios.get(
      `https://covid-193.p.rapidapi.com/statistics?country=${pickedCountry}`,
      config
    );
    const { response } = request.data;

    if (response[0].deaths.total > response[0].cases.critical) {
      maxTicks = response[0].deaths.total;
    } else {
      maxTicks = response[0].cases.critical;
    }
  } catch (error) {
    throw error;
  }
};

const chart = new Chart(ctx, {
  // The type of chart we want to create
  type: 'bar',

  // The data for our dataset
  data: {
    labels: [pickedDate],
    datasets: [
      {
        label: 'Deaths',
        backgroundColor: 'red',
        borderColor: 'rgb(255, 99, 132)',
        data: deaths,
      },
      {
        label: 'Critical Cases',
        backgroundColor: 'orange',
        borderColor: 'rgb(255, 99, 132)',
        data: criticalCases,
      },
    ],
  },

  // Configuration options go here
  options: {
    scales: {
      yAxes: [
        {
          ticks: {
            max: maxTicks,
            min: 0,
            stepSize: maxTicks / 10,
          },
        },
      ],
    },
  },
});

const changeChart = () => {
  chart.data.labels = [pickedDate];
  chart.data.datasets[0].data = [deaths];
  chart.data.datasets[1].data = [criticalCases];
  chart.options.scales.yAxes[0].ticks.max =
    maxTicks > 1000
      ? Math.ceil(maxTicks / 1000) * 1000
      : Math.ceil(maxTicks / 100) * 100;
  if (maxTicks < 100) {
    chart.options.scales.yAxes[0].ticks.stepSize = 10;
  } else if (maxTicks > 100 && maxTicks <= 1000) {
    chart.options.scales.yAxes[0].ticks.stepSize = 100;
  } else {
    chart.options.scales.yAxes[0].ticks.stepSize = 1000;
  }
  console.log(maxTicks);
  chart.update();
};

const init = (async) => {
  try {
    calculateMaxTicks();
    api(pickedDate, pickedCountry);
  } catch (error) {
    console.log(error);
  }
};

init();
