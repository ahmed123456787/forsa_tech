import requests
import json

def chat_with_llm(messages, api_key, model="deepseek-v3.1", stream=False):
    """Send chat messages to LLM API using requests"""
    
    url = "https://api.modelarts-maas.com/v2/chat/completions"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    data = {
        "messages": messages,
        "model": model,
        "stream": stream
    }
    
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.json()}")
        return None

# Example usage
api_key = "01Gu-xIiEQJWwuikkIdaPSSViTJLBpiUN9erLplVzCDJPErt8Qz8EcQ_t3YtzerzjpZ1wTNqof74JIYOfGBrqA"

# Single message
messages = [
    {"role": "user", "content": "Who are you?"}
]

response = chat_with_llm(messages, api_key)
if response:
    print(response["choices"][0]["message"]["content"])

# # Multi-turn conversation
# conversation_history = [
#     {"role": "system", "content": "You are a helpful assistant."},
#     {"role": "user", "content": "Hello!"},
#     {"role": "assistant", "content": "Hi! How can I help you today?"},
#     {"role": "user", "content": "What can you do?"}
# ]

# response = chat_with_llm(conversation_history, api_key)
# if response:
#     print(response["choices"][0]["message"]["content"])