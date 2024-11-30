import React, { useState, useRef, useEffect } from 'react';

const AudioRecorder = ({
  autorecord = true,
  maxrecord = 10000
}
) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);

  // Cleanup function to revoke object URLs
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioUrl]);


  useEffect(() => {
    if (autorecord) {
      startRecording();
    }
  }, [autorecord]);

  const startRecording = async () => {
    // Revoke previous audio URL if exists
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: 'audio/webm' 
      });
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
        // Ensure stream tracks are stopped
        stream.getTracks().forEach(track => track.stop());

        // Create audio blob and set it as source
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        
        // Revoke any existing object URL before creating a new one
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }

        const newAudioUrl = URL.createObjectURL(audioBlob);
        
        // Update state with new audio URL
        setAudioUrl(newAudioUrl);
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);

      if (maxrecord > 0){
        setTimeout(() => {
          if (mediaRecorderRef.current && 
            mediaRecorderRef.current.state === 'recording') {
            console.log("Ten seconds have passed");
            stopRecording();
          }
        }, maxrecord);
      }
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

  const handlePlaybackError = (e) => {
    console.error('Audio playback error:', e);
    alert('Unable to play audio. Check browser compatibility and audio format.');
  };

  return (
    <div>
      <h2>Audio Recorder</h2>
      
      <div>
        <button 
          onClick={startRecording} 
          disabled={isRecording}
        >
          Start Recording
        </button>
        
        <button 
          onClick={stopRecording} 
          disabled={!isRecording}
        >
          Stop Recording
        </button>
      </div>

      {audioUrl && (
        <div>
          <audio 
            key={audioUrl} // Force re-render of audio element
            ref={audioRef} 
            src={audioUrl}
            controls 
            onError={handlePlaybackError}
          >
            Your browser does not support the audio element.
          </audio>
          <div>
            Audio Format: WebM
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;