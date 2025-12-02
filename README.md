# ITE Generator

Automate the creation of Item Technical Evaluation (ITE) documents by comparing supplier quotations against Item Technical Specifications (ITS).

## Features

- Upload ITS documents (PDF) and automatically extract specifications
- Review and edit extracted specifications before comparison
- Upload multiple supplier quotation PDFs (up to 4)
- AI-powered intelligent mapping of supplier data to ITS fields
- Color-coded compliance status:
  - ✅ Green: Compliant
  - ⚠️ Yellow: Needs manual verification
  - ❌ Red: Non-compliant or N/A
- Interactive recommendation checkmarks
- Export comparison as HTML

## Prerequisites

- Node.js 18+ installed
- Anthropic API key ([Get one here](https://console.anthropic.com/))

## Local Development Setup

1. Clone or download this project

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the project root:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Add your environment variable in the Vercel dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add `ANTHROPIC_API_KEY` with your API key

### Option 2: Deploy via GitHub

1. Push your code to a GitHub repository

2. Go to [vercel.com](https://vercel.com) and sign in

3. Click "Import Project" and select your GitHub repository

4. Add the environment variable `ANTHROPIC_API_KEY` during setup

5. Click "Deploy"

## Deployment to Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Deploy to Netlify:
   ```bash
   netlify deploy --prod
   ```

4. Add your environment variable in Netlify dashboard:
   - Go to Site settings > Environment variables
   - Add `ANTHROPIC_API_KEY`

**Note**: For Netlify, you may need to add a `netlify.toml` file:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

And install the Netlify Next.js plugin:
```bash
npm install @netlify/plugin-nextjs
```

## Usage Workflow

1. **Upload ITS**: Upload your Item Technical Specification PDF
2. **Confirm Specs**: Review and modify the extracted specifications
3. **Upload Quotes**: Upload supplier quotation PDFs (1-4 files)
4. **Review ITE**: View the comparison table with color-coded compliance
5. **Export**: Download the ITE as an HTML file

## Project Structure

```
ite-generator/
├── app/
│   ├── api/
│   │   ├── extract-its/
│   │   │   └── route.js      # ITS extraction endpoint
│   │   └── extract-quotes/
│   │       └── route.js      # Quote extraction & comparison
│   ├── globals.css           # Styling
│   ├── layout.js             # Root layout
│   └── page.js               # Main application
├── .env.example              # Environment template
├── next.config.js            # Next.js configuration
├── package.json
└── README.md
```

## Customization

### Adding More Fields
Edit the Claude prompts in `app/api/extract-its/route.js` to include additional fields.

### Modifying Compliance Rules
Update the compliance rules in `app/api/extract-quotes/route.js` to match your organization's requirements.

### Styling
Modify `app/globals.css` to customize the appearance.

## Troubleshooting

### API Key Issues
Ensure your `ANTHROPIC_API_KEY` is correctly set in your environment variables.

### PDF Parsing Errors
Some PDFs with complex formatting may not parse correctly. Try using digitally generated PDFs rather than scanned documents.

### Rate Limits
If you encounter rate limits, consider implementing request queuing or using a higher-tier Anthropic plan.

## License

MIT
