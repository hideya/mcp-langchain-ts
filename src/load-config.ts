// Copyright (C) 2024 Hideya Kawahara
// SPDX-License-Identifier: MIT

import JSON5 from 'json5';
import { readFileSync } from 'fs';

export interface LLMConfig {
  provider: string;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface Config {
  llm: LLMConfig;
  mcpServers: {
    [key: string]: McpServerConfig;
  }
}

export function loadConfig(path: string): Config {
  try {
    let json5Str = readFileSync(path, 'utf-8');

    // Replace environment variables in the format ${VAR_NAME} with their values
    Object.entries(process.env).forEach(([key, value]) => {
      json5Str = json5Str.replace(`\${${key}}`, value || '');
    });

    const config = JSON5.parse(json5Str);

    // Validate required fields
    validateConfig(config);

    return config;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load configuration from "${path}": ${error.message}`);
    }
    throw error;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateConfig(config: any): asserts config is Config {
  if (typeof config !== 'object' || config === null) {
    throw new Error('Configuration must be an object');
  }

  if (!config.llm) {
    throw new Error('LLM configuration is required');
  }
  validateLLMConfig(config.llm);

  if (typeof config.mcpServers !== 'object' || config.mcpServers === null) {
    throw new Error('mcpServers must be an object');
  }

  Object.entries(config.mcpServers).forEach(([key, value]) => {
    try {
      validateMcpServerConfig(value);
    } catch (error) {
      throw new Error(`Invalid configuration for MCP server "${key}": ${error instanceof Error ? error.message : String(error)}`);
    }
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateLLMConfig(llmConfig: any): asserts llmConfig is LLMConfig {
  if (typeof llmConfig !== 'object' || llmConfig === null) {
    throw new Error('LLM configuration must be an object');
  }

  if (typeof llmConfig.provider !== 'string') {
    throw new Error('LLM provider must be a string');
  }

  if (llmConfig.modelName !== undefined && typeof llmConfig.modelName !== 'string') {
    throw new Error('LLM modelName must be a string if provided');
  }

  if (llmConfig.temperature !== undefined && typeof llmConfig.temperature !== 'number') {
    throw new Error('LLM temperature must be a number if provided');
  }

  if (llmConfig.maxTokens !== undefined && typeof llmConfig.maxTokens !== 'number') {
    throw new Error('LLM maxTokens must be a number if provided');
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateMcpServerConfig(serverConfig: any): asserts serverConfig is McpServerConfig {
  if (typeof serverConfig !== 'object' || serverConfig === null) {
    throw new Error('MCP server configuration must be an object');
  }

  if (typeof serverConfig.command !== 'string') {
    throw new Error('MCP server command must be a string');
  }

  if (!Array.isArray(serverConfig.args)) {
    throw new Error('MCP server args must be an array');
  }

  if (serverConfig.args.some((arg: unknown) => typeof arg !== 'string')) {
    throw new Error('All MCP server args must be strings');
  }

  if (serverConfig.env !== undefined) {
    if (typeof serverConfig.env !== 'object' || serverConfig.env === null) {
      throw new Error('MCP server env must be an object if provided');
    }

    // Validate that all env values are strings
    for (const [, value] of Object.entries(serverConfig.env)) {
      if (typeof value !== 'string') {
        throw new Error('All MCP server env values must be strings');
      }
    }
  }
}
