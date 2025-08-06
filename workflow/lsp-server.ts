#!/usr/bin/env -S yarn tsx

import {
  type CompletionItem,
  CompletionItemKind,
  createConnection,
  type Diagnostic,
  DiagnosticSeverity,
  DidChangeConfigurationNotification,
  type Hover,
  type InitializeParams,
  type InitializeResult,
  type Location,
  type Position,
  ProposedFeatures,
  type Range,
  type TextDocumentPositionParams,
  TextDocumentSyncKind,
  TextDocuments,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";
import { type Token, WorkflowLexer } from "./lexer";
import { type WorkflowDefinition, WorkflowParser } from "./parser";

// Create a connection for the server
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;

// Cache for parsed workflows
const workflowCache = new Map<string, WorkflowDefinition>();
const tokenCache = new Map<string, Token[]>();

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: ["*", " "],
      },
      hoverProvider: true,
      definitionProvider: true,
      referencesProvider: true,
    },
  };
  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
      },
    };
  }
  return result;
});

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    connection.client.register(
      DidChangeConfigurationNotification.type,
      undefined,
    );
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders((_event: any) => {
      connection.console.log("Workspace folder change event received.");
    });
  }
});

// Parse workflow and cache results
function parseWorkflow(textDocument: TextDocument): {
  workflow: WorkflowDefinition | null;
  tokens: Token[];
  diagnostics: Diagnostic[];
} {
  const text = textDocument.getText();
  const uri = textDocument.uri;
  const diagnostics: Diagnostic[] = [];

  try {
    // Tokenize
    const lexer = new WorkflowLexer(text);
    const tokens = lexer.tokenize();
    tokenCache.set(uri, tokens);

    // Parse
    const parser = new WorkflowParser(tokens);
    const workflow = parser.parse();
    workflowCache.set(uri, workflow);

    // Validate workflow
    const validationDiagnostics = validateWorkflow(workflow, tokens);
    diagnostics.push(...validationDiagnostics);

    return { workflow, tokens, diagnostics };
  } catch (error) {
    // Parse error
    const diagnostic: Diagnostic = {
      severity: DiagnosticSeverity.Error,
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
      },
      message: `Parse error: ${error instanceof Error ? error.message : String(error)}`,
      source: "flow-lsp",
    };
    diagnostics.push(diagnostic);

    return { workflow: null, tokens: [], diagnostics };
  }
}

// Validate workflow and return diagnostics
function validateWorkflow(
  workflow: WorkflowDefinition,
  tokens: Token[],
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  // Check for unreachable states
  const reachableStates = new Set<string>();
  const visitState = (stateName: string) => {
    if (reachableStates.has(stateName)) return;
    reachableStates.add(stateName);

    const transitions = workflow.transitions[stateName];
    if (transitions) {
      for (const transition of Object.values(transitions)) {
        if (transition?.target) {
          visitState(transition.target);
        }
      }
    }
  };

  // Start from initial state
  visitState(workflow.initialState);

  // Find unreachable states
  for (const stateName of Object.keys(workflow.states)) {
    if (stateName !== "*" && !reachableStates.has(stateName)) {
      // Find the line where this state is defined
      const stateToken = tokens.find(
        (token) => token.type === "state" && token.value === stateName,
      );
      if (stateToken) {
        const range = {
          start: {
            line: stateToken.line - 1,
            character: stateToken.column - 1,
          },
          end: {
            line: stateToken.line - 1,
            character: stateToken.column - 1 + stateName.length,
          },
        };
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          range,
          message: `State '${stateName}' is unreachable`,
          source: "flow-lsp",
        });
      }
    }
  }

  // Check for states with no outgoing transitions (except terminal states)
  for (const [stateName, transitions] of Object.entries(workflow.transitions)) {
    if (stateName !== "*" && Object.keys(transitions).length === 0) {
      const stateToken = tokens.find(
        (token) => token.type === "state" && token.value === stateName,
      );
      if (stateToken) {
        const range = {
          start: {
            line: stateToken.line - 1,
            character: stateToken.column - 1,
          },
          end: {
            line: stateToken.line - 1,
            character: stateToken.column - 1 + stateName.length,
          },
        };
        diagnostics.push({
          severity: DiagnosticSeverity.Information,
          range,
          message: `State '${stateName}' has no outgoing transitions (terminal state)`,
          source: "flow-lsp",
        });
      }
    }
  }

  return diagnostics;
}

// Get range from token
function getRangeFromToken(token: Token): Range {
  return {
    start: { line: token.line - 1, character: token.column - 1 },
    end: {
      line: token.line - 1,
      character: token.column - 1 + token.value.length,
    },
  };
}

// Find token at position
function findTokenAtPosition(
  tokens: Token[],
  position: Position,
): Token | null {
  for (const token of tokens) {
    const tokenRange = getRangeFromToken(token);
    if (
      position.line === tokenRange.start.line &&
      position.character >= tokenRange.start.character &&
      position.character <= tokenRange.end.character
    ) {
      return token;
    }
  }
  return null;
}

// Document change handler
documents.onDidChangeContent((change) => {
  const { diagnostics } = parseWorkflow(change.document);
  connection.sendDiagnostics({ uri: change.document.uri, diagnostics });
});

// Completion provider
connection.onCompletion(
  (textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
    const document = documents.get(textDocumentPosition.textDocument.uri);
    if (!document) return [];

    const workflow = workflowCache.get(document.uri);
    const tokens = tokenCache.get(document.uri);
    if (!workflow || !tokens) return [];

    const position = textDocumentPosition.position;

    // Get current line text
    const text = document.getText();
    const lines = text.split("\n");
    const currentLine = lines[position.line] || "";

    const completions: CompletionItem[] = [];

    // If we're after "to ", suggest state names (target states)
    if (
      currentLine.includes(" to ") &&
      position.character > currentLine.indexOf(" to ") + 4
    ) {
      for (const stateName of Object.keys(workflow.states)) {
        const state = workflow.states[stateName];
        completions.push({
          label: stateName,
          kind: CompletionItemKind.Enum,
          detail: `Target State: ${stateName}`,
          documentation: {
            kind: "markdown",
            value: state.guidance
              ? `**${stateName}**\n\n${state.guidance}`
              : `**${stateName}**\n\nWorkflow state`,
          },
        });
      }
    }
    // If we're before " to", suggest source state names
    else if (
      currentLine.includes(" to") &&
      position.character <= currentLine.indexOf(" to")
    ) {
      for (const stateName of Object.keys(workflow.states)) {
        const state = workflow.states[stateName];
        const transitions = workflow.transitions[stateName];
        const outgoingCount = transitions ? Object.keys(transitions).length : 0;

        completions.push({
          label: stateName,
          kind: CompletionItemKind.Enum,
          detail: `Source State: ${stateName} (${outgoingCount} outgoing)`,
          documentation: {
            kind: "markdown",
            value: state.guidance
              ? `**${stateName}**\n\n${state.guidance}`
              : `**${stateName}**\n\nWorkflow state`,
          },
        });
      }
    }
    // If we're at the very beginning of a line (potential source state)
    else if (
      position.character === 0 ||
      (position.character <= currentLine.search(/\S/) &&
        currentLine.search(/\S/) !== -1)
    ) {
      // Only suggest states if we're at the start or in leading whitespace
      if (
        position.character === 0 ||
        currentLine.substring(0, position.character).trim() === ""
      ) {
        // Suggest source states
        for (const stateName of Object.keys(workflow.states)) {
          const state = workflow.states[stateName];
          const transitions = workflow.transitions[stateName];
          const outgoingCount = transitions
            ? Object.keys(transitions).length
            : 0;

          completions.push({
            label: stateName,
            kind: CompletionItemKind.Enum,
            detail: `Source State: ${stateName} (${outgoingCount} outgoing)`,
            documentation: {
              kind: "markdown",
              value: state.guidance
                ? `**${stateName}**\n\n${state.guidance}`
                : `**${stateName}**\n\nWorkflow state`,
            },
          });
        }
      }
    }
    // If we have text but no "to" yet, suggest "to" keyword
    else if (
      !currentLine.includes(" to") &&
      currentLine.trim() !== "" &&
      !currentLine.trim().startsWith(":")
    ) {
      completions.push({
        label: "to",
        kind: CompletionItemKind.Keyword,
        detail: "Transition keyword",
        documentation: "Defines a state transition",
      });
    }
    // If we're after guidance, suggest state names
    else if (currentLine.trim().startsWith(":")) {
      for (const stateName of Object.keys(workflow.states)) {
        const state = workflow.states[stateName];
        const transitions = workflow.transitions[stateName];
        const outgoingCount = transitions ? Object.keys(transitions).length : 0;

        completions.push({
          label: stateName,
          kind: CompletionItemKind.Enum,
          detail: `State: ${stateName} (${outgoingCount} transitions)`,
          documentation: {
            kind: "markdown",
            value: state.guidance
              ? `**${stateName}**\n\n${state.guidance}`
              : `**${stateName}**\n\nWorkflow state`,
          },
        });
      }
    }

    return completions;
  },
);

// Completion resolve
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  return item;
});

// Hover provider
connection.onHover((params): Hover | null => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return null;

  const workflow = workflowCache.get(document.uri);
  const tokens = tokenCache.get(document.uri);
  if (!workflow || !tokens) return null;

  const token = findTokenAtPosition(tokens, params.position);
  if (!token) return null;

  if (token.type === "state" || token.type === "star") {
    const stateName = token.value;
    const state = workflow.states[stateName];
    if (state) {
      const transitions = workflow.transitions[stateName];
      const outgoingTransitions = transitions ? Object.keys(transitions) : [];

      let content = `**State: ${stateName}**\n\n`;
      if (state.guidance) {
        content += `${state.guidance}\n\n`;
      }

      if (outgoingTransitions.length > 0) {
        content += `**Outgoing transitions:**\n`;
        for (const action of outgoingTransitions) {
          const transition = transitions[action];
          content += `- ${action}`;
          if (transition?.guidance) {
            content += `: ${transition.guidance}`;
          }
          content += "\n";
        }
      }

      return {
        contents: {
          kind: "markdown",
          value: content,
        },
      };
    }
  }

  return null;
});

// Go to definition provider
connection.onDefinition((params): Location[] => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return [];

  const workflow = workflowCache.get(document.uri);
  const tokens = tokenCache.get(document.uri);
  if (!workflow || !tokens) return [];

  const token = findTokenAtPosition(tokens, params.position);
  if (!token || (token.type !== "state" && token.type !== "star")) return [];

  const stateName = token.value;

  // Find the first definition of this state (where it appears as a target)
  for (const t of tokens) {
    if ((t.type === "state" || t.type === "star") && t.value === stateName) {
      // Check if this is a target state (preceded by "to")
      const tokenIndex = tokens.indexOf(t);
      if (tokenIndex > 0 && tokens[tokenIndex - 1].type === "to") {
        return [
          {
            uri: document.uri,
            range: getRangeFromToken(t),
          },
        ];
      }
    }
  }

  // If not found as target, return the first occurrence
  for (const t of tokens) {
    if ((t.type === "state" || t.type === "star") && t.value === stateName) {
      return [
        {
          uri: document.uri,
          range: getRangeFromToken(t),
        },
      ];
    }
  }

  return [];
});

// References provider
connection.onReferences((params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return [];

  const workflow = workflowCache.get(document.uri);
  const tokens = tokenCache.get(document.uri);
  if (!workflow || !tokens) return [];

  const token = findTokenAtPosition(tokens, params.position);
  if (!token || (token.type !== "state" && token.type !== "star")) return [];

  const stateName = token.value;
  const references: Location[] = [];

  // Find all occurrences of this state
  for (const t of tokens) {
    if ((t.type === "state" || t.type === "star") && t.value === stateName) {
      references.push({
        uri: document.uri,
        range: getRangeFromToken(t),
      });
    }
  }

  return references;
});

// Make the text document manager listen on the connection
documents.listen(connection);

// Listen on the connection
connection.listen();

console.log("Flow LSP Server started");
