const { execSync } = require('child_process');

console.log('🚀 Iniciando despliegue a producción...');

try {
  // Build para producción
  console.log('📦 Compilando para producción...');
  execSync('npm run build', { stdio: 'inherit' });

  // Verificar build exitoso
  console.log('✅ Build completado exitosamente');

  // Desplegar (Vercel automático con git push)
  console.log('🌐 Despliegue listo - Los cambios se desplegarán automáticamente');

} catch (error) {
  console.error('❌ Error en despliegue:', error.message);
  process.exit(1);
}
