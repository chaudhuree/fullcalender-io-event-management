const { spawn } = require('child_process');
const path = require('path');

// Start Backend Server
const backend = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'backend'),
  shell: true,
  stdio: 'inherit'
});

console.log('Backend server starting...');

// Start Frontend Server
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  shell: true,
  stdio: 'inherit'
});

console.log('Frontend server starting...');

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping servers...');
  backend.kill();
  frontend.kill();
  process.exit();
});
