#initializer
from flask import Blueprint, jsonify, request
import speech_recognition as sr
import os
#Dependent on PyAudio

speech_bp = Blueprint('speech_bp', __name__) # router name 

@speech_bp.route('/api/process', methods = ['POST']) # route for processing audio 
def recognize():
    if request.method == 'POST': 
        if 'audio' not in request.files:
            return jsonify({"Error": "No audio file found"}), 400
        audio_file = request.files['audio'] #Maybe add a validation here?

        response = { #Response dict, refreshes each time
            "error": None,
            "count": 0
        }

        transcription = ""

        try:
            r = sr.Recognizer()

            path = os.path.join('/temp', audio_file.filename)
            audio_file.save(path)

            with sr.AudioFile(path) as source:
                r.adjust_for_ambient_noise(source)
                audio = r.record(source)


            try:
                transcription = r.recognize_google(audio) #Google module because it works
            except sr.RequestError: #Basic request error
                response["error"] = "API Error"
            except sr.UnknownValueError: #For some reason VR decides to throw error at this
                response["error"] = "Cannot recognize speech"

            os.remove(path) #Optional cleanup

            if response["error"]:
                return jsonify(response), 400
            
            response["count"] = transcription.count("kill myself") + transcription.count("jump off E7")


            return jsonify(response)


        except Exception as e:
            return jsonify({"Error": str(e)}), 500