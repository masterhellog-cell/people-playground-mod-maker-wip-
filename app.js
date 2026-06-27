const API_KEY = 'sk-8JOhgKszb6kfsZ7WekU5UgUADXLbdnwmZWx9Sg4d0uPByfSe9qnfTPfo27IymB9z';
const API_URL = '/.netlify/functions/proxy';

let generatedFiles = {
    'script.cs': '',
    'mod.json': ''
};

let currentFile = 'script.cs';

document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const modDescription = document.getElementById('modDescription');
    const codeOutput = document.getElementById('codeOutput');
    const fileTabs = document.querySelectorAll('.file-tab');

    fileTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            fileTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFile = tab.dataset.file;
            codeOutput.textContent = generatedFiles[currentFile] || `// ${currentFile} will appear here...`;
        });
    });

    generateBtn.addEventListener('click', async () => {
        const description = modDescription.value.trim();
        if (!description) {
            alert('Please enter a mod description first!');
            return;
        }

        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';

        try {
            await generateModFiles(description);
            codeOutput.textContent = generatedFiles[currentFile];
            downloadBtn.disabled = false;
        } catch (error) {
            console.error('Error generating mod:', error);
            alert('Error generating mod: ' + error.message);
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate Mod';
        }
    });

    downloadBtn.addEventListener('click', downloadZip);
});

async function generateModFiles(description) {
    const systemPrompt = `You are an expert People Playground mod developer. You create high-quality mods for People Playground.

People Playground mod structure:
- Each mod has a mod.json file (metadata)
- Each mod has a script.cs file (C# code)

Guidelines for People Playground mods:
- Use UnityEngine and People Playground APIs
- Follow the People Playground modding conventions
- Make sure code is clean and well-structured

Your task: Generate both mod.json and script.cs files based on the user's description.

Return ONLY a JSON object with exactly two keys:
- "script.cs": the complete C# code for the mod
- "mod.json": the complete JSON metadata for the mod

Do NOT include any other text, explanations, or markdown formatting. Just the raw JSON.`;

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: 'deepseek-v4-flash-free',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: description
                }
            ],
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API request failed');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let parsed;
    try {
        parsed = JSON.parse(content);
    } catch (e) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
        } else {
            throw new Error('Failed to parse AI response');
        }
    }

    if (parsed['script.cs']) {
        generatedFiles['script.cs'] = parsed['script.cs'];
    }
    if (parsed['mod.json']) {
        generatedFiles['mod.json'] = parsed['mod.json'];
    }
}

function downloadZip() {
    const zip = new JSZip();
    
    zip.file('script.cs', generatedFiles['script.cs']);
    zip.file('mod.json', generatedFiles['mod.json']);
    
    zip.generateAsync({ type: 'blob' }).then(function (content) {
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ppg-mod.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}
