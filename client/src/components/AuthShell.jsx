import { FileUp, ClipboardCheck, Wallet } from 'lucide-react';

const STEPS = [
  {
    Icon: FileUp,
    title: 'Upload your requirements',
    text: 'Submit all 5 documents as PDF during the application period.',
  },
  {
    Icon: ClipboardCheck,
    title: 'Get reviewed online',
    text: 'Track every document and fix anything flagged, with no queueing.',
  },
  {
    Icon: Wallet,
    title: 'Receive your scholarship',
    text: 'Choose a scheduled pickup or a GCash transfer.',
  },
];

export default function AuthShell({ children }) {
  return (
    <div className="auth-wrap">
      <section className="auth-hero">
        <span className="eyebrow">Provincial Scholarship Program</span>
        <h1>Apply for your scholarship without the long lines.</h1>
        <p>For enrolled CvSU students, including TDP, TES and PLDT grantees.</p>
        <ol className="hero-steps">
          {STEPS.map(({ Icon, title, text }) => (
            <li key={title}>
              <span className="hero-step-icon"><Icon size={20} /></span>
              <div>
                <strong>{title}</strong>
                <span>{text}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>
      {children}
    </div>
  );
}