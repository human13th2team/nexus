import http from 'http';

const testUrl = (url) => {
  console.log(`Testing URL: ${url}`);
  http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Content-Type: ${res.headers['content-type']}`);
      console.log(`Response Prefix: ${data.substring(0, 100)}`);
      if (data.startsWith('<!DOCTYPE')) {
        console.log('ALERT: Received HTML instead of JSON!');
      }
    });
  }).on('error', (err) => {
    console.error(`Error: ${err.message}`);
  });
};

testUrl('http://localhost:8080/api/v1/board');
testUrl('http://localhost:8080/api/v1/board/top');
testUrl('http://localhost:8080/api/v1/comments/550e8400-e29b-41d4-a716-446655440000');
