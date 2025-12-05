import { GoogleGenAI, Type, Schema } from "@google/genai";
import { CharacterSet, Difficulty, PanelData, CharacterConfig, ColorMode } from "../types";

// Analyze uploaded image to get a visual description
export const analyzeCharacterImage = async (base64Data: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Strip data URL prefix if present
  const base64String = base64Data.includes('base64,') 
    ? base64Data.split('base64,')[1] 
    : base64Data;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { 
            inlineData: { 
              mimeType: 'image/jpeg', // Assuming JPEG/PNG, API is flexible
              data: base64String 
            } 
          },
          { 
            text: "Describe the physical appearance of the main character in this image in detail for an AI image generator. Focus on clothing, hair, colors, and distinct features. Keep it under 40 words. Do not include names." 
          }
        ]
      }
    });
    return response.text || "A unique custom character.";
  } catch (error) {
    console.error("Image analysis failed:", error);
    return "A custom manga character.";
  }
};

const getCharacterPrompt = (config: CharacterConfig): string => {
  if (config.type === CharacterSet.CUSTOM) {
    return `${config.customName || 'The Protagonist'} (described as: ${config.customDescription})`;
  }

  switch (config.type) {
    case CharacterSet.DORAEMON: return "Doraemon (blue robot cat) and Nobita.";
    case CharacterSet.PIKACHU: return "Pikachu and Ash Ketchum.";
    case CharacterSet.SPONGEBOB: return "SpongeBob and Patrick Star.";
    case CharacterSet.SCIENTIST: return "Dr. Einstein-like scientist and assistant.";
    case CharacterSet.ROBOT: return "A friendly high-tech Robot and a human child.";
    case CharacterSet.WIZARD: return "A young Wizard apprentice and their magical pet.";
    case CharacterSet.SUPERHERO: return "A young Superhero.";
    default: return "Mentor and student.";
  }
};

const getVisualCharacterPrompt = (config: CharacterConfig): string => {
  if (config.type === CharacterSet.CUSTOM && config.customDescription) {
    return `A character matching this description: ${config.customDescription}`;
  }

  switch (config.type) {
    case CharacterSet.DORAEMON:
      return "A round blue robot cat with no ears, whiskers, and a white belly pocket, standing next to a young boy with round glasses.";
    case CharacterSet.PIKACHU:
      return "A small chubby yellow cute creature with long pointed black-tipped ears and a lightning bolt tail.";
    case CharacterSet.SPONGEBOB:
      return "A square yellow anthropomorphic sponge with large blue eyes, wearing a white shirt and red tie.";
    case CharacterSet.SCIENTIST:
      return "An eccentric scientist with wild white hair, mustache, and a white lab coat, explaining to a student.";
    case CharacterSet.ROBOT:
      return "A small, cute, white futuristic robot with glowing blue eyes and floating limbs, distinct and clean design.";
    case CharacterSet.WIZARD:
      return "A cute chibi-style wizard wearing a large pointed hat and holding a glowing wooden staff, wearing robes.";
    case CharacterSet.SUPERHERO:
      return "A young energetic superhero wearing a dynamic mask and a flowing cape, comic book style.";
    default:
      return "Two manga characters: a wise mentor figure and a curious student.";
  }
};

const getPanelCount = (difficulty: Difficulty): number => {
  switch (difficulty) {
    case Difficulty.BASIC: return 4;
    case Difficulty.ADVANCED: return 6;
    case Difficulty.DEEP: return 8;
  }
};

export const generateMangaScript = async (
  topic: string,
  difficulty: Difficulty,
  characterConfig: CharacterConfig
): Promise<PanelData[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const count = getPanelCount(difficulty);
  const characterDesc = getCharacterPrompt(characterConfig);

  const systemInstruction = `
    You are an expert educational manga storyboarder.
    Topic: "${topic}"
    Characters: ${characterDesc}
    Format: ${count}-panel comic strip.
    Language: Simplified Chinese (Bubble text).

    Structure Rules:
    - 4 Panels (Basic): 1. Intro/Question, 2. Core Concept 1, 3. Core Concept 2, 4. Summary/Punchline.
    - 6/8 Panels (Advanced/Deep): Must include detailed principle breakdown and life analogies.
    - CRITICAL: For panels explaining the core scientific principle (usually middle panels), specifically describe using a "Blackboard drawing" or "Futuristic Hologram" in the background to visualize the concept (e.g., DNA helix, Atom structure).

    Output Requirements:
    - visualDescription: Instructions for an illustrator. Focus on character acting, camera angle, and background elements (especially the educational props).
    - dialogue: Short, punchy, conversational Chinese text suitable for a manga speech bubble.
  `;

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        panelNumber: { type: Type.INTEGER },
        visualDescription: { type: Type.STRING, description: "Visual description. For educational panels, mention 'Diagram on blackboard' or 'Hologram projection'." },
        dialogue: { type: Type.STRING, description: "Dialogue in Simplified Chinese." },
      },
      required: ["panelNumber", "visualDescription", "dialogue"],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a ${count}-panel educational manga script about: ${topic}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No script generated");
    
    const rawPanels = JSON.parse(text);
    return rawPanels.map((p: any) => ({
      ...p,
      imageState: 'pending'
    }));
  } catch (error) {
    console.error("Script generation error:", error);
    throw error;
  }
};

export const generatePanelImage = async (
  panel: PanelData,
  characterConfig: CharacterConfig,
  colorMode: ColorMode
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const charPrompt = getVisualCharacterPrompt(characterConfig);
  
  // Construct style instructions based on color mode
  let styleInstructions = "";
  
  if (colorMode === ColorMode.B_AND_W) {
    styleInstructions = `
    Black and white manga panel. High quality line art.
    Style Guidelines:
    - Classic Manga Aesthetic: Bold, variable-width black ink lines.
    - Shading: Use "30% dot halftones" (Ben-Day dots) for general background/atmosphere.
    - Emphasis: Use "60% diagonal screentones" (hatching) for shadows, impact, or key objects.
    `;
  } else {
    let paletteTip = "";
    switch (colorMode) {
      case ColorMode.WARM: paletteTip = "Use a warm color palette (oranges, reds, sunny yellows) to create a friendly atmosphere."; break;
      case ColorMode.COOL: paletteTip = "Use a cool color palette (blues, cyans, clean whites) to create a scientific/tech atmosphere."; break;
      case ColorMode.VIBRANT: paletteTip = "Use highly saturated, vibrant, pop-art style colors (CMYK style). High contrast."; break;
      case ColorMode.COLOR: default: paletteTip = "Use a balanced, appealing full-color anime style."; break;
    }

    styleInstructions = `
    Full color manga/anime panel. High quality illustration.
    Style Guidelines:
    - Modern Anime Aesthetic: Clean lines, cel-shaded coloring.
    - Color Palette: ${paletteTip}
    `;
  }

  // Final Prompt Construction
  const prompt = `
    ${styleInstructions}
    
    Subject & Action:
    Characters: ${charPrompt}
    Scene Description: ${panel.visualDescription}
    
    Additional Rules:
    - Backgrounds: If the scene describes a diagram, draw it clearly on a blackboard or as a glowing hologram.
    - NO text bubbles, NO dialogue text in the image.
    - Aspect Ratio 1:1.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: prompt }],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
      if (part.text) {
        console.warn("Model returned text instead of image:", part.text);
      }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
};