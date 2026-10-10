/**
 * Transactional email via SMTP (nodemailer). Credentials come from env:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
 * When SMTP is not configured, sends are skipped (lead still recorded,
 * the API reports emailed:false and the UI copy handles it).
 */
import nodemailer from 'nodemailer';
import type { ListingBrief } from '@/lib/bridge/client';

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendBriefEmail(opts: {
  to: string;
  agentName: string;
  brief: ListingBrief;
  pdf: Buffer;
}): Promise<void> {
  const port = Number(process.env.SMTP_PORT || 465);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const name = escapeHtml(opts.agentName || 'there');
  const mls = escapeHtml(opts.brief.mlsNo);
  const address = escapeHtml(`${opts.brief.address}, ${opts.brief.city}`);
  const price = '$' + Math.round(opts.brief.price).toLocaleString('en-CA');

  await transporter.sendMail({
    from: `The Spy Agency <${from}>`,
    to: opts.to,
    subject: `Your Tactical Market Brief — MLS #${opts.brief.mlsNo}`,
    text: `Hi ${opts.agentName || 'there'},\n\nYour Tactical Market Brief for ${address} (MLS #${mls}, listed at ${price}) is attached.\n\nReady to blanket this market with a co-op campaign? Start here: https://thespyagency.com/\n\n— The Spy Agency\n`,
    html: `
      <div style="margin:0;padding:24px;background:#020617;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:480px;margin:0 auto;background:#0f172a;border:1px solid #14532d;border-radius:12px;overflow:hidden;">
          <div style="padding:20px 24px;border-bottom:1px solid #1e293b;">
            <div style="color:#34d399;font-size:10px;letter-spacing:3px;font-weight:bold;">THE SPY AGENCY</div>
            <div style="color:#ffffff;font-size:16px;font-weight:bold;margin-top:4px;">Tactical Market Brief — Ready</div>
          </div>
          <div style="padding:20px 24px;color:#cbd5e1;font-size:13px;line-height:1.6;">
            <p style="margin:0 0 12px;">Hi ${name},</p>
            <p style="margin:0 0 12px;">Your Tactical Market Brief for <strong style="color:#ffffff;">${address}</strong> (MLS #${mls}, listed at <strong style="color:#ffffff;">${price}</strong>) is attached.</p>
            <p style="margin:0 0 16px;">One page. Market heat, price history, and the comps that matter — generated in seconds from the GVR database.</p>
            <a href="https://thespyagency.com/" style="display:inline-block;padding:10px 18px;background:linear-gradient(90deg,#34d399,#22d3ee);color:#020617;font-weight:bold;font-size:13px;border-radius:8px;text-decoration:none;">Blanket this market →</a>
          </div>
          <div style="padding:14px 24px;color:#64748b;font-size:10px;border-top:1px solid #1e293b;">
            Generated for the listing agent on file · thespyagency.com
          </div>
        </div>
      </div>`,
    attachments: [
      {
        filename: `market-brief-${opts.brief.mlsNo}.pdf`,
        content: opts.pdf,
        contentType: 'application/pdf',
      },
    ],
  });
}
