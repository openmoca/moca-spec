# Grounding for AI agents

An AI agent answers questions and takes steps using tools. To do that well it
needs knowledge it can search, cite and trust: the current procedure, the
policy in force, the steps in the right order. Today each agent framework has
its own retrieval, so the same knowledge is loaded again for every agent, and
it arrives without its version, its sources or its structure.

**With MOCA, one package grounds any agent.** The same signed package is read
the same way whether the agent reaches it over MCP, through its framework, or
in-process, and every answer comes with citations the agent can pass on.

## Ways in

| Your agent runs on | Use | What the agent gets |
| --- | --- | --- |
| Any MCP client (Claude Desktop, Cursor, VS Code, your own) | The MOCA MCP server, [`moca-mcp`](https://github.com/openmoca/moca-mcp-dotnet#readme): one download with nothing to install | Tools to list packages, search, fetch a page and ask structure questions, and every page as a resource |
| Microsoft Agent Framework (.NET) | `OpenMoca.Reader.AgentFramework` | A context provider that searches before each turn, and `moca_search`, `moca_get_node` and `moca_structure` tools |
| LangChain or LangGraph (Python) | `moca-reader-langchain` | A retriever that returns citation records as Documents |
| LlamaIndex (Python) | `moca-reader-llamaindex` | A retriever that returns citation records as scored nodes |
| Anything else | A MOCA Reader in TypeScript, .NET or Python | Search, structure and citation records in-process, to wrap in your own tools |

Whichever way in, the Reader applies the same trust rules: signatures checked
against your trust root, content that is out of force or superseded left out,
and an audience the agent cannot widen.

## What agents can do with it

- **Cite.** Every result is a citation record with a versioned reference, so
  the agent can say which page of which package version an answer came from.
  The [AG-UI citations event](../spec/moca-ag-ui-citations.md) carries those
  records to a user interface, so it can show the sources beside the answer.
- **Follow steps in order.** With a package's structure, an agent can ask
  what a step requires and what comes next, and ontology-guided search adds
  the prerequisites of a result ([ontology](ontology.md)).
- **Stay in scope.** Search can be limited to a topic, and the host decides
  the audience: content labelled for another audience, or not labelled at
  all, is removed before the agent sees it, and the agent cannot widen the
  filter. Audience is a label, not access control: the package file itself
  can be read by anyone who has it.
- **Work offline.** The MCP server and the Readers run locally, with no
  outside calls ([sovereign and offline AI](sovereign-ai.md)).

## Safe by design

- **Knowledge, never instructions.** A package carries knowledge, not prompts,
  skills or tools for an agent to run
  ([ADR-0011](adr/0011-park-unconsumed-features.md)). The MCP server's tool
  descriptions tell the model to quote and cite package text, not follow it.
- **Treat package text as untrusted input**, whoever signed it
  ([Reader contract §12](../spec/moca-reader-contract.md#12-handing-content-to-a-model)).
- **The host stays in charge.** Trust, audience and which packages are loaded
  are set when the server or Reader starts; nothing a caller or a package
  says changes them.

## Try it

The [walkthrough](walkthrough.md#8-serve-it-to-an-ai-agent) serves a package
to an AI agent over MCP in fifteen minutes. [moca-examples](https://github.com/openmoca/moca-examples#readme)
has a chat agent over a package in TypeScript and .NET.
