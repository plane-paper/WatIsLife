#initializer
from flask import Blueprint, jsonify, request
import speech_recognition as sr
import os
#Dependent on PyAudio

speech_bp = Blueprint('speech_bp', __name__) # router name 

@speech_bp.route('/api/process', methods = ['POST']) # route for processing audio 
@speech_bp.route('/api/process', methods=['POST'])
def recognize():
    print("Received request")  # Debug log
    
    if request.method == 'POST':
        print("Request files:", request.files)  # Debug log
        
        if 'audio' not in request.files:
            print("No audio file in request")  # Debug log
            return jsonify({"error": "No audio file found"}), 400
            
        audio_file = request.files['audio']
        if not audio_file.filename:
            return jsonify({"error": "Empty filename"}), 400
            
        print(f"Received file: {audio_file.filename}")  # Debug log
        print(f"File content type: {audio_file.content_type}")  # Debug log

        try:
            # Use a temporary file with proper extension
            import tempfile
            with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
                audio_file.save(temp_audio.name)
                print(f"Saved to temporary file: {temp_audio.name}")  # Debug log
                
                r = sr.Recognizer()
                with sr.AudioFile(temp_audio.name) as source:
                    print("Reading audio file")  # Debug log
                    audio = r.record(source)
                    
                print("Attempting speech recognition")  # Debug log
                try:
                    transcription = r.recognize_google(audio)
                    print(f"Transcription successful: {transcription}")  # Debug log
                except sr.RequestError as e:
                    print(f"Google API error: {str(e)}")  # Debug log
                    return jsonify({"error": f"API Error: {str(e)}"}), 400
                except sr.UnknownValueError as e:
                    print("Could not understand audio")  # Debug log
                    return jsonify({"error": "Cannot recognize speech"}), 400
                    
                # Clean up
                os.unlink(temp_audio.name)
                
                return jsonify({
                    "error": None,
                    "transcription": transcription,
                    "count": transcription.count("kill myself") + transcription.count("jump off E7")
                })

        except Exception as e:
            import traceback
            print(f"Error processing audio: {str(e)}")  # Debug log
            print(traceback.format_exc())  # Full stack trace
            return jsonify({"error": f"Processing error: {str(e)}"}), 500

    return jsonify({"error": "Invalid method"}), 405