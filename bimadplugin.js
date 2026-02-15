{
  id: '9b3b8596c33c.bimadplugin',
  component: {
    'name': 'bimadplugin',
    'tooltip': 'Insert bimadplugin'
  },
  properties: [
    {key: "width", label: "Width", type: "length", value: "500px"},
    {key: "height", label: "Height", type: "length", value: "400px"}
  ],
  fields: [
  ],
  dataType: 'arrayOfArrays',
  render: function (context, containerElem, data, fields, props) {
    containerElem.innerHTML = '<h1>My First Plugin</h1>';

    if (data == null || data.length == 0) {
      containerElem.innerHTML += '<p>No Data Found</p>';
      return;
    }

    if (!(data instanceof Array)) {
      containerElem.innerHTML += '<p>Sorry, this sample is not compatible with JSON/CSV format.</p>';
      return;
    }

    var currencyFormatting = xdo.api.format('number', '$#,##0.00;($#,##0.00)');
    var dateFormat = xdo.api.format('date', 'M/d/yy h:mm t');
    var tableStr = '<div id="'+context.id+'_table">';
    var formatDiv = '<div class="format">Date: ' + dateFormat(new Date()) + ', Currency: ' + currencyFormatting(3000) + '</div>';
    tableStr += '<table style="border-spacing: 0;">';

    data.forEach(function(row, rowNo, rows) {
      var color = ((rowNo % 2) == 1)?'transparent':'transparent';
      tableStr += '<tr style="background-color: '+color+';">';

      row.forEach(function(col, colNo, cols) {
        tableStr += '<td style="padding: 3px 6px;">'+col+'</td>';
      });
      tableStr += '</tr>';
    });
    tableStr += '</table>';
    tableStr += '</div>';

    containerElem.innerHTML += formatDiv + tableStr;
  }
}
