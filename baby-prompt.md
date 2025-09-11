# Baby Generation Prompt Engineering System

## Base System Prompt

```
Create a photo-realistic portrait image of a baby/toddler that represents the genetic combination of two parent faces. The image should be:

- Ultra-realistic, professional photography quality
- High resolution portrait (1080x1920 pixels)
- Soft, natural lighting with gentle shadows
- Clear, sharp focus on facial features
- Warm, inviting color palette
- Professional headshot composition
- Baby/toddler with innocent, happy expression
- Smooth, baby-soft skin texture
- Bright, curious eyes
- Natural hair texture appropriate for age

Technical specifications:
- Photo-realistic style, not artistic or stylized
- Portrait orientation suitable for social media sharing
- Professional photography lighting and composition
- Natural background blur (shallow depth of field)
- High detail facial features while maintaining baby-like softness
```

## Dynamic Variables System

### Age Integration
- **1 year old**: "newborn infant, 12 months old, very chubby cheeks, minimal hair, large eyes, very soft facial features"
- **2 years old**: "toddler, 24 months old, round face, developing facial structure, soft baby features, curious expression"
- **3 years old**: "young child, 36 months old, more defined features, playful expression, developing personality in eyes"
- **4 years old**: "preschooler, 4 years old, clearer facial definition, bright intelligent eyes, beginning to lose baby fat"
- **5 years old**: "kindergarten age child, 5 years old, more mature facial structure, confident expression, defined features"

### Gender Specification  
- **Male**: "baby boy, masculine infant features, strong jawline (age appropriate), broader face structure"
- **Female**: "baby girl, feminine infant features, softer jawline, delicate facial structure" 
- **Random**: "gender-neutral baby, balanced facial features, natural expression"

### Similarity Blending System
The similarity percentage determines feature inheritance:

**Example Prompts for Similarity:**
- **0-20%**: "Strongly resembling parent 1, with {parent1_features}, minimal traits from parent 2"
- **21-40%**: "Primarily resembling parent 1, dominant {parent1_features}, subtle {parent2_features}"
- **41-60%**: "Balanced blend of both parents, equal mix of {parent1_features} and {parent2_features}"
- **61-80%**: "Primarily resembling parent 2, dominant {parent2_features}, subtle {parent1_features}"
- **81-100%**: "Strongly resembling parent 2, with {parent2_features}, minimal traits from parent 1"

## Feature Extraction Templates

### Facial Feature Categories:
1. **Eye Shape & Color**: "inherit [parent]'s [eye_shape] eyes and [eye_color] color"
2. **Nose Structure**: "inherit [parent]'s [nose_shape] nose structure"
3. **Mouth & Smile**: "inherit [parent]'s [mouth_shape] mouth and smile"
4. **Face Shape**: "inherit [parent]'s [face_shape] overall face structure"
5. **Hair Color & Texture**: "inherit [parent]'s [hair_color] hair color and [hair_texture] texture"
6. **Skin Tone**: "inherit [parent]'s [skin_tone] complexion"

## Complete Prompt Template

```
Create a photo-realistic portrait of a {age_description} {gender_description} that genetically combines features from two parents with {similarity_percentage}% similarity distribution.

Physical characteristics:
- {age_specific_features}
- {gender_specific_features}  
- {blended_facial_features_based_on_similarity}
- {inherited_eye_characteristics}
- {inherited_nose_characteristics}
- {inherited_mouth_characteristics}
- {inherited_hair_characteristics}
- {inherited_skin_tone}

Photography style:
- Ultra-realistic, professional portrait photography
- Soft natural lighting, warm tones
- Portrait orientation (1080x1920)
- Sharp focus, shallow depth of field
- Professional headshot composition
- Baby/child appropriate happy, innocent expression

The child should be named: {generated_baby_name}

Quality requirements:
- Photo-realistic, not artistic or cartoon-like
- High resolution, professional quality
- Suitable for social media sharing
- Natural, warm, inviting appearance
- Clear facial detail while maintaining age-appropriate softness
```

## Implementation Notes

1. **Model Recommendation**: Use face-morphing or advanced portrait generation models
2. **Image Input**: Process cropped parent faces as base64 high-quality JPEGs (under 1MB)
3. **Output Format**: 1080x1920 portrait orientation for social sharing
4. **Fallback**: If face morphing isn't available, use descriptive prompts with SDXL or similar models
5. **Quality Control**: Implement content filtering for appropriate, family-friendly results

## Prompt Optimization Tips

- Use specific, descriptive language for facial features
- Include lighting and photography terms for realism
- Specify exact age ranges for appropriate development
- Balance feature inheritance based on similarity percentage
- Maintain consistency in style and quality descriptors
- Include safety measures for appropriate content generation