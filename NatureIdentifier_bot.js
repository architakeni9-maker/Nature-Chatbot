import React, { useState, useRef } from 'react';
import { Camera, Upload, Send, Loader2, Bird, Leaf } from 'lucide-react';

export default function NatureIdentifierBot() {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: "👋 Hello! I'm your Nature Identifier assistant. Upload an image of a bird or plant, and I'll help you identify it and share fascinating details about it!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage({
          url: event.target.result,
          file: file
        });
        setMessages(prev => [...prev, {
          type: 'user',
          text: 'Image uploaded',
          image: event.target.result,
          timestamp: new Date()
        }]);
        identifyNature(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const identifyNature = async (imageData) => {
    setIsLoading(true);
    
    try {
      const base64Data = imageData.split(',')[1];
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: base64Data
                  }
                },
                {
                  type: 'text',
                  text: `Please identify this bird or plant and provide:
1. Common name and scientific name
2. Key identifying features
3. Natural habitat and where to find them
4. Typical behavior (for birds) or growing conditions (for plants)
5. Life expectancy
6. 2-3 interesting fun facts

Format your response in a friendly, conversational way.`
                }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      const botResponse = data.content
        .filter(item => item.type === 'text')
        .map(item => item.text)
        .join('\n');

      setMessages(prev => [...prev, {
        type: 'bot',
        text: botResponse,
        timestamp: new Date()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'bot',
        text: "I apologize, but I encountered an error while analyzing the image. Please try again with a clearer photo.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      setUploadedImage(null);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, {
      type: 'user',
      text: userMessage,
      timestamp: new Date()
    }]);

    setIsLoading(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: userMessage
            }
          ]
        })
      });

      const data = await response.json();
      const botResponse = data.content
        .filter(item => item.type === 'text')
        .map(item => item.text)
        .join('\n');

      setMessages(prev => [...prev, {
        type: 'bot',
        text: botResponse,
        timestamp: new Date()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'bot',
        text: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b-4 border-green-500">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <Bird className="w-8 h-8 text-blue-600" />
              <Leaf className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Nature Identifier</h1>
              <p className="text-sm text-gray-600">Your AI-powered bird & plant expert</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-2xl px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-800 shadow-md border border-gray-200'
                }`}
              >
                {message.image && (
                  <img
                    src={message.image}
                    alt="Uploaded"
                    className="rounded-lg mb-2 max-w-xs"
                  />
                )}
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>
                <p className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-4 py-3 shadow-md border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Analyzing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-end gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex items-center justify-center w-12 h-12 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              title="Upload image"
            >
              <Upload className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about any bird or plant..."
                disabled={isLoading}
                rows="1"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Upload a photo or describe what you'd like to know!
          </p>
        </div>
      </div>
    </div>
  );
}