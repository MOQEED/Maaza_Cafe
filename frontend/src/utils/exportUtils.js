import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

// Export Date-wise or General PDF
export const exportToPDF = ({
  title = 'Maaza Cafe Report',
  subtitle = '',
  headers = [],
  rows = [],
  fileName = 'maaza-cafe-report.pdf',
  totals = null,
}) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Brand Header banner
    doc.setFillColor(34, 23, 16); // Espresso
    doc.rect(0, 0, pageWidth, 26, 'F');

    doc.setTextColor(245, 158, 11); // Warm Amber
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('MAAZA CAFE', 14, 13);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(title.toUpperCase(), 14, 20);

    const dateStr = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.setFontSize(8);
    doc.setTextColor(220, 205, 190);
    doc.text(`Generated: ${dateStr}`, pageWidth - 14, 18, { align: 'right' });

    let startY = 34;
    if (subtitle) {
      doc.setTextColor(60, 45, 35);
      doc.setFontSize(10);
      doc.text(subtitle, 14, startY);
      startY += 8;
    }

    autoTable(doc, {
      startY: startY,
      head: [headers],
      body: rows,
      theme: 'striped',
      headStyles: {
        fillColor: [224, 90, 0], // Vibrant Cafe Orange (matching table headers)
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
        textColor: [30, 30, 30],
      },
      alternateRowStyles: {
        fillColor: [253, 248, 244],
      },
      foot: totals ? [totals] : undefined,
      footStyles: {
        fillColor: [245, 235, 225],
        textColor: [224, 90, 0],
        fontStyle: 'bold',
        fontSize: 10,
      },
    });

    doc.save(fileName);
    return true;
  } catch (error) {
    console.error('PDF export failed:', error);
    alert('Failed to generate PDF: ' + error.message);
    return false;
  }
};

// Monthly PDF Export (groups by dates inside that month)
export const exportMonthlyPDF = ({
  monthString = '', // e.g. "2026-09"
  pageTitle = 'Monthly Statement',
  groupedData = [], // array of { date, items, total }
  grandTotal = 0,
  fileName = '',
}) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Brand Header banner
    doc.setFillColor(34, 23, 16);
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setTextColor(245, 158, 11);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('MAAZA CAFE', 14, 13);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`${pageTitle.toUpperCase()} - MONTH: ${monthString}`, 14, 22);

    let currentY = 38;

    groupedData.forEach((group) => {
      // Check if we need a new page
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setTextColor(224, 90, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Date: ${group.date} (Day Total: Rs. ${group.total.toLocaleString('en-IN')})`, 14, currentY);
      currentY += 4;

      const rows = group.items.map((it, idx) => [
        idx + 1,
        it.itemName || it.billName || 'Item',
        it.quantity || '1',
        it.price ? `Rs. ${it.price}` : `Rs. ${it.amount || 0}`,
        `Rs. ${it.totalPrice || it.amount || 0}`,
        it.time || '',
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['#', 'Description', 'Qty', 'Unit Price', 'Total', 'Time']],
        body: rows,
        theme: 'striped',
        headStyles: {
          fillColor: [224, 90, 0],
          textColor: [255, 255, 255],
          fontSize: 8,
        },
        styles: { fontSize: 8, cellPadding: 3 },
      });

      currentY = doc.lastAutoTable.finalY + 10;
    });

    // Grand total at bottom
    if (currentY > 260) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFillColor(245, 235, 225);
    doc.rect(14, currentY, pageWidth - 28, 12, 'F');
    doc.setTextColor(224, 90, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`MONTHLY GRAND TOTAL: Rs. ${Number(grandTotal).toLocaleString('en-IN')}`, 18, currentY + 8);

    doc.save(fileName || `maaza-monthly-${monthString}.pdf`);
    return true;
  } catch (error) {
    console.error('Monthly PDF export error:', error);
    alert('Monthly export failed: ' + error.message);
    return false;
  }
};

// Export element as Image (html2canvas)
export const exportToImage = async (elementId, fileName = 'maaza-cafe-export.png') => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`Element "${elementId}" not found for image export`);
      return false;
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const link = document.createElement('a');
    link.download = fileName;
    link.href = canvas.toDataURL('image/png');
    link.click();
    return true;
  } catch (error) {
    console.error('Image export failed:', error);
    alert('Failed to export image: ' + error.message);
    return false;
  }
};
