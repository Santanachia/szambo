
'use strict';

var chart = {}

var conf = { min: 2.8, alert: 1.1, max: 0.84, days: 28, a1: -1, a2: 1 }
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

var values = []
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

  let set = []
  let emptify = []
  let reg = []
  let lastDate
  values.forEach(function(el, i) {
    if (el.alert) {
      conf.alert = Math.max(conf.alert, el.surface)
    }
    if (i == 0) {
      lastDate = el.date.getTime()
      reg.push([0, conf.min])
    }
    else {
      let dateDiff = (el.date.getTime() - lastDate) / (1000 * 3600 * 24)
      if (el.emptify) {
        conf.days = Math.max(conf.days, Math.ceil(dateDiff))
        if (el.surface) { emptify.push([dateDiff, el.surface]) }
        lastDate = el.date.getTime()
        reg.push([0, conf.min])
      }
      else { set.push([dateDiff, el.surface]) }
      if (el.surface) {
        reg.push([dateDiff, el.surface])
        let a = (el.surface - conf.min) / dateDiff
        conf.a1 = Math.max(conf.a1, a)
        conf.a2 = Math.min(conf.a2, a)
      }
    }
  });

  $('#container').height($(window).height());
  chart = Highcharts.chart('container', {
    legend: {
      enabled: false
    },
    chart: {
      type: 'scatter',
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
      labels: {
        overflow: 'justify'
      },
      allowDecimals: false
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
      formatter: function () {
        return 'Day: ' + Math.floor(this.x) + '<br>Left: ' + this.y + ' m'
      }
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

  chart.addSeries({ color: '#90ee7e', data: emptify, name: 'opróżnianie' });
  chart.addSeries({ data: set, name: 'pomiary' });
  chart.addSeries({
    type: 'line',
    name: 'Regression Line',
    data: fitData(reg),
    marker: {
      enabled: false
    },
    states: {
      hover: {
        lineWidth: 0
      }
    },
    enableMouseTracking: false,
    color: '#2b908f'
  });
  chart.addSeries({
    type: 'line',
    data: [[(conf.max - conf.min) / conf.a1, conf.max], [set[set.length - 1][0], set[set.length - 1][1]], [(conf.max - conf.min) / conf.a2, conf.max]],
    color: '#90ee7e'
  });
  chart.addSeries({
    type: 'line',
    color: '#f45b5b'
  });
})

function regression(X, Y) {
  var N = X.length;
  var slope;
  var intercept;
  var SX = 0;
  var SY = 0;
  var SXX = 0;
  var SXY = 0;
  var SYY = 0;

  for (var i = 0; i < N; i++) {
    SX = SX + X[i];
    SY = SY + Y[i];
    SXY = SXY + X[i] * Y[i];
    SXX = SXX + X[i] * X[i];
    SYY = SYY + Y[i] * Y[i];
  }

  slope = (N * SXY - SX * SY) / (N * SXX - SX * SX);
  intercept = (SY - slope * SX) / N;

  return [slope, intercept];
}

function fitData(data) {
  var ret;
  var x = [];
  var y = [];

  for (let i = 0; i < data.length; i++) {
    if (data[i] != null && data[i][0] != null && data[i][1] != null) {
      x.push(data[i][0]);
      y.push(data[i][1]);
    }
  }

  ret = regression(x, y);
  return [[0, ret[1]], [(conf.max - ret[1]) / ret[0], conf.max]]
}
