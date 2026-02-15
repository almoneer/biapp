{
  id: '19564dc1da7d.test',
  component: {
    'name': 'test',
    'tooltip': 'Insert test'
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
  containerElem.innerHTML = '<h2>SQL -> JS -> View</h2>';

  // 1) تحقق من الداتا
  if (!data || !data.length) {
    containerElem.innerHTML += '<p>No Data Found</p>';
    return;
  }
  if (!(data instanceof Array)) {
    containerElem.innerHTML += '<p>Not compatible with JSON/CSV format.</p>';
    return;
  }

  // 2) خذ أول قيمة (نتيجة select 'test' from dual)
  // عادة data = [ ['test'] ] أو ممكن [ ['TEST'] ] حسب المصدر
  var raw = (data[0] && data[0][0] != null) ? String(data[0][0]) : '';

  // 3) المعالجة (مثال بسيط)
  var processed = 'Processed: ' + raw.toUpperCase();

  // 4) العرض
  containerElem.innerHTML += `
    <div style="padding:10px;border:1px solid #ddd;border-radius:8px;max-width:600px">
      <div><b>Raw:</b> ${escapeHtml(raw)}</div>
      <div style="margin-top:6px"><b>Processed:</b> ${escapeHtml(processed)}</div>
    </div>
  `;

  // (اختياري) اعرض الداتا الأصلية كجدول للتاكد
  containerElem.innerHTML += `<hr/><div><b>Debug Table:</b></div>`;
  var tableStr = '<table style="border-collapse:collapse;margin-top:6px">';
  data.forEach(function(row){
    tableStr += '<tr>';
    row.forEach(function(col){
      tableStr += '<td style="border:1px solid #ccc;padding:4px 8px;">' + escapeHtml(String(col)) + '</td>';
    });
    tableStr += '</tr>';
  });
  tableStr += '</table>';
  containerElem.innerHTML += tableStr;
  
	console.log("data =", data);
	console.log("fields =", fields);

  function escapeHtml(s) {
    return s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
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
