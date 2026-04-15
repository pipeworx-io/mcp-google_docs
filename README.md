# mcp-google_docs

Google Docs MCP Pack — read, create, and edit Google Docs via OAuth.

Part of the [Pipeworx](https://pipeworx.io) open MCP gateway.

## Tools

| Tool | Description |
|------|-------------|
| `docs_get` | Get a Google Doc by ID — returns title, body content, and document structure. |
| `docs_get_text` | Get the plain text content of a Google Doc. |
| `docs_create` | Create a new Google Doc with a title. |
| `docs_insert_text` | Insert text into a Google Doc at a specified index position. |
| `docs_append_text` | Append text to the end of a Google Doc. |
| `docs_replace_text` | Find and replace text in a Google Doc. |

## Quick Start

Add to your MCP client config:

```json
{
  "mcpServers": {
    "google_docs": {
      "url": "https://gateway.pipeworx.io/google_docs/mcp"
    }
  }
}
```

Or use the CLI:

```bash
npx pipeworx use google_docs
```

## License

MIT
