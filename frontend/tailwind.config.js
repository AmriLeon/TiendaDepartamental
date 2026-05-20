/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          900: '#150016', // Oscuro profundo (Navbar, Títulos principales)
          800: '#29104A', // Morado oscuro (Hover de navbar, Footer)
          600: '#522C5D', // Morado medio (Botones de acción, Acentos)
          400: '#845162', // Rosa medio (Hover de botones, Bordes fuertes)
          200: '#E3B6B1', // Rosa claro (Fondos de tarjetas alternativas, Etiquetas)
          50: '#FFE3D8',  // Muy claro (Fondo de la página principal)
        }
      }
    },
  },
  plugins: [],
}
