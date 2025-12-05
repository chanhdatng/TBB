/**
 * Image generation utility using Gemini API
 * Generates professional bakery product images for cakes that don't have images
 */

/**
 * Crafts an enhanced prompt for better cake image generation
 */
function craftCakePrompt(cakeName, description) {
  const basePrompt = description || cakeName;

  // Enhanced prompt for better results with professional styling
  return `Professional bakery product photography: ${basePrompt} cake
    Style: Modern, high-end patisserie aesthetic
    Lighting: Soft studio lighting with natural highlights
    Background: Clean white or cream surface with subtle shadows
    Details: Show texture, frosting details, decorative elements
    Quality: Ultra high quality, appetizing, professional food photography
    Mood: Elegant, luxury, artisanal baked goods
    Focus: Prominent display of the cake's most appealing features`;
}

export async function generateCakeImage(cakeName, description) {
  try {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('REACT_APP_GEMINI_API_KEY not configured - skipping image generation');
      return null;
    }

    const prompt = craftCakePrompt(cakeName, description);

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateImages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey
      },
      body: JSON.stringify({
        prompt: prompt,
        number_of_images: 1,
        config: {
          safety_settings: [
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_NONE'
            }
          ]
        }
      })
    });

    if (!response.ok) {
      console.warn(`Failed to generate image for ${cakeName}`);
      return null;
    }

    const data = await response.json();

    if (data.images && data.images.length > 0) {
      // Return base64 encoded image
      return `data:image/png;base64,${data.images[0]}`;
    }

    return null;
  } catch (error) {
    console.warn(`Error generating image for ${cakeName}:`, error);
    return null;
  }
}

/**
 * Generate images for all cakes without images
 */
export async function generateMissingImages(cakes) {
  const updatedCakes = await Promise.all(
    cakes.map(async (cake) => {
      if (!cake.image) {
        const generatedImage = await generateCakeImage(cake.name, cake.description);
        if (generatedImage) {
          return { ...cake, image: generatedImage };
        }
      }
      return cake;
    })
  );

  return updatedCakes;
}
