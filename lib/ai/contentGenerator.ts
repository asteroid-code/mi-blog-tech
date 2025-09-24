import { getGroqCompletion, getCohereCompletion, getHuggingFaceInference } from './clients';

interface GeneratedContent {
  title: string;
  content: string;
  summary?: string;
  image_descriptions: string[];
  video_suggestions: string[];
  tags: string[];
  seo_metadata: {
    description: string;
    keywords: string[];
  };
}

async function generateMultimediaContent(topic: string): Promise<GeneratedContent> {
  let outline: string = '';
  let content: string = '';
  let image_descriptions: string[] = [];
  let video_suggestions: string[] = [];
  let tags: string[] = [];
  let seo_metadata: GeneratedContent['seo_metadata'] = { description: '', keywords: [] };
  let title: string = '';
  let summary: string | undefined = undefined;

  // Step 1: Groq for schema and planning (outline)
  try {
    console.log('Generating outline with Groq...');
    outline = await getGroqCompletion([
      {
        role: 'system',
        content: `You are an expert content planner. Generate a detailed outline for an article about "${topic}".
        The outline should include a title, main sections, and key points for each section.
        Also, suggest 5 relevant tags and SEO metadata (description and 5 keywords).
        Format the output as a JSON object with the following structure:
        {
          "title": "Article Title",
          "outline": "Section 1\\n- Point 1\\n- Point 2\\nSection 2\\n- Point 1",
          "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
          "seo_metadata": {
            "description": "SEO friendly description",
            "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
          }
        }`,
      },
      { role: 'user', content: `Generate an outline for an article about "${topic}".` },
    ], 'llama3-70b-8192'); // Using a more capable Groq model for planning

    const parsedOutline = JSON.parse(outline);
    title = parsedOutline.title;
    outline = parsedOutline.outline;
    tags = parsedOutline.tags;
    seo_metadata = parsedOutline.seo_metadata;

    console.log('Groq outline generated successfully.');
  } catch (error) {
    console.error('Groq failed to generate outline:', error);
    // Fallback or re-throw
    throw new Error('Failed to generate article outline.');
  }

  // Step 2: Cohere for drafting content in Spanish
  try {
    console.log('Drafting content with Cohere...');
    const coherePrompt = `Based on the following outline, write a comprehensive article in Spanish.
    Outline:
    ${outline}

    Article Title: ${title}

    Ensure the content is high-quality, engaging, and flows naturally.`;

    content = await getCohereCompletion(coherePrompt);
    console.log('Cohere content drafted successfully.');
  } catch (error) {
    console.error('Cohere failed to draft content:', error);
    // Fallback or re-throw
    throw new Error('Failed to draft article content.');
  }

  // Step 3: HuggingFace for multimedia analysis and suggestions
  try {
    console.log('Analyzing content for multimedia suggestions with HuggingFace...');
    // For image descriptions, we can use a text-to-image prompt generator model
    // For video suggestions, we can use a text summarization or keyword extraction model
    // This is a simplified example, actual implementation would involve specific HF models.

    // Example: Using a generic text generation model to suggest image descriptions
    const imageSuggestionPrompt = `Based on the following article content, suggest 3-5 detailed image descriptions that would be suitable for accompanying the article. Each description should be a short sentence.
    Article Content:
    ${content}

    Format as a JSON array of strings.`;

    const hfImageResponse = await getHuggingFaceInference(
      'HuggingFaceH4/zephyr-7b-beta', // Example model, choose a suitable one
      { inputs: imageSuggestionPrompt, parameters: { max_new_tokens: 200 } }
    );
    image_descriptions = JSON.parse(hfImageResponse[0].generated_text.split('```json')[1].split('```')[0]);

    // Example: Using a generic text generation model to suggest video topics
    const videoSuggestionPrompt = `Based on the following article content, suggest 2-3 short video topics or ideas that would complement the article. Each suggestion should be a short phrase or sentence.
    Article Content:
    ${content}

    Format as a JSON array of strings.`;

    const hfVideoResponse = await getHuggingFaceInference(
      'HuggingFaceH4/zephyr-7b-beta', // Example model, choose a suitable one
      { inputs: videoSuggestionPrompt, parameters: { max_new_tokens: 100 } }
    );
    video_suggestions = JSON.parse(hfVideoResponse[0].generated_text.split('```json')[1].split('```')[0]);

    console.log('HuggingFace multimedia suggestions generated successfully.');
  } catch (error) {
    console.error('HuggingFace failed to generate multimedia suggestions:', error);
    // Fallback or re-throw
    // For now, we'll just log and proceed with empty suggestions if HF fails
  }

  // Generate a summary if not already part of the outline
  try {
    if (!summary) {
      console.log('Generating summary with Groq...');
      const summaryPrompt = `Summarize the following article content in 3-4 sentences in Spanish.
      Article Content:
      ${content}`;
      summary = await getGroqCompletion([
        { role: 'system', content: 'You are a concise summarizer.' },
        { role: 'user', content: summaryPrompt },
      ], 'llama3-8b-8192');
      console.log('Groq summary generated successfully.');
    }
  } catch (error) {
    console.error('Groq failed to generate summary:', error);
    // Proceed without summary if it fails
  }


  return {
    title,
    content,
    summary,
    image_descriptions,
    video_suggestions,
    tags,
    seo_metadata,
  };
}

export { generateMultimediaContent };
