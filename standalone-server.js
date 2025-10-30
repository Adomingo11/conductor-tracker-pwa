// Servidor standalone simple para la aplicación
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Servir archivos estáticos desde dist
app.use(express.static(path.join(__dirname, 'dist')));

// Manejar rutas SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Conductor Tracker ejecutándose en:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Red:     http://192.168.0.52:${PORT}`);
  console.log(`\n📱 Accede desde tu móvil usando la URL de Red`);
});