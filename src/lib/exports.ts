export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((row) =>
    Object.values(row)
      .map((val) => {
        const str = typeof val === "object" ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(data: any[], filename: string) {
  // Simple XML format Excel export that MS Excel can read natively
  let excelTemplate = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sheet1</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
    </head>
    <body>
      <table>
        <thead>
          <tr>
            ${Object.keys(data[0] || {}).map(key => `<th>${key}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${Object.values(row).map(val => `<td>${val !== null && val !== undefined ? String(val) : ""}</td>`).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([excelTemplate], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
