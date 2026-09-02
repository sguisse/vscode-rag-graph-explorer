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

      // Find incoming edges to update live labels
      const incomingEdges = edges.filter((e) => e.target === node.id);
      incomingEdges.forEach((e) => {
        updateEdgeLabel(e.id, 'Data Flow Active');
      });

      const startTime = performance.now();
      await new Promise((res) => setTimeout(res, 700));

      if (node.type === 'textInput') {
        contextData['prompt'] = node.data.promptText || '';
      } else if (node.type === 'markdownFile') {
        contextData['instruction'] = node.data.instructionText || '';
      } else if (node.type === 'searchTool') {
        contextData['redditData'] = [
          '• React 19 Server Actions deep dive discussion',
          '• Best state management libraries in 2026',
          '• Vite vs Next.js performance benchmarks',
        ].join('\n');
      } else if (node.type === 'script') {
        const scriptType = node.data.scriptType || 'python';
        const location = node.data.scriptLocation || 'scripts/run.py';
        contextData['scriptOutput'] = `[${scriptType.toUpperCase()}] Executed successfully: ${location}`;
        contextData['lastExitCode'] = 0;
      } else if (node.type === 'argument') {
        const name = node.data.argumentName || 'arg';
        const val = node.data.argumentValue || '';
        contextData[`arg_${node.id}`] = `${name}=${val}`;
      } else if (node.type === 'outputAnalyzer') {
        const exitCode = contextData['lastExitCode'] ?? 0;
        const analyzerStatus = exitCode === 0 ? 'OK' : 'KO';
        updateNodeData(node.id, { analyzerStatus });
        contextData['analyzerResult'] = analyzerStatus;
      } else if (node.type === 'aiAgent') {
        const prompt = contextData['prompt'] || 'Analyze React trends';
        const reddit = contextData['redditData'] || '';
        const scriptRes = contextData['scriptOutput'] || '';
        const tokenEstimate = Math.min(node.data.tokenBudget || 1000, 320);

        contextData['agentOutput'] = `### 🤖 AI Agent Synthesis Report\n\n**Input Prompt:** ${prompt}\n\n**Retrieved Context:**\n${reddit}\n\n**Script Execution:**\n${scriptRes}\n\n**Token Usage:** ${tokenEstimate} tokens\n**Recommendation:** Focus on React Server Components, TypeScript type-safety, and automated architecture validation.`;

        // Update outgoing edge labels with token usage badge
        const outgoingEdges = edges.filter((e) => e.source === node.id);
        outgoingEdges.forEach((e) => {
          updateEdgeLabel(e.id, `Tokens used: ${tokenEstimate}`);
        });
      } else if (node.type === 'formattedOutput') {
        const resultText = contextData['agentOutput'] || contextData['scriptOutput'] || 'Flow completed with no output.';
        updateNodeData(node.id, { outputText: resultText });
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
