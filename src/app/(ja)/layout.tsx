import { fontVariables } from '../fonts';
import { buildMetadata, viewport } from '../../lib/metadata';
import '../globals.css';
import { INTRO_GATE } from '../introGate';

export const metadata = buildMetadata('ja');
export { viewport };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={fontVariables}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_GATE }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
