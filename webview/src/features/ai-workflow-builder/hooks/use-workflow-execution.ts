import { useCallback } from 'react';
import { useWorkflowStore } from './use-workflow-store';
import { getTopologicalSortOrder } from '../utils/dag-engine.utils';

export function useWorkflowExecution() {
  const { nodes, edges, updateNodeData, updateEdgeLabel, setIsRunning, addLog } = useWorkflowStore();

  const runWorkflow = useCallback(async () => {
    setIsRunning(true);
    addLog('🚀 Starting AI Workflow Execution Engine...');

    const sortedNodes = getTopologicalSortOrder(nodes, edges);

    // Reset status
    sortedNodes.forEach((node) => {
      updateNodeData(node.id, { status: 'idle' });
    });

    let contextData: Record<string, any> = {};

    for (const node of sortedNodes) {
      addLog(`▶ Running node [${node.data.label}] (${node.id})...`);
      updateNodeData(node.id, { status: 'running' });

      const incomingEdges = edges.filter((e) => e.target === node.id);
      incomingEdges.forEach((e) => {
        updateEdgeLabel(e.id, 'Data Flow Active');
      });

      const startTime = performance.now();
      await new Promise((res) => setTimeout(res, 600));

      let nodeOutput: any = '';

      let primaryInput = '';
      if (incomingEdges.length > 0) {
        const sourceEdge = incomingEdges[0];
        primaryInput = contextData[`output_${sourceEdge.source}`] || contextData['lastOutput'] || '';
      }

      if (node.type === 'textInput') {
        nodeOutput = node.data.promptText || '';
        contextData['prompt'] = nodeOutput;
      } else if (node.type === 'jsonInput') {
        try {
          nodeOutput = JSON.parse(node.data.jsonText || '{}');
        } catch {
          nodeOutput = node.data.jsonText || '';
        }
      } else if (node.type === 'urlInput') {
        const targetUrl = node.data.url || 'https://api.example.com';
        const hasAuth = Boolean(node.data.bearerToken);
        nodeOutput = `[HTTP GET ${targetUrl}] ${hasAuth ? '(Authenticated)' : ''}\n{\n  "status": 200,\n  "data": "Sample response payload"\n}`;
      } else if (node.type === 'markdownFile') {
        nodeOutput = node.data.instructionText || '';
        contextData['instruction'] = nodeOutput;
      } else if (node.type === 'llm') {
        const provider = node.data.llmProvider || 'Ollama';
        const model = node.data.model || 'default-model';
        const prompt = primaryInput || contextData['prompt'] || 'Process input payload';

        const contextFiles = incomingEdges
          .filter((e) => e.targetPort !== 'prompt_in')
          .map((e) => contextData[`output_${e.source}`])
          .filter(Boolean);

        const contextBlock = contextFiles.length > 0 ? `\n\n**Context Files:**\n${contextFiles.join('\n---\n')}` : '';

        nodeOutput = `[${provider} - ${model}] Response:\nSynthesized response for: "${prompt}"${contextBlock}`;
      } else if (node.type === 'replace') {
        const pattern = node.data.replacePattern || '';
        const replaceBy = node.data.replaceBy || '';
        const targetText = primaryInput || node.data.promptText || 'Sample TODO text';

        if (pattern) {
          try {
            const regex = new RegExp(pattern, 'g');
            nodeOutput = targetText.replace(regex, replaceBy);
          } catch {
            nodeOutput = targetText;
          }
        } else {
          nodeOutput = targetText;
        }
      } else if (node.type === 'sanitize') {
        const pattern = node.data.sanitizePattern || '';
        const method = node.data.sanitizeMethod || 'Mask';
        const targetText = primaryInput || 'Data text sample';

        if (pattern) {
          try {
            const regex = new RegExp(pattern, 'g');
            nodeOutput = targetText.replace(regex, (match) => {
              if (method === 'Mask') return '*'.repeat(match.length);
              if (method === 'Redact') return '[REDACTED]';
              if (method === 'MD5' || method === 'Hash') return `[HASH:${Math.abs(match.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0))}]`;
              return '***';
            });
          } catch {
            nodeOutput = targetText;
          }
        } else {
          nodeOutput = targetText;
        }
      } else if (node.type === 'extractData') {
        const pattern = node.data.extractPattern || '';
        const varName = node.data.extractVarName || node.data.outputVariableName || 'extractedVar';
        const targetText = primaryInput || 'User email contact user@example.com';

        if (pattern) {
          try {
            const regex = new RegExp(pattern);
            const match = targetText.match(regex);
            nodeOutput = match ? match[1] || match[0] : '';
          } catch {
            nodeOutput = '';
          }
        } else {
          nodeOutput = targetText;
        }

        if (varName) {
          contextData[varName] = nodeOutput;
          addLog(`📌 Extracted variable [${varName}] = "${nodeOutput}"`);
        }
      } else if (node.type === 'searchTool') {
        nodeOutput = [
          '• React 19 Server Actions deep dive discussion',
          '• Best state management libraries in 2026',
        ].join('\n');
      } else if (node.type === 'script') {
        const scriptType = node.data.scriptType || 'python';
        const location = node.data.scriptLocation || 'scripts/run.py';
        nodeOutput = `[${scriptType.toUpperCase()}] Executed successfully: ${location}`;
        contextData['lastExitCode'] = 0;
      } else if (node.type === 'argument') {
        const name = node.data.argumentName || 'arg';
        const val = node.data.argumentValue || '';
        nodeOutput = `${name}=${val}`;
      } else if (node.type === 'outputAnalyzer') {
        const exitCode = contextData['lastExitCode'] ?? 0;
        const analyzerStatus = exitCode === 0 ? 'OK' : 'KO';
        updateNodeData(node.id, { analyzerStatus });
        nodeOutput = analyzerStatus;
      } else if (node.type === 'aiAgent') {
        const prompt = primaryInput || contextData['prompt'] || 'Analyze React trends';
        nodeOutput = `### 🤖 AI Agent Synthesis Report\n\n**Input:** ${prompt}`;
      } else if (node.type === 'image') {
        if (primaryInput && (primaryInput.startsWith('http') || primaryInput.startsWith('data:image'))) {
          updateNodeData(node.id, { imageUrl: primaryInput });
        }
        nodeOutput = node.data.imageUrl || '';
      } else if (node.type === 'formattedOutput') {
        nodeOutput = primaryInput || 'Flow completed with no output.';
        updateNodeData(node.id, { outputText: String(nodeOutput) });
      }

      contextData[`output_${node.id}`] = nodeOutput;
      contextData['lastOutput'] = nodeOutput;

      if (node.data.outputVariableName) {
        const varName = node.data.outputVariableName.trim();
        if (varName) {
          contextData[varName] = nodeOutput;
          addLog(`📌 Saved node output variable [${varName}] to workflow context.`);
        }
      }

      const executionTimeMs = Math.round(performance.now() - startTime);
      updateNodeData(node.id, { status: 'success', executionTimeMs });
      addLog(`✅ Completed [${node.data.label}] in ${executionTimeMs}ms.`);
    }

    setIsRunning(false);
    addLog('✨ Workflow execution finished successfully!');
  }, [nodes, edges, updateNodeData, updateEdgeLabel, setIsRunning, addLog]);

  return { runWorkflow };
}
