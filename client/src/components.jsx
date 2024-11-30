import React, { useState, useRef } from 'react';

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);

  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Initialize audio chunks
      const chunks = [];
      
      // Event listeners for recording
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Create audio blob and set it as source
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
        }
        
        // Update state
        setAudioChunks(chunks);
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-4 space-y-4">
      <h2 className="text-xl font-bold">Audio Recorder</h2>
      
      <div className="flex space-x-4 items-center">
        <button 
          onClick={startRecording} 
          disabled={isRecording}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-green-300"
        >
          Start Recording
        </button>
        
        <button 
          onClick={stopRecording} 
          disabled={!isRecording}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-red-300"
        >
          Stop Recording
        </button>
      </div>

      {audioChunks.length > 0 && (
        <div className="mt-4 w-full">
          <audio 
            ref={audioRef} 
            controls 
            className="w-full"
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;