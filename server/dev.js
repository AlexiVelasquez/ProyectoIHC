const { spawn } = require('node:child_process');
const http = require('node:http');

const children = [];
let shuttingDown = false;

function run(label, command, args) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: false
  });

  children.push(child);
  child.on('error', error => {
    console.error(`[${label}] No se pudo iniciar: ${error.message}`);
    shutdown(1);
  });
  child.on('exit', code => {
    if (!shuttingDown && code !== 0) {
      console.error(`[${label}] terminó con código ${code}.`);
      shutdown(code || 1);
    }
  });
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  setTimeout(() => process.exit(code), 200);
}

function apiIsRunning() {
  return new Promise(resolve => {
    const request = http.get('http://localhost:3000/api/health', response => {
      let body = '';
      response.on('data', chunk => body += chunk);
      response.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(response.statusCode === 200 && result.status === 'ok');
        } catch {
          resolve(false);
        }
      });
    });
    request.setTimeout(1500, () => request.destroy());
    request.on('error', () => resolve(false));
  });
}

async function start() {
  console.log('Iniciando Colegio Buenaventura...');
  console.log('La web estará disponible en http://localhost:4200');

  if (await apiIsRunning()) {
    console.log('La API ya estaba activa en http://localhost:3000; se reutilizará.');
  } else {
    run('API', process.execPath, ['server/index.js']);
  }

  run('Angular', process.execPath, [
    'node_modules/@angular/cli/bin/ng.js',
    'serve',
    '--host',
    '0.0.0.0',
    '--proxy-config',
    'proxy.conf.json'
  ]);
}

start().catch(error => {
  console.error(`No se pudo iniciar el sistema: ${error.message}`);
  shutdown(1);
});

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
