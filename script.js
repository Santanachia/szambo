
'use strict';

var chart = {}

var conf = { min: 2.8, alert: 1.1, max: 0.84 }
$.ajax({
  complete: function () { },
  crossDomain: true,
  data: { alt: 'json' },
  dataType: 'json',
  method: 'GET',
  url: 'https://spreadsheets.google.com/feeds/cells/1Hb62gEMuzLtZW4s-qMkNHw-9lUrD2ARg5KU5mAIJkGM/2/public/full'
}).done(function (data) {
  conf.min = parseFloat(data.feed.entry[1].gs$cell.numericValue);
  conf.max = parseFloat(data.feed.entry[3].gs$cell.numericValue);
})

var values = [], sets = []
$.ajax({
  complete: function () { },
  crossDomain: true,
  data: { alt: 'json' },
  dataType: 'json',
  method: 'GET',
  url: 'https://spreadsheets.google.com/feeds/cells/1Hb62gEMuzLtZW4s-qMkNHw-9lUrD2ARg5KU5mAIJkGM/1/public/full'
}).done(function (data) {
  data.feed.entry.forEach(element => {
    if (parseInt(element.gs$cell.row) != 1) {
      if (values.length < parseInt(element.gs$cell.row) - 1) {
        values.push({})
      }
      switch (parseInt(element.gs$cell.col)) {
        case 1: values[element.gs$cell.row - 2].date = new Date(element.gs$cell.inputValue); break;
        case 3: values[element.gs$cell.row - 2].surface = parseFloat(element.gs$cell.numericValue); break;
        case 4: if (element.gs$cell.inputValue) { values[element.gs$cell.row - 2].alert = true }; break;
        case 5: if (element.gs$cell.inputValue) { values[element.gs$cell.row - 2].emptify = true }; break;
      }
    }
  })
  values = values.filter(function (el) {
    return el.date != null;
  });
  let i = 0
  sets.push([])
  values.forEach(el => {
    sets[i].push(el)
    if (el.emptify) {
      sets.push([{ date: el.date, surface: conf.min }])
      i++
    }
    if (el.alert) {
      console.log(conf.alert, el.surface, Math.max(conf.alert, el.surface))
      conf.alert = Math.max(conf.alert, el.surface)
    }
  });

  console.log(sets)
  chart.addSeries({ name: 'test', data: [2.5, 1.5, 1, .5], type: 'spline' });
})

$(document).ready(function () {
  chart = Highcharts.chart('container', {
    legend: {
      enabled: false
    },
    chart: {
      type: 'spline',
      scrollablePlotArea: {
        minWidth: 600,
        scrollPositionX: 1
      }
    },
    title: {
      text: 'Poziom zapełnienia szamba',
      align: 'left'
    },
    xAxis: {
      type: 'datetime',
      labels: {
        overflow: 'justify'
      }
    },
    yAxis: {
      title: {
        text: '[m] do powierzchni'
      },
      minorGridLineWidth: 0,
      gridLineWidth: 0,
      alternateGridColor: null,
      plotBands: [{
        from: 0,
        to: conf.max,
        color: 'rgba(255, 0, 0, 0.1)',
        label: {
          text: 'pełno',
          style: {
            color: '#606060'
          }
        }
      }, {
        from: conf.max,
        to: conf.alert,
        color: 'rgba(255, 255, 0, 0.1)',
        label: {
          text: 'alert',
          style: {
            color: '#606060'
          }
        }
      }, {
        from: conf.alert,
        to: conf.min,
        color: 'rgba(128, 255, 0, 0.1)',
        label: {
          text: 'ok',
          style: {
            color: '#606060'
          }
        }
        }],
      reversed: true,
      min: conf.max,
      max: conf.min
    },
    tooltip: {
      valueSuffix: ' m'
    },
    plotOptions: {
      spline: {
        lineWidth: 4,
        states: {
          hover: {
            lineWidth: 5
          }
        },
        marker: {
          enabled: false
        },
        pointInterval: 3600000, // one hour
        pointStart: Date.UTC(2018, 1, 13, 0, 0, 0)
      }
    },
    series: [],
    navigation: {
      menuItemStyle: {
        fontSize: '10px'
      }
    }
  });
});
