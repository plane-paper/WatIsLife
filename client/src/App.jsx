import AudioRecorder from './components';

function App() {
  const handleProcessingComplete = (data) => {
    console.log('Processing results:', data);
    // Handle the response data here
  };

  return (
    <div>
      <h1>Audio Processing App</h1>
      <AudioRecorder 
        autorecord={false}
        maxrecord={10000}
        onProcessingComplete={handleProcessingComplete}
      />
    </div>
  );
}

export default App;
