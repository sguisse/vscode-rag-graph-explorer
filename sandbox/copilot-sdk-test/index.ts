import { CopilotDelegate } from './backend/src/services/llm-chat/delegate/copilot.delegate';
import { LlmConfigVO, ChatPromptVO, LlmProvider } from './shared/services/llm-chat';

async function main() {
  console.log('=== Test du Delegate GitHub Copilot SDK Singleton ===\n');

  // Récupération de l'instance unique
  const delegate = CopilotDelegate.getInstance();

  // 1. HealthCheck
  console.log('🔍 1. Exécution du HealthCheck...');
  const health = await delegate.healthCheck();
  console.log('Statut:', health);

  // 2. Liste des Modèles
  console.log('\n📋 2. Appel de listModels()...');
  const models = await delegate.listModels();
  console.table(models);

  // 3. Test Chat Execution avec "mai-code-1-flash-picker"
  console.log('\n💬 3. Envoi d\'un message de test avec "mai-code-1-flash-picker"...');
  const config = new LlmConfigVO({ provider: LlmProvider.COPILOT, model: 'mai-code-1-flash-picker' });
  const prompt = new ChatPromptVO([
    {
      id: 'msg-1',
      role: 'user',
      content: 'Hello, world!',
      timestamp: Date.now(),
    },
  ]);

  const result = await delegate.executeChat('session-test-01', prompt, config);
  console.log('\nRésultat du DTO de réponse :');
  console.dir(result, { depth: null });

  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Erreur de test :', error);
  process.exit(1);
});
