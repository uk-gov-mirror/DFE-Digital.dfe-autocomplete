const clean = (text) => text.trim()
  .replace(/['’]/g, '')
  .replace(/[.,"/#!$%^&*;:{}=\-_`~()]/g, ' ')
  .toLowerCase()

export { clean }
