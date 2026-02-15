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
  /*
  remoteFiles: [
    // loading js file located on the remote server
    // (also adding the logic to make sure it is loaded)
    {type:'js', location:'http://d3js.org/d3.v3.min.js', isLoaded: function() {
      return (window['d3'] != null);
    }},

    // points to css/mystyle.css under assets folder
    {type:'css', location:'asset://css/mystyle.css'}
  ],
  */
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

    //Formatting api, it uses locale detection and mask string to format numeric data and date
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
  /* // comment out if you need special implementation for data refresh
  ,
  refresh: function (context, containerElem, data, fields, props) {
    if (data == null || data.length == 0) {
      return;
    }

    if (!(data instanceof Array)) {
      containerElem.innerHTML += '<p>Sorry, this sample is not compatible with JSON format.</p>';
      return;
    }

    var tableStr = '<table>';

    data.forEach(function(row, rowNo, rows) {
      tableStr += '<tr>';
      row.forEach(function(col, colNo, cols) {
        tableStr += '<td>'+col+'</td>';
      });
      tableStr += '</tr>';
    });
    tableStr += '</table>';

    // update table with a bit of fancy transition
    $(document.getElementById(context.id+"_table")).html(tableStr).hide().fadeIn(1000);
  }
  */
}
