// src/ai/ml/model-trainer.ts
export class ModelTrainer {
    async train(data: TrainingExample[]): Promise<TrainedModel> {
      // 1. Préparer les données au format conversation
      const formattedData = this.formatForTraining(data);
      
      // 2. Sauvegarder pour l'entraînement
      const trainPath = await this.saveTrainingData(formattedData);
      
      // 3. Lancer l'entraînement avec LoRA (économie de ressources)
      const modelPath = await this.runLoRATraining(trainPath);
      
      // 4. Évaluer le modèle
      const metrics = await this.evaluateModel(modelPath, data.slice(0, 100));
      
      // 5. Sauvegarder la version
      const version = await this.saveModelVersion({
        path: modelPath,
        metrics,
        dataSize: data.length,
        timestamp: Date.now()
      });
      
      return {
        name: `assistant-v${version}`,
        version,
        path: modelPath,
        metrics
      };
    }
    
    private formatForTraining(data: TrainingExample[]): ConversationFormat[] {
      return data.map(example => ({
        messages: [
          {
            role: "user",
            content: example.input
          },
          {
            role: "assistant",
            content: example.output
          }
        ],
        source: example.source,
        weight: example.weight || 1.0
      }));
    }
    
    private async runLoRATraining(trainPath: string): Promise<string> {
      // Utilisation de unsloth pour fine-tuning efficace
      const timestamp = Date.now();
      const outputPath = `./models/assistant/v${timestamp}`;
      
      const command = `
        python -m unsloth.train \
          --model_name tinyllama \
          --train_file ${trainPath} \
          --output_dir ${outputPath} \
          --num_train_epochs 3 \
          --per_device_train_batch_size 2 \
          --gradient_accumulation_steps 4 \
          --learning_rate 2e-4 \
          --lora_r 16 \
          --lora_alpha 32 \
          --lora_dropout 0.05 \
          --bits 4 \
          --double_quant \
          --quant_type nf4
      `;
      
      await exec(command);
      
      // Convertir pour Ollama
      await this.convertToOllamaFormat(outputPath, `assistant-v${timestamp}`);
      
      return outputPath;
    }
    
    private async evaluateModel(modelPath: string, testData: TrainingExample[]): Promise<ModelMetrics> {
      const model = await this.loadModel(modelPath);
      let correct = 0;
      const predictions = [];
      
      for (const example of testData) {
        const prediction = await model.generate(example.input);
        const similarity = this.calculateSimilarity(prediction, example.output);
        
        if (similarity > 0.8) correct++;
        predictions.push({ expected: example.output, got: prediction, score: similarity });
      }
      
      return {
        accuracy: correct / testData.length,
        predictions,
        timestamp: Date.now()
      };
    }
  }