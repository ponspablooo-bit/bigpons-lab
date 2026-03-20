export const metadata = {
  title: "BIG PONS — Product Lab",
  description: "Plataforma de desarrollo de productos Big Pons",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, background: "#0D0D0D" }}>
        {children}
      </body>
    </html>
  );
}
