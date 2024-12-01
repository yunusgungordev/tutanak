import { invoke } from '@tauri-apps/api/tauri';

export async function trainAIModel(text: string) {
    try {
        await invoke('train_model', { text });
    } catch (error) {
        console.error('Model eğitimi hatası:', error);
    }
}

export async function generateSimilarText(start: string, length: number = 20): Promise<string> {
    try {
        return await invoke('generate_text', { 
            start, 
            length 
        });
    } catch (error) {
        console.error('Metin üretme hatası:', error);
        return '';
    }
} 