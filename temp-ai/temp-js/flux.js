function escapeForJSON(str) {
  return str
    .replace(/\\/g, "\\\\") // escape backslash
    .replace(/"/g, '\\"') // escape double quote
    .replace(/\n/g, "\\n") // escape newline
    .replace(/\r/g, "\\r") // escape carriage return
    .replace(/\t/g, "\\t"); // escape tab
}

const tweetTextElement = document.querySelectorAll(
  'div[data-testid="tweetText"]'
);
if (tweetTextElement.length > 0) {
  const eLast = tweetTextElement[tweetTextElement.length - 1];

  let t = eLast.textContent.trim(),
    e = t.split(/\s+/),
    l = e.slice(0, 320),
    i = l.join(" ");
  return escapeForJSON(i);
} else return JSON.stringify("");
