# mcp-google_docs

Google Docs MCP Pack — read, create, and edit Google Docs via OAuth.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 673+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `docs_get` | Retrieve a Google Doc by ID. Returns title, formatted body content, and document structure. |
| `docs_get_text` | Extract plain text from a Google Doc without formatting or structure. Use when you need raw text content only. |
| `docs_create` | Create a new Google Doc with a title. Returns the document ID needed for editing operations. |
| `docs_insert_text` | Insert text at a specific position in a Google Doc (e.g., position 0 for start, position 50 for middle). |
| `docs_append_text` | Add text to the end of a Google Doc. Use when insertion position doesn\'t matter. |
| `docs_replace_text` | Find and replace all occurrences of text in a Google Doc with new text. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "google_docs": {
      "url": "https://gateway.pipeworx.io/google_docs/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 673+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Google_docs data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
