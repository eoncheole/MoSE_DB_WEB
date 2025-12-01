import './globals.css';

export const metadata = {
  title: 'MoSE DB - Mobility Cybersecurity Lab',
  description: 'Intelligence beyond human scale.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased min-h-screen relative">
         <div className="fixed inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(59,130,246,0.08)_0%,transparent_40%),radial-gradient(circle_at_90%_80%,rgba(99,102,241,0.08)_0%,transparent_40%)] pointer-events-none z-0"></div>
         <div className="relative z-10">
            {children}
         </div>
      </body>
    </html>
  );
}
