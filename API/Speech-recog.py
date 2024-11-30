#initializer
import speech_recognition as sr
from flask import Flask, jsonify, request
import os
#Dependent on PyAudio

#Flask setup
app = Flask(__name__)

@app.route('/')
def main():
    return 'WatIsLife'


@app.route('/api/recognize', methods=['POST'])
def recognize():
    if 'audio' not in request.files:
        return jsonify({"Error": "No audio file found"}), 400
    audio_file = request.files['audio'] #Maybe add a validation here?

    response = { #Response dict, refreshes each time
        "error": None,
        "transcription": None
    }

    try:
        r = sr.Recognizer()

        path = os.path.join('/temp', audio_file.filename)
        audio_file.save(path)

        with sr.AudioFile(path) as source:
            r.adjust_for_ambient_noise(source)
            audio = r.record(source)


        try:
            response["transcription"] = r.recognize_google(audio) #Google module because it works
        except sr.RequestError: #Basic request error
            response["error"] = "API Error"
        except sr.UnknownValueError: #For some reason VR decides to throw error at this
            response["error"] = "Cannot recognize speech"

        os.remove(path) #Optional cleanup

        if response["error"]:
            return jsonify(response), 400
        return jsonify(response)


    except Exception as e:
        return jsonify({"Error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=2600)