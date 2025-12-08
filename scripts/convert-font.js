const opentype = require('opentype.js');
const fs = require('fs');

const inputPath = '/tmp/kanit/Kanit-ExtraBoldItalic.ttf';
const outputPath = './public/fonts/kanit-extrabold-italic.typeface.json';

const font = opentype.loadSync(inputPath);

// Scale factor to normalize to 1000 units
const scale = 1000 / font.unitsPerEm;

// Convert to Three.js typeface.json format
const glyphs = {};

for (let i = 0; i < font.glyphs.length; i++) {
  const glyph = font.glyphs.get(i);
  if (glyph.unicode !== undefined) {
    const char = String.fromCharCode(glyph.unicode);
    
    // Get path commands at the font's native scale, then we'll convert
    const path = glyph.getPath(0, 0, font.unitsPerEm);
    
    // Build the path string - note: Three.js expects y-down, but fonts are y-up
    // We need to FLIP the y coordinates
    let pathStr = '';
    
    for (const cmd of path.commands) {
      // Flip Y by negating it (Three.js font format expects flipped Y)
      if (cmd.type === 'M') {
        pathStr += `m ${Math.round(cmd.x * scale)} ${Math.round(-cmd.y * scale)} `;
      } else if (cmd.type === 'L') {
        pathStr += `l ${Math.round(cmd.x * scale)} ${Math.round(-cmd.y * scale)} `;
      } else if (cmd.type === 'Q') {
        pathStr += `q ${Math.round(cmd.x1 * scale)} ${Math.round(-cmd.y1 * scale)} ${Math.round(cmd.x * scale)} ${Math.round(-cmd.y * scale)} `;
      } else if (cmd.type === 'C') {
        pathStr += `b ${Math.round(cmd.x1 * scale)} ${Math.round(-cmd.y1 * scale)} ${Math.round(cmd.x2 * scale)} ${Math.round(-cmd.y2 * scale)} ${Math.round(cmd.x * scale)} ${Math.round(-cmd.y * scale)} `;
      } else if (cmd.type === 'Z') {
        pathStr += 'z ';
      }
    }

    glyphs[char] = {
      ha: Math.round(glyph.advanceWidth * scale),
      o: pathStr.trim()
    };
  }
}

const result = {
  glyphs: glyphs,
  familyName: font.names.fontFamily.en,
  ascender: Math.round(font.ascender * scale),
  descender: Math.round(font.descender * scale),
  underlinePosition: Math.round((font.tables.post?.underlinePosition || -100) * scale),
  underlineThickness: Math.round((font.tables.post?.underlineThickness || 50) * scale),
  boundingBox: {
    yMin: Math.round(font.tables.head.yMin * scale),
    xMin: Math.round(font.tables.head.xMin * scale),
    yMax: Math.round(font.tables.head.yMax * scale),
    xMax: Math.round(font.tables.head.xMax * scale)
  },
  resolution: 1000,
  original_font_information: {
    format: 0,
    copyright: font.names.copyright?.en || '',
    fontFamily: font.names.fontFamily?.en || '',
    fontSubfamily: font.names.fontSubfamily?.en || '',
    uniqueID: font.names.uniqueID?.en || '',
    fullName: font.names.fullName?.en || '',
    version: font.names.version?.en || '',
    postScriptName: font.names.postScriptName?.en || ''
  }
};

fs.writeFileSync(outputPath, JSON.stringify(result));
console.log(`Converted ${inputPath} to ${outputPath}`);
console.log(`Total glyphs: ${Object.keys(glyphs).length}`);
