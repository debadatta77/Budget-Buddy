import PDFDocument from 'pdfkit';

/**
 * Generates an executive PDF document buffer for a financial statement
 *
 * @param {Object} data
 * @param {string} data.periodName - e.g. "October 2026"
 * @param {Object} data.user - { name, email, planTier }
 * @param {Object} data.summary - { totalIncome, totalExpense, netSavings, savingsRate }
 * @param {Array} data.categories - [{ name, amount, percent }]
 * @param {Array} data.transactions - [{ title, amount, type, category, date }]
 * @returns {Promise<Buffer>}
 */
export const generateExecutiveStatementPDF = ({
  periodName = 'October 2026',
  user = {},
  summary = {},
  categories = [],
  transactions = [],
  sections = {},
  rule503020 = null
} = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', err => reject(err));

      const primaryColor = '#088fff';
      const darkColor = '#111827';
      const greenColor = '#10b981';
      const grayColor = '#6b7280';
      const lightBg = '#f9fafb';

      // 1. Header & Brand
      doc.fillColor(primaryColor).fontSize(22).font('Helvetica-Bold').text('BUDGET BUDDY', 40, 40);
      doc.fillColor(grayColor).fontSize(9).font('Helvetica').text('EXECUTIVE MONTHLY FINANCIAL STATEMENT', 40, 68);

      // Meta Block (Right aligned)
      const metaX = 350;
      doc.fillColor(darkColor).fontSize(9).font('Helvetica-Bold').text(`Period: ${periodName}`, metaX, 40, { align: 'right', width: 200 });
      doc.fillColor(grayColor).font('Helvetica').text(`Account: ${user.name || 'Member'} (${user.email || 'N/A'})`, metaX, 54, { align: 'right', width: 200 });
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, metaX, 68, { align: 'right', width: 200 });

      doc.moveTo(40, 88).lineTo(555, 88).strokeColor('#e5e7eb').lineWidth(1).stroke();

      // 2. KPI Summary Cards
      const totalIncome = Number(summary.totalIncome) || 0;
      const totalExpense = Number(summary.totalExpense) || 0;
      const netSavings = summary.netSavings !== undefined ? Number(summary.netSavings) : (totalIncome - totalExpense);
      const savingsRate = summary.savingsRate || (totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : '0.0');

      const cardWidth = 120;
      const cardHeight = 55;
      const startY = 102;

      const kpis = [
        { label: 'MONTHLY INCOME', val: `Rs. ${totalIncome.toLocaleString('en-IN')}`, color: primaryColor },
        { label: 'TOTAL OUTFLOW', val: `Rs. ${totalExpense.toLocaleString('en-IN')}`, color: darkColor },
        { label: 'NET SURPLUS', val: `${netSavings >= 0 ? '+' : ''}Rs. ${netSavings.toLocaleString('en-IN')}`, color: greenColor },
        { label: 'SAVINGS RATE', val: `${savingsRate}%`, color: primaryColor }
      ];

      kpis.forEach((kpi, idx) => {
        const x = 40 + idx * (cardWidth + 12);
        doc.rect(x, startY, cardWidth, cardHeight).fillColor(lightBg).fillAndStroke('#e5e7eb');
        doc.fillColor(grayColor).fontSize(7.5).font('Helvetica-Bold').text(kpi.label, x + 8, startY + 8);
        doc.fillColor(kpi.color).fontSize(13).font('Helvetica-Bold').text(kpi.val, x + 8, startY + 24);
      });

      let curY = 175;

      // 3. Category Spending Breakdown (if enabled)
      if (sections.categoryBreakdown !== false) {
        doc.fillColor(darkColor).fontSize(12).font('Helvetica-Bold').text('Category Spending Breakdown', 40, curY);
        curY += 18;

        doc.rect(40, curY, 515, 20).fillColor('#f3f4f6').fill();
        doc.fillColor(darkColor).fontSize(8.5).font('Helvetica-Bold');
        doc.text('CATEGORY', 48, curY + 6);
        doc.text('AMOUNT', 340, curY + 6, { width: 90, align: 'right' });
        doc.text('SHARE', 460, curY + 6, { width: 85, align: 'right' });
        curY += 20;

        const topCategories = categories.slice(0, 5);
        if (topCategories.length === 0) {
          doc.fillColor(grayColor).fontSize(8.5).font('Helvetica').text('No category expenses recorded.', 48, curY + 6);
          curY += 20;
        } else {
          topCategories.forEach(c => {
            doc.fillColor(darkColor).fontSize(8.5).font('Helvetica').text(c.name || 'General', 48, curY + 6);
            doc.text(`Rs. ${Number(c.amount).toLocaleString('en-IN')}`, 340, curY + 6, { width: 90, align: 'right' });
            doc.text(`${c.percent}%`, 460, curY + 6, { width: 85, align: 'right' });
            doc.moveTo(40, curY + 20).lineTo(555, curY + 20).strokeColor('#f3f4f6').stroke();
            curY += 20;
          });
        }
        curY += 15;
      }

      // 4. 50/30/20 Budget Breakdown (if enabled)
      if (sections.rule503020 !== false) {
        doc.fillColor(darkColor).fontSize(12).font('Helvetica-Bold').text('50/30/20 Budget Breakdown', 40, curY);
        curY += 18;

        const rNeeds = rule503020?.needs?.actual || (totalIncome > 0 ? Math.min(100, Math.round((totalExpense * 0.6) / totalIncome * 100)) : 50);
        const rWants = rule503020?.wants?.actual || (totalIncome > 0 ? Math.min(100, Math.round((totalExpense * 0.4) / totalIncome * 100)) : 30);
        const rSavings = rule503020?.savings?.actual || savingsRate;

        const ruleWidth = 165;
        const ruleHeight = 44;
        const rules = [
          { label: 'NEEDS (TARGET 50%)', val: `${rNeeds}%`, sub: 'Living Essentials', color: primaryColor },
          { label: 'WANTS (TARGET 30%)', val: `${rWants}%`, sub: 'Lifestyle & Discretionary', color: '#d97706' },
          { label: 'SAVINGS (TARGET 20%)', val: `${rSavings}%`, sub: 'Reserves & Investment', color: greenColor }
        ];

        rules.forEach((r, idx) => {
          const rx = 40 + idx * (ruleWidth + 10);
          doc.rect(rx, curY, ruleWidth, ruleHeight).fillColor(lightBg).fillAndStroke('#e5e7eb');
          doc.fillColor(grayColor).fontSize(7).font('Helvetica-Bold').text(r.label, rx + 8, curY + 6);
          doc.fillColor(r.color).fontSize(12).font('Helvetica-Bold').text(r.val, rx + 8, curY + 18);
          doc.fillColor(grayColor).fontSize(7).font('Helvetica').text(r.sub, rx + 8, curY + 32);
        });

        curY += ruleHeight + 15;
      }

      // 5. Recent Transactions Ledger (if enabled)
      if (sections.transactionLedger !== false) {
        doc.fillColor(darkColor).fontSize(12).font('Helvetica-Bold').text('Significant Activity Specimen', 40, curY);
        curY += 18;

        doc.rect(40, curY, 515, 20).fillColor('#f3f4f6').fill();
        doc.fillColor(darkColor).fontSize(8.5).font('Helvetica-Bold');
        doc.text('DESCRIPTION', 48, curY + 6);
        doc.text('DATE', 240, curY + 6);
        doc.text('CATEGORY', 330, curY + 6);
        doc.text('AMOUNT', 450, curY + 6, { width: 95, align: 'right' });
        curY += 20;

        const topTxs = (transactions || []).slice(0, 6);
        if (topTxs.length === 0) {
          doc.fillColor(grayColor).fontSize(8.5).font('Helvetica').text('No transactions recorded.', 48, curY + 6);
          curY += 20;
        } else {
          topTxs.forEach(t => {
            doc.fillColor(darkColor).fontSize(8.5).font('Helvetica').text(t.title || t.name || 'Transaction', 48, curY + 6, { width: 180, lineBreak: false });
            doc.fillColor(grayColor).text(t.date || '', 240, curY + 6);
            doc.text(t.category || 'General', 330, curY + 6);
            const isInc = t.type === 'income';
            doc.fillColor(isInc ? greenColor : darkColor).font('Helvetica-Bold')
              .text(`${isInc ? '+' : '-'}Rs. ${Number(t.amount).toLocaleString('en-IN')}`, 450, curY + 6, { width: 95, align: 'right' });
            doc.moveTo(40, curY + 20).lineTo(555, curY + 20).strokeColor('#f3f4f6').stroke();
            curY += 20;
          });
        }
      }

      // 6. Compliance Footer
      const footerY = 770;
      doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor('#e5e7eb').stroke();
      doc.fillColor(grayColor).fontSize(7.5).font('Helvetica')
        .text('Budget Buddy - Confidential Financial Statement - Generated via Budget Buddy Financial Engine', 40, footerY + 8, { align: 'center', width: 515 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
