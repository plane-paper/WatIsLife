const express = require('express'); 
const app = express(); 
require('dotenv').config();
let port = process.env.PORT; 

app.listen(port, 'localhost', () => {
    console.log('Server started on port ' + port); 
}); 

