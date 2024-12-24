import React, { useState, useRef, useEffect } from 'react';

const convertToWav = async (audioBlob) => {
  // Create an audio context
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Convert blob to array buffer
  const arrayBuffer = await audioBlob.arrayBuffer();
  
  // Decode the audio
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  // Create offline context for rendering
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  
  // Create buffer source
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineContext.destination);
  source.start();
  
  // Render to buffer
  const renderedBuffer = await offlineContext.startRendering();
  
  // Convert to WAV
  const wavBlob = await new Promise(resolve => {
    const length = renderedBuffer.length * 2;
    const channels = renderedBuffer.numberOfChannels;
    const sampleRate = renderedBuffer.sampleRate;
    
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);
    
    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, length, true);
    
    // Write audio data
    const data = new Float32Array(renderedBuffer.getChannelData(0));
    let offset = 44;
    for (let i = 0; i < data.length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
    
    resolve(new Blob([buffer], { type: 'audio/wav' }));
  });
  
  return wavBlob;
};

// Helper function for WAV header
const writeString = (view, offset, string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

const AudioRecorder = ({
  autorecord = true,
  maxrecord = 10000,
  onProcessingComplete = (data) => console.log(data)
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);

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
    setError(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: 'audio/webm' 
      });
      mediaRecorderRef.current = mediaRecorder;

      const chunks = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }

        const newAudioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(newAudioUrl);

        // Process the audio through the backend
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);

      if (maxrecord > 0) {
        setTimeout(() => {
          if (mediaRecorderRef.current?.state === 'recording') {
            stopRecording();
          }
        }, maxrecord);
      }
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  const processAudio = async (audioBlob) => {
    setIsProcessing(true);
    setError(null);
  
    try {
      const wavBlob = await convertToWav(audioBlob);
      console.log("Converted to WAV:", wavBlob.size, wavBlob.type);
  
      // Create form data with explicit filename
      const formData = new FormData();
      formData.append('audio', wavBlob, 'recording.wav');
  
      const response = await fetch('http://localhost:2600/api/process', {
        method: 'POST',
        // Don't set Content-Type header - let the browser set it with the boundary
        body: formData
      });
  
      console.log("Response status:", response.status);
      
      // Try to get response body even if status is 500
      const text = await response.text();
      console.log("Raw response:", text);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
        throw new Error("Invalid response from server");
      }
  
      if (!response.ok) {
        throw new Error(data.error || 'Server error');
      }
  
      onProcessingComplete(data);
    } catch (error) {
      console.error('Error processing audio:', error);
      setError(error.message || 'Failed to process audio');
    } finally {
      setIsProcessing(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Audio Recorder</h2>
      
      <div className="space-x-4 mb-4">
        <button 
          onClick={startRecording} 
          disabled={isRecording || isProcessing}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          {isProcessing ? 'Processing...' : 'Start Recording'}
        </button>
        
        <button 
          onClick={stopRecording} 
          disabled={!isRecording || isProcessing}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
        >
          Stop Recording
        </button>
      </div>

      {error && (
        <div className="text-red-500 mb-4">
          {error}
        </div>
      )}

      {audioUrl && (
        <div className="space-y-2">
          <audio 
            key={audioUrl}
            ref={audioRef} 
            src={audioUrl}
            controls 
            className="w-full"
          >
            Your browser does not support the audio element.
          </audio>
          <div className="text-sm text-gray-600">
            Audio Format: WebM
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;