import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '../../../../../lib/prisma';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate ID parameter
    const id = parseInt(params.id, 10);
    if (isNaN(id) || id < 1) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const ite = await prisma.iTE.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!ite) {
      return NextResponse.json({ error: 'ITE not found' }, { status: 404 });
    }

    // Parse ITE data
    const metadata = JSON.parse(ite.metadata);
    const comparisonData = JSON.parse(ite.comparisonData);
    const recommendations = JSON.parse(ite.recommendations);
    const acceptedCells = JSON.parse(ite.acceptedCells || '{}');

    // Create PDF
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ITEM TECHNICAL EVALUATION', 148, 15, { align: 'center' });

    // Add metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const startY = 25;
    doc.text(`ITE Number: ${ite.iteNumber}`, 14, startY);
    doc.text(`ITS No: ${metadata.itsNo || 'N/A'}`, 14, startY + 5);
    doc.text(`EPRF: ${metadata.eprf || 'N/A'}`, 14, startY + 10);
    doc.text(`For User: ${metadata.forUser || 'N/A'}`, 14, startY + 15);
    doc.text(`Date: ${new Date(ite.createdAt).toLocaleDateString()}`, 200, startY + 15);

    // Prepare table data
    const headers = [
      'ITS Requirement',
      ...comparisonData.suppliers.map((_, idx) => `Supplier ${String.fromCharCode(65 + idx)}`),
    ];

    const rows = comparisonData.comparison.map((row, rowIdx) => {
      const rowData = [
        `${row.feature}: ${row.itsSpec}`,
        ...row.suppliers.map((cell, cellIdx) => {
          const cellKey = `${rowIdx}-${cellIdx}`;
          const isAccepted = acceptedCells[cellKey];
          let cellValue = cell.value || 'N/A';

          // Add acceptance indicator if applicable
          if (isAccepted) {
            cellValue += ' *';
          }

          return cellValue;
        }),
      ];
      return rowData;
    });

    // Add Price row
    rows.push([
      'Price',
      ...comparisonData.suppliers.map(s => s.price || '-')
    ]);

    // Add ICTD Recommended row
    rows.push([
      'ICTD Recommended',
      ...comparisonData.suppliers.map((_, idx) => {
        if (recommendations[idx]) {
          return 'Yes';
        } else if (comparisonData.suppliers[idx].autoRecommend === false) {
          return 'No';
        } else {
          return '-';
        }
      })
    ]);

    // Calculate column widths dynamically
    const numSuppliers = comparisonData.suppliers.length;
    const firstColumnWidth = 60;
    const availableWidth = 297 - 28; // A4 landscape width minus margins (14mm each side)
    const supplierColumnWidth = (availableWidth - firstColumnWidth) / numSuppliers;

    // Build columnStyles object dynamically
    const columnStyles = {
      0: {
        cellWidth: firstColumnWidth,
        fontStyle: 'bold',
        overflow: 'linebreak',
        cellPadding: 3,
      }
    };

    // Add styles for each supplier column
    for (let i = 1; i <= numSuppliers; i++) {
      columnStyles[i] = {
        cellWidth: supplierColumnWidth,
        overflow: 'linebreak',
        cellPadding: 3,
      };
    }

    // Add comparison table
    autoTable(doc, {
      startY: startY + 25,
      head: [headers],
      body: rows,
      theme: 'grid',
      tableWidth: 'auto',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        cellWidth: 'wrap',
        halign: 'left',
        valign: 'top',
        minCellHeight: 10,
        lineHeight: 1.2,
      },
      headStyles: {
        fillColor: [240, 240, 240],   // Very light grey background
        textColor: [0, 0, 0],          // Black text
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        overflow: 'linebreak',
        minCellHeight: 10,
        cellPadding: 3,
        lineHeight: 1.2,
      },
      columnStyles: columnStyles,
      didParseCell: function (data) {
        // Ensure consistent line height for all cells
        data.cell.styles.lineHeight = 1.2;

        // Set all body cells to white background by default
        if (data.section === 'body') {
          data.cell.styles.fillColor = [255, 255, 255];
          data.cell.styles.textColor = [0, 0, 0];
        }

        // Keep header with very light grey background
        if (data.section === 'head') {
          data.cell.styles.fillColor = [240, 240, 240];
        }

        // Apply red text for error/non-compliant cells
        if (data.section === 'body' && data.column.index > 0) {
          const rowIdx = data.row.index;

          // Check if this is one of the last two rows (Price or ICTD Recommended)
          const isPriceRow = rowIdx === comparisonData.comparison.length;
          const isRecommendationRow = rowIdx === comparisonData.comparison.length + 1;

          if (!isPriceRow && !isRecommendationRow) {
            const cellIdx = data.column.index - 1;
            const cellKey = `${rowIdx}-${cellIdx}`;
            const cell = comparisonData.comparison[rowIdx].suppliers[cellIdx];
            const isAccepted = acceptedCells[cellKey];

            if (!isAccepted && cell.status === 'error') {
              // Non-compliant cells - red text
              data.cell.styles.textColor = [255, 0, 0];
            }
          }

          // Bold text for ICTD Recommended row
          if (isRecommendationRow) {
            data.cell.styles.fontStyle = 'bold';
          }
        }

        // Bold text for first column (feature names) and last two row labels
        if (data.column.index === 0) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    // Add recommendations section
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Recommendations:', 14, finalY);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    let recY = finalY + 7;

    comparisonData.suppliers.forEach((_, idx) => {
      const supplierKey = `supplier${idx}`;
      const recommendation = recommendations[supplierKey];
      if (recommendation) {
        doc.text(
          `Supplier ${String.fromCharCode(65 + idx)}: ${recommendation}`,
          14,
          recY
        );
        recY += 5;
      }
    });

    // Add comments if present
    if (ite.comments) {
      recY += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Comments:', 14, recY);
      doc.setFont('helvetica', 'normal');
      recY += 5;

      const splitComments = doc.splitTextToSize(ite.comments, 270);
      doc.text(splitComments, 14, recY);
    }

    // Add footer with acceptance information if any cells were accepted
    const acceptedCount = Object.keys(acceptedCells).length;
    if (acceptedCount > 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Note: ${acceptedCount} cell(s) marked with * were manually accepted as compliant.`,
        14,
        doc.internal.pageSize.height - 10
      );
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${ite.iteNumber.replace(/\//g, '-')}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
