interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Google Docs MCP Pack — read, create, and edit Google Docs via OAuth.
 * Reuses the google_sheets OAuth connection (same Google OAuth client + scopes).
 */


interface GoogleContext {
  google_docs?: { accessToken: string };
}

const API = 'https://docs.googleapis.com/v1/documents';

async function gFetch(ctx: GoogleContext, url: string, options: RequestInit = {}) {
  if (!ctx.google_docs) {
    return { error: 'connection_required', message: 'Connect your Google account at https://pipeworx.io/account' };
  }
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${ctx.google_docs.accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Docs API error (${res.status}): ${text}`);
  }
  return res.json();
}

const tools: McpToolExport['tools'] = [
  {
    name: 'docs_get',
    description: 'Get a Google Doc by ID — returns title, body content, and document structure.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        document_id: { type: 'string', description: 'Document ID (from the URL)' },
      },
      required: ['document_id'],
    },
  },
  {
    name: 'docs_get_text',
    description: 'Get the plain text content of a Google Doc.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        document_id: { type: 'string', description: 'Document ID' },
      },
      required: ['document_id'],
    },
  },
  {
    name: 'docs_create',
    description: 'Create a new Google Doc with a title.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Title for the new document' },
      },
      required: ['title'],
    },
  },
  {
    name: 'docs_insert_text',
    description: 'Insert text into a Google Doc at a specified index position.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        document_id: { type: 'string', description: 'Document ID' },
        text: { type: 'string', description: 'Text to insert' },
        index: { type: 'number', description: 'Character index to insert at (1 = start of body)' },
      },
      required: ['document_id', 'text'],
    },
  },
  {
    name: 'docs_append_text',
    description: 'Append text to the end of a Google Doc.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        document_id: { type: 'string', description: 'Document ID' },
        text: { type: 'string', description: 'Text to append' },
      },
      required: ['document_id', 'text'],
    },
  },
  {
    name: 'docs_replace_text',
    description: 'Find and replace text in a Google Doc.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        document_id: { type: 'string', description: 'Document ID' },
        find: { type: 'string', description: 'Text to find' },
        replace: { type: 'string', description: 'Replacement text' },
        match_case: { type: 'boolean', description: 'Case-sensitive match (default: false)' },
      },
      required: ['document_id', 'find', 'replace'],
    },
  },
];

function extractPlainText(doc: Record<string, unknown>): string {
  const body = doc.body as { content?: Array<{ paragraph?: { elements?: Array<{ textRun?: { content?: string } }> } }> } | undefined;
  if (!body?.content) return '';
  return body.content
    .flatMap((block) => block.paragraph?.elements ?? [])
    .map((el) => el.textRun?.content ?? '')
    .join('');
}

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const context = (args._context ?? {}) as GoogleContext;
  delete args._context;

  switch (name) {
    case 'docs_get':
      return gFetch(context, `${API}/${args.document_id}`);

    case 'docs_get_text': {
      const doc = await gFetch(context, `${API}/${args.document_id}`) as Record<string, unknown>;
      if (doc.error) return doc;
      return { title: doc.title, text: extractPlainText(doc) };
    }

    case 'docs_create':
      return gFetch(context, API, {
        method: 'POST',
        body: JSON.stringify({ title: args.title }),
      });

    case 'docs_insert_text': {
      const index = (args.index as number) ?? 1;
      return gFetch(context, `${API}/${args.document_id}:batchUpdate`, {
        method: 'POST',
        body: JSON.stringify({
          requests: [{ insertText: { location: { index }, text: args.text } }],
        }),
      });
    }

    case 'docs_append_text': {
      // Get doc to find end index, then insert there
      const doc = await gFetch(context, `${API}/${args.document_id}`) as Record<string, unknown>;
      if (doc.error) return doc;
      const body = doc.body as { content?: Array<{ endIndex?: number }> } | undefined;
      const endIndex = body?.content?.at(-1)?.endIndex ?? 1;
      // Insert before the final newline
      const insertAt = Math.max(1, endIndex - 1);
      return gFetch(context, `${API}/${args.document_id}:batchUpdate`, {
        method: 'POST',
        body: JSON.stringify({
          requests: [{ insertText: { location: { index: insertAt }, text: args.text } }],
        }),
      });
    }

    case 'docs_replace_text':
      return gFetch(context, `${API}/${args.document_id}:batchUpdate`, {
        method: 'POST',
        body: JSON.stringify({
          requests: [{
            replaceAllText: {
              containsText: { text: args.find, matchCase: args.match_case ?? false },
              replaceText: args.replace,
            },
          }],
        }),
      });

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export default { tools, callTool, meter: { credits: 10 }, provider: 'google_docs' } satisfies McpToolExport;
