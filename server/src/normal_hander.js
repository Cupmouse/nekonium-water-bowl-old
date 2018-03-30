export default (request, response) => {
  console.log('Wow');
  response.writeHead(200, {'Content-Type': 'text/plain'});
  response.write('Hello nyanyan');
  response.end();
}
