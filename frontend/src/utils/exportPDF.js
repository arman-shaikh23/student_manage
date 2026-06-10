import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToPDF = (data, columns, title, filename) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
  
  const tableColumn = columns.map(col => col.header);
  const tableRows = [];
  
  data.forEach(item => {
    const rowData = columns.map(col => {
      // If accessor is a function, call it, else get the object property
      if (typeof col.accessor === 'function') {
        return col.accessor(item);
      }
      return item[col.accessor];
    });
    tableRows.push(rowData);
  });
  
  autoTable(doc, {
    startY: 35,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  
  doc.save(`${filename}.pdf`);
};
