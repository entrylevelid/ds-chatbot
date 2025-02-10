from flask import Flask, render_template, request, Response, copy_current_request_context
import ollama
import json
import traceback
from functools import wraps

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    if not request.is_json:
        return jsonify({'status': 'error', 'message': 'Content-Type must be application/json'}), 400
    
    user_message = request.json.get('message')
    if not user_message:
        return jsonify({'status': 'error', 'message': 'Message is required'}), 400

    def generate():
        try:
            print(f"Received message: {user_message}") 
            
            yield f"data: {json.dumps({'status': 'start'})}\n\n"
            
            stream = ollama.chat(
                model='deepseek-r1:14b',
                messages=[{'role': 'user', 'content': user_message}],
                stream=True
            )
            
            print("Stream created successfully")
            
            for chunk in stream:
                if 'message' in chunk and 'content' in chunk['message']:
                    content = chunk['message']['content']
                    print(f"Sending chunk: {content}") 
                    yield f"data: {json.dumps({'status': 'chunk', 'content': content})}\n\n"
            
            print("Stream completed") 
            yield f"data: {json.dumps({'status': 'done'})}\n\n"
                
        except Exception as e:
            print(f"Error occurred: {str(e)}")
            print(traceback.format_exc())
            error_response = {
                'status': 'error',
                'message': str(e),
                'type': type(e).__name__
            }
            yield f"data: {json.dumps(error_response)}\n\n"

    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no'
        }
    )

if __name__ == '__main__':
    try:
        print("Testing ollama connection...")
        ollama.chat(
            model='deepseek-r1:14b',
            messages=[{'role': 'user', 'content': 'test'}],
            stream=False
        )
        print("Ollama connection successful")
    except Exception as e:
        print(f"Warning: Could not connect to ollama: {str(e)}")
    
    app.run(debug=True)