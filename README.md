# MCP Client Using LangChain / TypeScript [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/hideya/mcp-langchain-client-ts/blob/main/LICENSE)

This simple [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
client demonstrates the use of MCP server tools by LangChain ReAct Agent.

It leverages a utility function `convertMcpToLangchainTools()` from
[`@h1deya/langchain-mcp-tools`](https://www.npmjs.com/package/@h1deya/langchain-mcp-tools).  
This function handles parallel initialization of specified multiple MCP servers
and converts their available tools into an array of LangChain-compatible tools
([`StructuredTool[]`](https://api.js.langchain.com/classes/_langchain_core.tools.StructuredTool.html)).

LLMs from Anthropic, OpenAI and Groq are currently supported.

A python version of this MCP client is available
[here](https://github.com/hideya/mcp-client-langchain-py)

## Requirements

- Node.js 16+
- API keys from [Anthropic](https://console.anthropic.com/settings/keys),
  [OpenAI](https://platform.openai.com/api-keys), and/or
  [Groq](https://console.groq.com/keys)
  as needed.

## Setup
1. Install dependencies:
    ```bash
    npm install
    ```

2. Setup API keys:
    ```bash
    cp .env.template .env
    ```
    - Update `.env` as needed.
    - `.gitignore` is configured to ignore `.env`
      to prevent accidental commits of the credentials.

3. Configure LLM and MCP Servers settings `llm_mcp_config.json5` as needed.

    - [The configuration file format](https://github.com/hideya/mcp-client-langchain-ts/blob/main/llm_mcp_config.json5)
      for MCP servers follows the same structure as
      [Claude for Desktop](https://modelcontextprotocol.io/quickstart/user),
      with one difference: the key name `mcpServers` has been changed
      to `mcp_servers` to follow the snake_case convention
      commonly used in JSON configuration files.
    - The file format is [JSON5](https://json5.org/),
      where comments and trailing commas are allowed.
    - The format is further extended to replace `${...}` notations
      with the values of corresponding environment variables.
    - Keep all the credentials and private info in the `.env` file
      and refer to them with `${...}` notation as needed.


## Usage

Run the app:
```bash
npm start
```

Run in verbose mode:
```bash
npm run start:v
```

See commandline options:
```bash
npm run start:h
```

At the prompt, you can simply press Enter to use example queries that perform MCP server tool invocations.

Example queries can be configured in  `llm_mcp_config.json5`
