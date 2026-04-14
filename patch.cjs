const fs = require('fs');

let code = fs.readFileSync('app/components/AskAlloy.tsx', 'utf8');

// The replacement handleSend code
const newHandleSend = `const handleSend = async (overrideText?: string, overrideImage?: string) => {
        const textToSend = overrideText !== undefined ? overrideText : inputValue;
        const imageToSend = overrideImage || stagedImage || undefined;
        
        if (!textToSend.trim() && !imageToSend) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            content: textToSend,
            image: imageToSend,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        
        if (overrideText === undefined) {
            setInputValue('');
            if (stagedImage && onClearStagedImage) {
                onClearStagedImage();
            }
        }
        setIsTyping(true);

        try {
            const currentModel = AVAILABLE_MODELS.find(m => m.name === selectedModel);
            const provider = currentModel?.provider || 'gemini';

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider,
                    selectedModel,
                    messages,
                    userMessage
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to communicate with AI provider');
            }

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: data.content,
                sender: 'ai',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error("Error fetching model response:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: "Sorry, there was an error processing your request. Please try again.",
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };`;


// The regex matches everything within handleSend.
// Searching from `const handleSend = async` up to the closure after `setIsTyping(false);`
const startIdx = code.indexOf('const handleSend = async');
const endMarker = '} catch (error) {';
if (startIdx !== -1) {
    // Because finding the exact brace is annoying via regex, let's just slice
    const tryBlockStart = code.lastIndexOf('const handleSend');
    // Using simple substring replace is safer if we know exact boundaries, but there are multiple try blocks.
    
    // Let's replace the top imports
    code = code.replace(/import ModelClient.*?\n/, '');
    code = code.replace(/import \{ AzureKeyCredential \}.*?\n/, '');
    
    // the API config
    const apiConfigStart = code.indexOf('// API configuration');
    const apiConfigEnd = code.indexOf('const MODEL_CATEGORIES');
    if (apiConfigStart !== -1 && apiConfigEnd !== -1) {
        code = code.substring(0, apiConfigStart) + code.substring(apiConfigEnd);
    }
    
    // Now replace handleSend precisely
    const startHandleSend = code.indexOf('const handleSend = async');
    const funcEndPattern = '        } catch (error) {';
    const endCatchBlock = code.indexOf('setIsTyping(false);\n        }\n    };', startHandleSend);
    
    if (startHandleSend !== -1 && endCatchBlock !== -1) {
        // plus length of 'setIsTyping(false);\n        }\n    };'
        const trueEnd = endCatchBlock + 'setIsTyping(false);\n        }\n    };'.length;
        code = code.substring(0, startHandleSend) + newHandleSend + code.substring(trueEnd);
    } else {
        console.log("Could not strictly bound handleSend");
    }
}

fs.writeFileSync('app/components/AskAlloy.tsx', code);
console.log('Conversion successful.');