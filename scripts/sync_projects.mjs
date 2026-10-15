import fs from 'node:fs';

const USERNAME = process.env.GH_USERNAME || 'SuryaK999';
const TOKEN = process.env.GITHUB_TOKEN || '';

const headers = {
  'Accept': 'application/vnd.github+json',
  'User-Agent': 'SuryaK999-ASCII-Telemetry-Engine',
  ...(TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {})
};

function makeAsciiLuminanceBar(score, width = 16) {
  const clamped = Math.max(2, Math.min(width, Math.round(score * width)));
  const chars = ['@', '#', 'W', '8', '&', 'U', '5', '1', 'z', 'r', ':', '.'];
  let bar = '';
  for (let i = 0; i < width; i++) {
    if (i < clamped) {
      const idx = Math.min(chars.length - 3, Math.floor((i / width) * 6));
      bar += chars[idx];
    } else {
      bar += '.';
    }
  }
  return `[${bar}]`;
}

async function run() {
  const res = await fetch(`https://api.github.com/users/${USERNAME}/repos?sort=updated&per_page=30`, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API returned ${res.status}: ${await res.text()}`);
  }
  const repos = await res.json();
  const activeRepos = repos.filter(r => !r.fork && r.name.toLowerCase() !== USERNAME.toLowerCase());

  const topRepos = activeRepos.slice(0, 8);
  const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  const rows = topRepos.map((repo, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    const lang = repo.language || 'Multi-Stack';
    const updated = (repo.pushed_at || repo.updated_at || '').slice(0, 10);
    const desc = (repo.description || 'Thoughtful interface & utility engineered by @SuryaK999.').replace(/\|/g, '/');
    const bar = makeAsciiLuminanceBar(Math.min(1, 0.55 + (repo.stargazers_count * 0.08) + (idx === 0 ? 0.3 : 0.15)));
    return `| \`${num} // ${repo.name.toUpperCase()}.EXE\` | [**${repo.name}**](${repo.html_url}) — ${desc} | \`${lang}\` | \`${bar}\` | \`${updated}\` · ★ \`${repo.stargazers_count}\` |`;
  });

  const block = [
    `<!-- DYNAMIC_PROJECTS:START -->`,
    `> **LIVE TELEMETRY STREAM** · Auto-synced via GitHub API (\`GET /users/${USERNAME}/repos?sort=updated\`) · Last Sync: \`${nowIso}\``,
    ``,
    `| PROCESS ID | REPOSITORY & ARCHITECTURAL PURPOSE | RUNTIME | DENSITY PULSE | UPDATED / STARS |`,
    `| :--- | :--- | :--- | :--- | :--- |`,
    ...rows,
    `<!-- DYNAMIC_PROJECTS:END -->`
  ].join('\n');

  const readmePath = 'README.md';
  const readme = fs.readFileSync(readmePath, 'utf8');
  const regex = /<!-- DYNAMIC_PROJECTS:START -->[\s\S]*?<!-- DYNAMIC_PROJECTS:END -->/;
  if (regex.test(readme)) {
    const updatedReadme = readme.replace(regex, block);
    fs.writeFileSync(readmePath, updatedReadme, 'utf8');
    console.log('Successfully updated DYNAMIC_PROJECTS section in README.md');
  } else {
    console.warn('DYNAMIC_PROJECTS markers not found in README.md');
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
