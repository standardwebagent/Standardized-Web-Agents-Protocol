import fs from 'fs';
fetch('https://raw.githubusercontent.com/standardwebagent/Protocol/main/index.html')
  .then(r => r.text())
  .then(t => fs.writeFileSync('temp_index.html', t));
