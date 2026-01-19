curl -X POST 'http://v98store.com/v1/responses' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{ "model": "gpt-5-2025-08-07", "input": [ { "role": "user", "content": [ { "type": "input_text", "text": "1+2+3+4+5....9985" } ] } ], "tools": [], "text": { "format": { "type": "text" }, "verbosity": "medium" }, "reasoning": { "effort": "medium", "summary": "auto" }, "stream": true, "store": true }'