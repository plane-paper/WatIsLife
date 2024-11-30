const port = process.env.PORT
const express = require('express'); 
const app = express(); 

app.listen(port, 'localhost', () => {
    console.log('Server started on port ' + port); 
}); 

