// Copyright (C) 2024 Hideya Kawahara
// SPDX-License-Identifier: MIT

import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { MemorySaver } from '@langchain/langgraph';
import { HumanMessage } from '@langchain/core/messages';
import { convertMcpToLangchainTools, McpServerCleanupFunction } from './langchain-mcp-tools.js';
import { initChatModel } from './init-chat-model.js';
import { loadConfig, Config } from './load-config.js';
import readline from 'readline';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Constants
const SAMPLE_QUERIES = [
  'Whats the weather like in SF tomorrow?',
  'Read and briefly summarize the file ./LICENSE',
  'Read the news headlines on cnn.com?',
  // 'Show me the page cnn.com',
] as const;

const COLORS = {
  YELLOW: '\x1b[33m',
  CYAN: '\x1b[36m',
  RESET: '\x1b[0m'
} as const;

// CLI argument setup
interface Arguments {
  config: string;
  verbose: boolean;
  [key: string]: unknown;
}

const parseArguments = (): Arguments => {
  return yargs(hideBin(process.argv))
    .options({
      config: {
        type: 'string',
        description: 'Path to config file',
        demandOption: false,
        default: './llm-mcp-config.json5',
        alias: 'c',
      },
      verbose: {
        type: 'boolean',
        description: 'Run with verbose logging',
        demandOption: false,
        default: false,
        alias: 'V',
      },
    })
    .help()
    .alias('help', 'h')
    .alias('version', 'v')
    .parseSync() as Arguments;
};

// Input handling
const createReadlineInterface = () => {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
};

const getInput = (rl: readline.Interface, prompt: string): Promise<string> => {
  return new Promise((resolve) => rl.question(prompt, resolve));
};

async function getUserQuery(
  rl: readline.Interface,
  remainingQueries: string[]
): Promise<string | undefined> {
  const input = await getInput(rl, `${COLORS.YELLOW}Query: `);
  process.stdout.write(COLORS.RESET);
  const query = input.trim();

  if (query.toLowerCase() === 'quit' || query.toLowerCase() === 'q') {
    rl.close();
    return undefined;
  }

  if (query === '') {
    const sampleQuery = remainingQueries.shift();
    if (!sampleQuery) {
      console.log('\nPlease type a query, or "quit" or "q" to exit\n');
      return await getUserQuery(rl, remainingQueries);
    }
    process.stdout.write('\x1b[1A\x1b[2K'); // Move up and clear the line
    console.log(`${COLORS.YELLOW}Sample Query: ${sampleQuery}${COLORS.RESET}`);
    return sampleQuery;
  }

  return query;
}

// Conversation loop
async function handleConversation(
  agent: ReturnType<typeof createReactAgent>,
  remainingQueries: string[],
  verbose: boolean
): Promise<void> {
  console.log('\nConversation started. Type "quit" or "q" to end the conversation.\n');
  console.log('Sample Queries (type just enter to supply them one by one):');
  remainingQueries.forEach(query => console.log(`- ${query}`));
  console.log();

  const rl = createReadlineInterface();

  while (true) {
    const query = await getUserQuery(rl, remainingQueries);
    console.log();

    if (!query) {
      console.log(`${COLORS.CYAN}Goodbye!${COLORS.RESET}\n`);
      return;
    }

    const agentFinalState = await agent.invoke(
      { messages: [new HumanMessage(query)] },
      { configurable: { thread_id: 'test-thread' } }
    );

    const result = agentFinalState.messages[agentFinalState.messages.length - 1].content;
    const messageOneBefore = agentFinalState.messages[agentFinalState.messages.length - 2]
    if (messageOneBefore.constructor.name === 'ToolMessage') {
      if (verbose) {
        console.log(messageOneBefore.content);
      }
      console.log(); // give a space
    }

    console.log(`${COLORS.CYAN}${result}${COLORS.RESET}\n`);
  }
}

// Application initialization
async function initializeReactAgent(config: Config) {
  console.log('Initializing model...', config.llm, '\n');
  const llm = initChatModel(config.llm);

  console.log(`Initializing ${Object.keys(config.mcpServers).length} MCP server(s)...\n`);
  const { tools, cleanup } = await convertMcpToLangchainTools(
    config.mcpServers,
    { logLevel: 'info' }
  );

  const agent = createReactAgent({
    llm,
    tools,
    checkpointSaver: new MemorySaver(),
  });

  return { agent, cleanup };
}

// Main
async function main(): Promise<void> {
  let mcpCleanup: McpServerCleanupFunction | undefined;

  try {
    const argv = parseArguments();
    const config = loadConfig(argv.config);

    const { agent, cleanup } = await initializeReactAgent(config);
    mcpCleanup = cleanup;

    await handleConversation(agent, [...SAMPLE_QUERIES], argv.verbose);

  } finally {
    if (mcpCleanup) {
      await mcpCleanup();
    }
  }
}

// Application entry point with error handling
main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
