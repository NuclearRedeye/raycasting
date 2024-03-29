# Ray Casting

A simple ray casting engine built using [TypeScript](https://www.typescriptlang.org/).

## Prerequisites

* You have a Linux or OSX machine. Windows should be supported via WSL 2 but has not been tested.
* You have installed a recent version of [GNU Make](https://www.gnu.org/software/make/).
* You have installed a recent version of [Docker](https://www.docker.com/).

## Quick Start

You can get up and running quickly with...

```
make
```

Then open http://localhost:8080 in your browser.

You can also package the application into a docker container...

```
make release
docker build -t raycasting:local .
docker run -p 8080:80 raycasting:local
```

And again, then open http://localhost:8080 in your browser.

## License

Licensed under [MIT](https://choosealicense.com/licenses/mit/).