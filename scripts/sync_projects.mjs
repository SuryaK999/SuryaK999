import fs from 'node:fs';

const USERNAME = process.env.GH_USERNAME || 'SuryaK999';
const TOKEN = process.env.GITHUB_TOKEN || '';

const headers = {
  'Accept': 'application/vnd.github+json',
  'User-Agent': 'SuryaK999-Profile-Sync',
  ...(TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {})
};

function makeActivityBar(score, width = 10) {
  const filled = Math.max(2, Math.min(width, Math.round(score * width)));
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

async function run() {
  const res = await fetch(`https://api.github.com/users/${USERNAME}/repos?sort=updated&per_page=30`, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}: ${await res.text()}`);
  }
  const repos = await res.json();
  const ownRepos = repos.filter(r => !r.fork && r.name.toLowerCase() !== USERNAME.toLowerCase());
  const latest = ownRepos.slice(0, 8);
  const dateStr = new Date().toISOString().slice(0, 10);

  const rows = latest.map((repo, idx) => {
    const lang = repo.language || 'Web / JS';
    const updated = (repo.pushed_at || repo.updated_at || '').slice(0, 10);
    const desc = (repo.description || 'Built by Surya Prakash Kudupudi.').replace(/\|/g, '·');
    const bar = makeActivityBar(Math.min(1, 0.6 + (repo.stargazers_count * 0.1) + (idx < 3 ? 0.25 : 0.1)));
    const homepageLink = repo.homepage ? ` · [Live ↗](${repo.homepage})` : '';
    return `| [**${repo.name}**](${repo.html_url})${homepageLink} | ${desc} | \`${lang}\` | \`${bar}\` | \`${updated}\` · ★ ${repo.stargazers_count} |`;
  });

  const block = [
    `<!-- AUTO-PROJECTS:START -->`,
    `> *Automatically synced with [@${USERNAME}'s public repositories](https://github.com/${USERNAME}?tab=repositories) via GitHub Actions (Last checked: \`${dateStr}\`)*`,
    ``,
    `| Repository | What it does | Primary Stack | Activity | Last Pushed / Stars |`,
    `| :--- | :--- | :--- | :--- | :--- |`,
    ...rows,
    `<!-- AUTO-PROJECTS:END -->`
  ].join('\n');

  const readmePath = 'README.md';
  const readme = fs.readFileSync(readmePath, 'utf8');
  const regex = /<!-- AUTO-PROJECTS:START -->[\s\S]*?<!-- AUTO-PROJECTS:END -->/;
  if (regex.test(readme)) {
    fs.writeFileSync(readmePath, readme.replace(regex, block), 'utf8');
    console.log('Updated AUTO-PROJECTS table in README.md');
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
