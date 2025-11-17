const { execSync } = require('child_process');

const port = process.argv[2] || '3000';

try {
  const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
  const lines = result.trim().split('\n').filter(line => line.trim());
  const pids = [...new Set(lines.map(line => {
    const parts = line.trim().split(/\s+/);
    return parts[parts.length - 1];
  }).filter(Boolean))];

  if (pids.length > 0) {
    console.log(`🔍 Found ${pids.length} process(es) using port ${port}`);
    pids.forEach(pid => {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        console.log(`✅ Killed process ${pid}`);
      } catch (e) {
        // Process might already be terminated
      }
    });
  } else {
    console.log(`✅ Port ${port} is free`);
  }
} catch (e) {
  // No processes found using the port
  console.log(`✅ Port ${port} is free`);
}

