import { fontVariables } from '../fonts';
import { buildMetadata, viewport } from '../../lib/metadata';
import '../globals.css';
import { INTRO_GATE } from '../introGate';

export const metadata = buildMetadata('en');
export { viewport };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_GATE }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
