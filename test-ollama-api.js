// test-ollama-api.js
async function test() {
    try {
      const response = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'phi3:mini',
          prompt: 'Dis bonjour en français',
          stream: false
        })
      });
      
      const data = await response.json();
      console.log('✅ Succès! Réponse:', data.response);
    } catch (error) {
      console.error('❌ Erreur:', error.message);
    }
  }
  
  test();