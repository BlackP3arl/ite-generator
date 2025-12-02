import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'ITE Generator - Item Technical Evaluation',
  description: 'Automate the creation of Item Technical Evaluation documents',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
