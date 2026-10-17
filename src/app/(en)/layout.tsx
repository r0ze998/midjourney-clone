import { fontVariables } from '../fonts';
import { buildMetadata, viewport } from '../../lib/metadata';
import '../globals.css';

export const metadata = buildMetadata('en');
export { viewport };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
