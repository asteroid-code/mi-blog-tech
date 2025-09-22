import { supabase } from './supabaseClient';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

class QualityChecker {
  private supabase;

  constructor() {
    this.supabase = supabase;
  }

  /**
   * Calcula un hash simple del contenido para la detección de duplicados.
   */
  private calculateContentHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convertir a entero de 32 bits
    }
    return hash.toString();
  }

  /**
   * Detecta contenido duplicado buscando hashes similares en la base de datos.
   */
  async detectDuplicateContent(content: string, articleIdToExclude?: number): Promise<boolean> {
    const contentHash = this.calculateContentHash(content);

    let query = this.supabase
      .from('articles')
      .select('id')
      .eq('content_hash', contentHash);

    if (articleIdToExclude) {
      query = query.neq('id', articleIdToExclude);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error detecting duplicate content:', error);
      return false;
    }

    return (data && data.length > 0);
  }

  /**
   * Detecta baja calidad en el contenido basándose en métricas simples.
   * Puntuación: 0 (muy baja calidad) - 100 (alta calidad)
   */
  async detectLowQuality(content: string): Promise<{ isLowQuality: boolean; score: number }> {
    // Eliminar etiquetas HTML para un análisis de texto puro
    const dom = new JSDOM(content);
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    const plainTextContent = article?.textContent || '';

    const wordCount = plainTextContent.split(/\s+/).filter((word: string) => word.length > 0).length;
    const sentenceCount = plainTextContent.split(/[.!?]+\s*/).filter((sentence: string) => sentence.length > 0).length;

    let score = 100; // Empezar con una puntuación alta

    // Reglas de puntuación (ejemplos, ajustar según necesidad)
    if (wordCount < 100) {
      score -= 30; // Penalización por contenido muy corto
    } else if (wordCount < 200) {
      score -= 15; // Penalización por contenido corto
    }

    if (sentenceCount === 0 && wordCount > 0) {
      score -= 50; // Contenido sin estructura de oraciones
    } else if (wordCount > 0) {
      const avgWordsPerSentence = wordCount / sentenceCount;
      if (avgWordsPerSentence < 5 || avgWordsPerSentence > 30) {
        score -= 20; // Oraciones demasiado cortas o demasiado largas
      }
    }

    // Detección de mayúsculas excesivas (indicador de spam o baja calidad)
    const upperCaseRatio = (plainTextContent.match(/[A-Z]/g) || []).length / plainTextContent.length;
    if (upperCaseRatio > 0.2) { // Más del 20% de mayúsculas
      score -= 25;
    }

    // Detección de enlaces excesivos (posible spam)
    const linkCount = (content.match(/<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/g) || []).length;
    if (linkCount > 5 && wordCount > 0 && linkCount / wordCount > 0.02) { // Más de 2% de enlaces por palabra
      score -= 20;
    }

    // Asegurar que la puntuación esté entre 0 y 100
    score = Math.max(0, Math.min(100, score));

    return {
      isLowQuality: score < 50, // Umbral de baja calidad
      score: Math.round(score),
    };
  }

  /**
   * Realiza una verificación de calidad completa para un artículo.
   */
  async checkArticleQuality(articleId: number, content: string): Promise<{ isDuplicate: boolean; isLowQuality: boolean; qualityScore: number }> {
    const isDuplicate = await this.detectDuplicateContent(content, articleId);
    const { isLowQuality, score: qualityScore } = await this.detectLowQuality(content);

    // Opcional: Actualizar la base de datos con los resultados de la calidad
    await this.supabase
      .from('articles')
      .update({ is_duplicate: isDuplicate, is_low_quality: isLowQuality, quality_score: qualityScore })
      .eq('id', articleId);

    return { isDuplicate, isLowQuality, qualityScore };
  }
}

export const qualityChecker = new QualityChecker();
