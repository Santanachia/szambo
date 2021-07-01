var conf = {min:0, max:0}
$.ajax({
    complete: function(){},
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
            sets.push([{date: el.date, surface: conf.min}])
            i++
        }
    });

    console.log(sets)
})
