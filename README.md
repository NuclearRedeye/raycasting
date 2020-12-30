# Ray Casting

Experiment in rendering using ray casting implemented in TypeScript and HTML.

# Getting Started

You can get up and running quickly with...

```
npm install
npm start
```
Then open http://localhost:5000 in your browser.

Or, if you are using [Visual Studio Code](https://code.visualstudio.com/) then the included config means you can simply hit F5 to get going.

# Docker

You can also package the entire application in a docker container, ready to deploy.

```
npm run build
docker build . -t raycasting:dev
docker run -p 8080:80 raycasting:dev
```

Then open http://localhost:8080 in your browser.