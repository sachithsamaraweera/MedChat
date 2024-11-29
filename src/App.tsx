import { useState, useRef, useEffect } from 'react'
import OpenAI from 'openai'
import ReactMarkdown from 'react-markdown'

import './App.css'

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', content: `Role: You are an AI Medi Bot designed to assist healthcare professionals by gathering patient information, suggesting possible diagnoses, and ruling out differential diagnoses with clear reasoning. Your primary goal is to facilitate accurate and efficient diagnosis by asking relevant questions and interpreting patient responses.

Instructions:

Patient Information Collection:
- Start by collecting basic patient information:
  - Name
  - Age
  - Gender
  - Occupation
  - Address
- Gather details about the presenting complaint, including:
  - Onset
  - Duration
  - Nature of symptoms

Symptom Assessment:
- Use structured methods like the SOCRATES approach for pain assessment:
  - Site
  - Onset
  - Character
  - Radiation
  - Associations
  - Time course
  - Exacerbating/relieving factors
  - Severity
- Inquire about associated symptoms and any changes in bowel habits, urinary symptoms, or dietary triggers.

Medical History:
- Inquire about past medical, surgical, allergic, family, and social history.
- Pay attention to lifestyle factors such as smoking, alcohol consumption, and recent travel.

Differential Diagnosis and Exclusion:
- Based on the collected information, suggest possible diagnoses.
- For each potential diagnosis, ask targeted questions to confirm or rule out the condition.
- Provide clear reasoning for ruling out differential diagnoses, referencing specific symptoms or lack thereof.

Investigation and Examination Suggestions:
- Recommend appropriate physical examinations and diagnostic tests to further narrow down the diagnosis.
- Explain the purpose of each suggested test or examination.

Professional and Empathetic Communication:
- Maintain a professional and empathetic tone throughout the interaction.
- Ensure the patient feels heard and understood, and provide reassurance when necessary.

Objective: Assist in the diagnostic process by efficiently gathering relevant information, suggesting possible diagnoses, and providing logical reasoning for ruling out differential diagnoses, all while maintaining a supportive and professional interaction with the patient. Roleplay as doctor and patient, asking one question only at a time and always suggest at least 3 of the patient answer you might think he'll give.

Example Patient Responses:
1. 'My name is John Doe, I'm 45 years old, and I work as a software engineer.'
2. 'I've been experiencing a sharp pain in my lower back for the past three days.'
3. 'The pain started suddenly after I lifted a heavy box.'
4. 'It feels like a stabbing pain that sometimes radiates down my leg.'
5. 'I haven't noticed any changes in my bowel habits or urinary symptoms.'
` },
  ])
  const [input, setInput] = useState('')
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [tempSystemPrompt, setTempSystemPrompt] = useState(messages[0].content);
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_OPENAI_API_KEY || '');
  const [showApiKeyEditor, setShowApiKeyEditor] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return

    try {
      const newMessage: Message = { role: 'user', content: input }
      setMessages([...messages, newMessage])
      setInput('')

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [...messages, newMessage],
      })

      const assistantResponse: Message = {
        role: 'assistant',
        content: completion.choices[0].message?.content ?? '',
      }
      setMessages([...messages, newMessage, assistantResponse])
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'An error occurred while getting the response')
    }
  }

  return (
    <div className="chat-container">
      <div className="header">
        <div className="settings-container" ref={settingsRef}>
          <button 
            className="settings-btn"
            onClick={() => setShowSettings(!showSettings)}
          >
            ⚙️
          </button>
          {showSettings && (
            <div className="settings-menu">
              <button onClick={() => {
                setShowPromptEditor(true);
                setShowSettings(false);
              }}>
                Edit System Prompt
              </button>
              <button onClick={() => {
                setShowApiKeyEditor(true);
                setShowSettings(false);
              }}>
                Change API Key
              </button>
            </div>
          )}
        </div>
      </div>
      
      {showPromptEditor && (
        <div className="prompt-editor-overlay">
          <div className="prompt-editor">
            <h3>Edit System Prompt</h3>
            <textarea
              value={tempSystemPrompt}
              onChange={(e) => setTempSystemPrompt(e.target.value)}
            />
            <div className="prompt-editor-buttons">
              <button onClick={() => {
                setMessages(messages.map((msg, idx) => 
                  idx === 0 ? { ...msg, content: tempSystemPrompt } : msg
                ));
                setShowPromptEditor(false);
              }}>
                Save
              </button>
              <button onClick={() => setShowPromptEditor(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showApiKeyEditor && (
        <div className="prompt-editor-overlay">
          <div className="prompt-editor">
            <h3>Change API Key</h3>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your OpenAI API key"
              className="api-key-input"
            />
            <div className="prompt-editor-buttons">
              <button onClick={() => {
                // Save API key (you might want to add validation here)
                setShowApiKeyEditor(false);
              }}>
                Save
              </button>
              <button onClick={() => setShowApiKeyEditor(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="messages">
        {[...messages]
          .reverse()
          .filter(message => message.role !== 'system')
          .map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              {message.role === 'assistant' ? (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              ) : (
                message.content
              )}
            </div>
          ))}
      </div>
      <div className="input-container">
        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            // Auto-adjust height
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Type your message..."
          rows={1}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
      
      {error && (
        <div className="error-overlay">
          <div className="error-popup">
            <h3>Error</h3>
            <p>{error}</p>
            <button onClick={() => setError(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
