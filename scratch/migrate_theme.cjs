const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../src');

const replacements = [
  // Classes
  { regex: /cyber-panel/g, replace: 'detective-panel' },
  { regex: /cyber-input/g, replace: 'detective-input' },
  { regex: /cyber-button-green/g, replace: 'detective-button' },
  { regex: /cyber-button-blue/g, replace: 'detective-button' },
  { regex: /cyber-button/g, replace: 'detective-button' },
  { regex: /glitch-text/g, replace: '' },
  { regex: /flicker-anim/g, replace: '' },
  { regex: /neon-border-[a-z]+/g, replace: 'border-[#c8a050] shadow-[0_0_8px_rgba(200,160,80,0.3)]' },
  { regex: /gradient-border/g, replace: 'border-[#8B6914] border-2 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]' },
  
  // Colors tailwind utility prefixes
  { regex: /text-cyber-green(\/[0-9]+)?/g, replace: 'text-[#d4a017]$1' },
  { regex: /bg-cyber-green(\/[0-9]+)?/g, replace: 'bg-[#d4a017]$1' },
  { regex: /border-cyber-green(\/[0-9]+)?/g, replace: 'border-[#d4a017]$1' },
  { regex: /from-cyber-green(\/[0-9]+)?/g, replace: 'from-[#d4a017]$1' },
  { regex: /via-cyber-green(\/[0-9]+)?/g, replace: 'via-[#d4a017]$1' },
  { regex: /to-cyber-green(\/[0-9]+)?/g, replace: 'to-[#d4a017]$1' },

  { regex: /text-cyber-blue(\/[0-9]+)?/g, replace: 'text-[#a07830]$1' },
  { regex: /bg-cyber-blue(\/[0-9]+)?/g, replace: 'bg-[#a07830]$1' },
  { regex: /border-cyber-blue(\/[0-9]+)?/g, replace: 'border-[#a07830]$1' },
  { regex: /from-cyber-blue(\/[0-9]+)?/g, replace: 'from-[#a07830]$1' },
  { regex: /via-cyber-blue(\/[0-9]+)?/g, replace: 'via-[#a07830]$1' },
  { regex: /to-cyber-blue(\/[0-9]+)?/g, replace: 'to-[#a07830]$1' },

  { regex: /text-cyber-red(\/[0-9]+)?/g, replace: 'text-[#A52A2A]$1' }, // Brownish dark red
  { regex: /bg-cyber-red(\/[0-9]+)?/g, replace: 'bg-[#8B1A1A]$1' },
  { regex: /border-cyber-red(\/[0-9]+)?/g, replace: 'border-[#8B1A1A]$1' },
  { regex: /from-cyber-red(\/[0-9]+)?/g, replace: 'from-[#8B1A1A]$1' },
  { regex: /via-cyber-red(\/[0-9]+)?/g, replace: 'via-[#8B1A1A]$1' },
  { regex: /to-cyber-red(\/[0-9]+)?/g, replace: 'to-[#8B1A1A]$1' },

  { regex: /text-cyber-amber(\/[0-9]+)?/g, replace: 'text-[#c8a050]$1' },
  { regex: /bg-cyber-amber(\/[0-9]+)?/g, replace: 'bg-[#c8a050]$1' },
  { regex: /border-cyber-amber(\/[0-9]+)?/g, replace: 'border-[#c8a050]$1' },
  { regex: /from-cyber-amber(\/[0-9]+)?/g, replace: 'from-[#c8a050]$1' },
  { regex: /via-cyber-amber(\/[0-9]+)?/g, replace: 'via-[#c8a050]$1' },
  { regex: /to-cyber-amber(\/[0-9]+)?/g, replace: 'to-[#c8a050]$1' },

  { regex: /border-cyber-line(\/[0-9]+)?/g, replace: 'border-[rgba(139,105,20,0.4)]$1' },
  { regex: /bg-cyber-line(\/[0-9]+)?/g, replace: 'bg-[rgba(139,105,20,0.4)]$1' },
  { regex: /bg-cyber-bg/g, replace: 'bg-[#151e11]' },
  
  // Specific words/text
  { regex: /HACKER/g, replace: 'DETECTIVE' },
  { regex: /hacker/g, replace: 'detective' },
  { regex: /Hacker/g, replace: 'Detective' },
];

function walk(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let i = 0;
    (function next() {
      let file = list[i++];
      if (!file) return done(null, results);
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            next();
          });
        } else {
          if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
          }
          next();
        }
      });
    })();
  });
}

function processPath(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  let original = content;

  for (const { regex, replace } of replacements) {
    content = content.replace(regex, replace);
  }

  // Clean up double spaces caused by removing glitch/flicker
  content = content.replace(/  +/g, ' ');
  content = content.replace(/ classname="/gi, ' className="');
  content = content.replace(/className="\s+/g, 'className="');
  content = content.replace(/\s+"/g, '"');
  content = content.replace(/\s+`/g, ' `');

  if (content !== original) {
    console.log('Processed', filepath);
    fs.writeFileSync(filepath, content);
  }
}

function run() {
  walk(dir, (err, files) => {
    if (err) throw err;
    files.forEach(processPath);
    console.log('Done.');
  });
}

run();
