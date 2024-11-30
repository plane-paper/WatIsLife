#initializer
import speech_recognition as sr
#Dependent on PyAudio

def speechRecog (source):
    audio = r.listen(source)

    response = { #Response dict, refreshes each time
        "error": None,
        "transcription": None
    }

    print("Processing, please wait...")

    try:
        response["transcription"] = r.recognize_google(audio) #Google module because it works
    except sr.RequestError: #Basic request error
        raise Exception("API Error")
    except sr.UnknownValueError: #For some reason VR decides to throw error at this
        response["error"] = "Unable to recognize speech"

    return response

#Main
r = sr.Recognizer()
mic = sr.Microphone() #Dependent on pyaudio

while True: #Full loop
    print("Now Listening...")

    response = speechRecog(r, mic) #Page for a response

    if response["error"] == "Unable to recognize speech":
        print("I didn't catch that. Please try again.")

    elif response["transcription"] == "exit":
        break

    print(response["transcription"])