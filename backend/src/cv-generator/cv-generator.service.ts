import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CvGeneratorService {
  constructor(private readonly prisma: PrismaService) {}

  async generatePdf(): Promise<Buffer> {
    const [personalInfo, experiences, skills, certifications] =
      await Promise.all([
        this.prisma.personalInfo.findFirst(),
        this.prisma.experience.findMany({ orderBy: { startDate: 'desc' } }),
        this.prisma.skill.findMany({
          include: { technology: true },
          orderBy: { sortOrder: 'asc' },
        }),
        this.prisma.certification.findMany({
          include: { organization: true },
          orderBy: { sortOrder: 'asc' },
        }),
      ]);

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── Header ────────────────────────────────────────────────────────────
      const fullName = personalInfo
        ? `${personalInfo.name} ${personalInfo.surname}`.trim()
        : 'Curriculum Vitae';

      doc.fontSize(22).font('Helvetica-Bold').text(fullName, { align: 'center' });
      doc.moveDown(0.3);

      const contactParts: string[] = [];
      if (personalInfo?.email) contactParts.push(personalInfo.email);
      if (personalInfo?.phone) contactParts.push(personalInfo.phone);
      if (personalInfo?.githubUrl) contactParts.push(personalInfo.githubUrl);
      if (personalInfo?.linkedinUrl) contactParts.push(personalInfo.linkedinUrl);

      if (contactParts.length > 0) {
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(contactParts.join('  |  '), { align: 'center' });
      }

      doc.moveDown(1);
      doc
        .moveTo(50, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .stroke();
      doc.moveDown(0.5);

      // ── Experience ────────────────────────────────────────────────────────
      if (experiences.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('Experience');
        doc.moveDown(0.4);

        for (const exp of experiences) {
          const startYear = exp.startDate
            ? new Date(exp.startDate).getFullYear()
            : '';
          const endYear = exp.isCurrent
            ? 'Present'
            : exp.endDate
              ? new Date(exp.endDate).getFullYear()
              : '';
          const period =
            startYear || endYear ? `${startYear} – ${endYear}` : '';

          doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .text(`${exp.role}`, { continued: true })
            .font('Helvetica')
            .text(`  —  ${exp.company}${period ? '  (' + period + ')' : ''}`);

          if (exp.description) {
            doc.fontSize(10).font('Helvetica').text(exp.description, {
              indent: 10,
            });
          }

          doc.moveDown(0.5);
        }

        doc.moveDown(0.3);
      }

      // ── Skills ────────────────────────────────────────────────────────────
      if (skills.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('Skills');
        doc.moveDown(0.4);

        const skillLines = skills.map((s) => {
          const label = s.technology?.label ?? 'Unknown';
          const level =
            s.proficiency !== null && s.proficiency !== undefined
              ? ` (${s.proficiency}%)`
              : '';
          return `${label}${level}`;
        });

        doc
          .fontSize(10)
          .font('Helvetica')
          .text(skillLines.join('   ·   '), { indent: 10 });

        doc.moveDown(0.8);
      }

      // ── Certifications ────────────────────────────────────────────────────
      if (certifications.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('Certifications');
        doc.moveDown(0.4);

        for (const cert of certifications) {
          const orgLabel = cert.organization?.label ?? '';
          const issueYear = cert.issueDate
            ? new Date(cert.issueDate).getFullYear()
            : '';
          const meta = [orgLabel, issueYear ? String(issueYear) : '']
            .filter(Boolean)
            .join(', ');

          doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .text(cert.name, { continued: !!meta })
            .font('Helvetica')
            .text(meta ? `  —  ${meta}` : '');

          doc.moveDown(0.4);
        }
      }

      doc.end();
    });
  }
}
