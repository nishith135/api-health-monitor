// Returns a short unique id prefixed with chk_ for correlating a single poll check.
function generateCheckId() {
  let suffix = "";
  while (suffix.length < 6) {
    suffix += Math.random().toString(36).slice(2);
  }
  return `chk_${suffix.slice(0, 6)}`;
}

module.exports = {
  generateCheckId
};
