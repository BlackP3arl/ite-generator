import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const itsFieldsJson = formData.get('itsFields');
    const itsFields = JSON.parse(itsFieldsJson);

    // Dynamic import for pdf-parse - PDFParse is a class in v2
    const { PDFParse } = await import('pdf-parse');

    // Collect supplier files
    const supplierTexts = [];
    for (let i = 0; i < 4; i++) {
      const file = formData.get(`supplier${i}`);
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        const parser = new PDFParse(uint8Array);
        const result = await parser.getText();
        supplierTexts.push(result.text);
      }
    }

    if (supplierTexts.length === 0) {
      return NextResponse.json({ error: 'No supplier files provided' }, { status: 400 });
    }

    // Use Claude to extract and compare supplier data
    const client = new Anthropic();

    // Build the ITS requirements string
    const itsRequirements = itsFields.map(f => `- ${f.feature}: ${f.specification}`).join('\n');

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `You are comparing supplier quotations against Item Technical Specification (ITS) requirements.

## ITS Requirements:
${itsRequirements}

## Supplier Quotations:
${supplierTexts.map((text, idx) => `
### Supplier ${String.fromCharCode(65 + idx)} Quotation:
${text}
`).join('\n')}

## Task:
For each supplier, extract the values that correspond to each ITS requirement field and determine compliance status.

## Compliance Rules:
1. **compliant**: The supplier's value meets or exceeds the requirement
   - For numeric values (e.g., screen size): Equal to or greater than required is compliant. Slightly less (like 23.8" vs 24") should be "warning"
   - For text values: Must match the requirement or be from the allowed options (e.g., Brand must be Dell, HP, or LG if those are specified)
   
2. **warning**: The value needs manual verification
   - Similar but not exact match (e.g., "1-Year Warranty" vs "1-Year Full Replacement Warranty")
   - Numeric values that are close but slightly below spec
   - Wording is different but might mean the same thing
   
3. **error**: The value clearly does not meet the requirement
   - Wrong brand
   - Significantly below spec
   - Missing critical feature
   
4. **na**: The supplier did not provide information for this field

Also extract:
- Delivery time
- Price (unit price excluding GST)

Determine autoRecommend:
- true: If ALL fields are "compliant" (no warnings, errors, or N/A)
- false: If any field has warning, error, or na status

Return ONLY valid JSON in this exact format:
{
  "suppliers": [
    {
      "delivery": "1 Day",
      "price": "3,564.81",
      "autoRecommend": true
    }
  ],
  "comparison": [
    {
      "feature": "Item Type",
      "itsSpec": "Monitor",
      "suppliers": [
        {"value": "Monitor", "status": "compliant"},
        {"value": "Monitor", "status": "compliant"}
      ]
    },
    {
      "feature": "Brand",
      "itsSpec": "Dell, HP, LG",
      "suppliers": [
        {"value": "Dell", "status": "compliant"},
        {"value": "HP", "status": "compliant"}
      ]
    }
  ]
}

Important:
- Return one comparison row for EACH ITS requirement field
- Each comparison row must have a "suppliers" array with entries for EACH supplier (in order A, B, C, D)
- Use "N/A" as the value when information is not available
- Be intelligent about matching - e.g., "FHD 1920x1080 60Hz" matches "FHD 60Hz"
- Consider that suppliers may use different terminology for the same thing
- For input ports, check if all required ports are present (e.g., HDMI and DP)`
        }
      ]
    });

    // Parse Claude's response
    const responseText = message.content[0].text;

    // Extract JSON from response
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    return NextResponse.json(parsed);

  } catch (error) {
    console.error('Error extracting quotes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to extract supplier quotations' },
      { status: 500 }
    );
  }
}
