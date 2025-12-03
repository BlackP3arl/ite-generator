import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { applyRateLimit, RATE_LIMITS } from '../../../lib/rateLimit';

export async function POST(request) {
  try {
    // Apply rate limiting for AI endpoints
    const rateLimitResult = applyRateLimit(request, RATE_LIMITS.AI);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        {
          status: 429,
          headers: rateLimitResult.headers
        }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract text from PDF - use named import PDFParse
    const { PDFParse } = await import('pdf-parse');
    const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const parser = new PDFParse(uint8Array);
    const result = await parser.getText();
    const pdfText = result.text;

    // Use Claude to extract structured ITS fields
    const client = new Anthropic();

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are extracting Item Technical Specification (ITS) data from a document. 
          
Extract the following information and return it as a JSON object:

1. Metadata:
   - itsNo: The ITS number (e.g., "ITS/2023/0154")
   - eprf: The EPRF number (e.g., "2023/191")
   - forUser: The person the ITS is for (e.g., "Yoosuf Sameeh")

2. Fields: An array of specification fields. Each field should have:
   - feature: The feature/attribute name (e.g., "Item Type", "Brand", "Screen Size", "Resolution", etc.)
   - specification: The required specification value (e.g., "Monitor", "Dell, HP, LG", "24\"", "FHD 60Hz")

Focus on extracting technical specifications from the table. Include fields like:
- Item Type
- Brand (preferred brands)
- Any technical specifications (size, resolution, ports, etc.)
- Warranty requirements
- Quantity

Do NOT include "Additional Information" or administrative fields like signatures/dates.

Return ONLY valid JSON in this exact format:
{
  "metadata": {
    "itsNo": "...",
    "eprf": "...",
    "forUser": "..."
  },
  "fields": [
    {"feature": "Item Type", "specification": "..."},
    {"feature": "Brand", "specification": "..."},
    ...
  ]
}

Here is the ITS document text:

${pdfText}`
        }
      ]
    });

    // Parse Claude's response
    const responseText = message.content[0].text;

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    return NextResponse.json({
      metadata: parsed.metadata,
      fields: parsed.fields
    });

  } catch (error) {
    // Log detailed error server-side only
    console.error('Error extracting ITS:', error);

    // Return generic error message to client
    return NextResponse.json(
      { error: 'Failed to extract ITS specifications. Please try again or contact support if the issue persists.' },
      { status: 500 }
    );
  }
}
