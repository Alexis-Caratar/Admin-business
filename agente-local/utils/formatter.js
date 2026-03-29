function formatCOP(value) {
  return "$" + Number(value || 0).toLocaleString("es-CO");
}

function line(width = 32) {
  return "-".repeat(width);
}

function center(text, width = 32) {
  const space = Math.max(0, Math.floor((width - text.length) / 2));
  return " ".repeat(space) + text;
}

function twoCols(left, right, width = 32) {
  const space = width - left.length - right.length;
  return left + " ".repeat(space > 0 ? space : 1) + right;
}

module.exports = {
  formatCOP,
  line,
  center,
  twoCols
};