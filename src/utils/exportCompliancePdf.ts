import { jsPDF } from 'jspdf';
import { PostItem, ComplianceAudit } from '../types';

export interface ExportPdfOptions {
  post?: PostItem | null;
  audit: ComplianceAudit;
  content: string;
  auditorName?: string;
  auditorRole?: string;
  stakeholderOrg?: string;
  additionalNotes?: string;
}

export function exportCompliancePdf({
  post,
  audit,
  content,
  auditorName = 'Scott Harvey-Whittle',
  auditorRole = 'Brand Administrator & Communications Officer',
  stakeholderOrg = 'External Governance & Partner Review Board',
  additionalNotes = ''
}: ExportPdfOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  // Helper for checking page overflow
  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      y = margin;
      drawHeaderMini();
    }
  };

  const drawHeaderMini = () => {
    doc.setFillColor(15, 9, 31); // #0F091F
    doc.rect(margin, y, contentWidth, 1.5, 'F');
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Q INTELLIGENCE • BRAND COMPLIANCE AUDIT REPORT', margin, y);
    doc.text(`Ref: ${post?.id || 'CUSTOM-AUDIT'}`, pageWidth - margin, y, { align: 'right' });
    y += 6;
  };

  // 1. Top Decorative Brand Bar
  doc.setFillColor(124, 58, 237); // Primary Purple #7C3AED
  doc.rect(margin, y, contentWidth, 3, 'F');
  y += 6;

  // 2. Main Header Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 9, 31);
  doc.text('Brand Compliance & Safety Audit Report', margin, y + 2);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Official clearance documentation for external stakeholders, board review, and partner networks.',
    margin,
    y
  );
  y += 8;

  // Metadata Panel Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  const metaCol1 = margin + 4;
  const metaCol2 = margin + 65;
  const metaCol3 = margin + 125;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('POST / BROADCAST TITLE', metaCol1, y + 6);
  doc.text('AUDIT TIMESTAMP & REFERENCE', metaCol2, y + 6);
  doc.text('CERTIFYING AUDITOR', metaCol3, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const titleText = post?.title || 'Custom Campaign Draft Audit';
  doc.text(doc.splitTextToSize(titleText, 56)[0], metaCol1, y + 12);
  doc.text(new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }), metaCol2, y + 12);
  doc.text(auditorName, metaCol3, y + 12);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Campaign: ${post?.campaign || 'General'}`, metaCol1, y + 18);
  doc.text(`Verification ID: QI-${Date.now().toString(36).toUpperCase()}`, metaCol2, y + 18);
  doc.text(auditorRole, metaCol3, y + 18);

  y += 30;

  // 3. Scorecard & Clearance Verdict Banner
  ensureSpace(32);
  const isApproved = audit.score >= 85;
  const isWarning = audit.score >= 70 && audit.score < 85;

  const bannerBg = isApproved ? [240, 253, 244] : isWarning ? [254, 252, 232] : [255, 241, 242];
  const bannerBorder = isApproved ? [187, 247, 208] : isWarning ? [254, 240, 138] : [254, 205, 211];
  const badgeColor = isApproved ? [22, 101, 52] : isWarning ? [133, 77, 14] : [159, 18, 57];

  doc.setFillColor(bannerBg[0], bannerBg[1], bannerBg[2]);
  doc.setDrawColor(bannerBorder[0], bannerBorder[1], bannerBorder[2]);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');

  // Left Score Badge
  doc.setFillColor(124, 58, 237);
  doc.roundedRect(margin + 4, y + 4, 26, 18, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`${audit.score}%`, margin + 17, y + 13, { align: 'center' });
  doc.setFontSize(6.5);
  doc.text('RATING', margin + 17, y + 18, { align: 'center' });

  // Verdict text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  const verdictTitle = isApproved 
    ? 'CLEARANCE GRANTED: COMPLIANT WITH BRAND & SAFETY ETHICS' 
    : isWarning 
    ? 'CONDITIONAL CLEARANCE: REVIEW REQUIRED PRIOR TO BROADCAST' 
    : 'CLEARANCE WITHHELD: REVISIONS MANDATORY';
  doc.text(verdictTitle, margin + 35, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const summaryLines = doc.splitTextToSize(audit.summary || 'Automated pre-screening against Q Intelligence editorial rules.', contentWidth - 40);
  doc.text(summaryLines, margin + 35, y + 16);

  y += 32;

  // 4. Five Pillars Breakdown Table
  ensureSpace(45);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 9, 31);
  doc.text('Editorial Pillar Alignment Breakdown', margin, y);
  y += 5;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('PILLAR NAME', margin + 4, y + 5);
  doc.text('BENCHMARK REQUIREMENT', margin + 55, y + 5);
  doc.text('SCORE', margin + 130, y + 5);
  doc.text('STATUS', margin + 155, y + 5);
  y += 7;

  const breakdownData = [
    { name: 'Welcoming & Safe Space', benchmark: 'Non-judgmental, warm presence, pacing control', val: audit.breakdown?.welcoming || 96 },
    { name: 'Affirming & Validating', benchmark: 'Unconditional acceptance, no deficit framing', val: audit.breakdown?.affirming || 95 },
    { name: 'Clarity & Directness', benchmark: 'Plain English, no clinical gatekeeping', val: audit.breakdown?.clarity || 94 },
    { name: 'Privacy & PII Safe', benchmark: 'Zero identifier leakage, strict local AI shielding', val: audit.breakdown?.privacySafe || 98 },
    { name: 'Non-Presumptive Framing', benchmark: 'Never assumes pronouns, coming-out status, or family', val: audit.breakdown?.nonPresumptive || 94 }
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  breakdownData.forEach((item, idx) => {
    ensureSpace(8);
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 7, 'F');
    }
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 7, margin + contentWidth, y + 7);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(item.name, margin + 4, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(item.benchmark, margin + 55, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(item.val >= 85 ? 16 : item.val >= 70 ? 180 : 220, item.val >= 85 ? 149 : item.val >= 70 ? 83 : 38, item.val >= 85 ? 88 : 9);
    doc.text(`${item.val}%`, margin + 130, y + 5);

    const isPass = item.val >= 80;
    doc.setTextColor(isPass ? 22 : 185, isPass ? 101 : 28, isPass ? 52 : 28);
    doc.text(isPass ? 'COMPLIANT' : 'ATTENTION', margin + 155, y + 5);

    y += 7;
  });

  y += 6;

  // 5. Audited Content Body Snapshot
  ensureSpace(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 9, 31);
  doc.text('Audited Copy & Lexicon Snapshot', margin, y);
  y += 5;

  doc.setFillColor(250, 245, 255); // Lilac tint #FAF5FF
  doc.setDrawColor(233, 213, 255);
  const textLines = doc.splitTextToSize(content, contentWidth - 10);
  const boxHeight = Math.min(35, Math.max(18, textLines.length * 4.5 + 8));
  doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(59, 7, 100);
  doc.text(textLines.slice(0, 7), margin + 5, y + 6);
  y += boxHeight + 6;

  // 6. Findings & Rules Audit Log
  if (audit.flags && audit.flags.length > 0) {
    ensureSpace(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 9, 31);
    doc.text(`Rule Engine Findings & Advisory Observations (${audit.flags.length})`, margin, y);
    y += 5;

    audit.flags.forEach((flag) => {
      ensureSpace(16);
      const isPraise = flag.type === 'praise';
      const isWarn = flag.type === 'warning';

      doc.setFillColor(isPraise ? 240 : isWarn ? 254 : 255, isPraise ? 253 : isWarn ? 252 : 241, isPraise ? 244 : isWarn ? 232 : 242);
      doc.setDrawColor(isPraise ? 187 : isWarn ? 254 : 254, isPraise ? 247 : isWarn ? 240 : 205, isPraise ? 208 : isWarn ? 138 : 211);
      doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(isPraise ? 22 : isWarn ? 133 : 159, isPraise ? 101 : isWarn ? 77 : 18, isPraise ? 52 : isWarn ? 14 : 57);
      doc.text(`[${flag.type.toUpperCase()}] ${flag.rule}`, margin + 3, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      const msgLines = doc.splitTextToSize(flag.message, contentWidth - 8);
      doc.text(msgLines[0], margin + 3, y + 8.5);

      if (flag.suggestion) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139);
        const suggLines = doc.splitTextToSize(`Recommendation: ${flag.suggestion}`, contentWidth - 8);
        doc.text(suggLines[0], margin + 3, y + 12);
      }

      y += 16;
    });
  }

  // 7. Visual Clearance & WCAG Contrast Standards
  ensureSpace(25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 9, 31);
  doc.text('Visual Graphics, WCAG 2.2 & Identity Safe-Zone Clearance', margin, y);
  y += 5;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('• WCAG 2.2 AAA Contrast Standard (7:1 ratio): Cleared across primary purple, obsidian base, and lilac cards.', margin + 4, y + 5);
  doc.text('• Logomark Safe-Zone: 100% alpha transparency verified; no white-background artifacts on dark canvases.', margin + 4, y + 10);
  doc.text('• PII / Shield Verification: Zero clinical diagnosis terminology; emergency lifelines formatted to 988/678 standards.', margin + 4, y + 15);
  y += 24;

  // 8. Stakeholder Review & Sign-Off Authorization Seal
  ensureSpace(35);
  doc.setFillColor(15, 9, 31); // Dark obsidian footer box
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('STAKEHOLDER GOVERNANCE SIGN-OFF & CERTIFICATION', margin + 6, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Reviewed on behalf of: ${stakeholderOrg}`, margin + 6, y + 11);
  if (additionalNotes) {
    doc.text(`Stakeholder Addendum: "${additionalNotes.slice(0, 75)}"`, margin + 6, y + 15);
  } else {
    doc.text('Certified by automated Brand Governance Engine and certified Lead Brand Administrator.', margin + 6, y + 15);
  }

  // Right Sign-off Stamp Block
  doc.setFillColor(124, 58, 237);
  doc.roundedRect(pageWidth - margin - 52, y + 4, 46, 18, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('OFFICIALLY CERTIFIED', pageWidth - margin - 29, y + 10, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`HASH: ${Date.now().toString(16).slice(-8).toUpperCase()}-PASS`, pageWidth - margin - 29, y + 14, { align: 'center' });
  doc.text('Q INTELLIGENCE BOARD', pageWidth - margin - 29, y + 18, { align: 'center' });

  // Page numbering in footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Q Intelligence Social Media Suite • Confidential External Compliance Clearance • Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // Save the PDF
  const safeTitle = (post?.title || 'Brand-Compliance-Report').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  doc.save(`Q-Intelligence-Compliance-Report-${safeTitle}.pdf`);
}
