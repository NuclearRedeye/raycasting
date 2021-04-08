
PROJECT := $(notdir $(CURDIR))
NODE_VERSION ?= erbium
PORT ?= 8080

# Source files that when changed should trigger a rebuild.
SOURCES  := $(shell find ./src/ts/ -type f -name *.ts)

# Targets that don't result in output of the same name.
.PHONY: clean \
        distclean \
				build \
				lint \
				format \
				test \
				debug \
				release

# When no target is specified, the default target to run.
.DEFAULT_GOAL := debug

# Target that cleans build output and local dependencies.
distclean: clean
	@rm -rf node_modules

# Target that cleans build output
clean:
	@rm -rf dist

# Target to install Node.js dependencies.
node_modules: package.json
	@docker run -it --rm -v $(CURDIR):/$(PROJECT):rw -w=/$(PROJECT) node:$(NODE_VERSION) npm install
	@touch node_modules

# Target to create the output directories.
dist/debug dist/release:
	@mkdir -p $(CURDIR)/$@

# Target that creates the specified HTML file by copying it from the src directory.
%.html:
	@cp $(CURDIR)/src/html/$(@F) $@

# Target that creates the specified CSS file by copying it from the src directory.
%.css:
	@cp $(CURDIR)/src/css/$(@F) $@

# Target that creates the assets by copying them from the src directory.
dist/debug/assets dist/release/assets:
	@cp -r $(CURDIR)/src/assets/ $@

# Target that compiles TypeScript to JavaScript.
dist/debug/index.js: node_modules dist/debug $(SOURCES)
	@docker run -it --rm -v $(CURDIR):/$(PROJECT):rw -w=/$(PROJECT) node:$(NODE_VERSION) ./node_modules/.bin/tsc

# Target that bundles, treeshakes and minifies the JavaScript.
dist/release/index.js: dist/release dist/debug/index.js
	@docker run -it --rm -v $(CURDIR):/$(PROJECT):rw -w=/$(PROJECT) node:$(NODE_VERSION) ./node_modules/.bin/rollup ./dist/debug/index.js --file $@ && ./node_modules/.bin/terser -c -m -o $@ $@

# Target that builds all files for both debug and release.
build: dist/debug dist/debug/index.html dist/debug/index.css dist/debug/index.js dist/debug/assets dist/release dist/release/index.html dist/release/index.css dist/release/index.js dist/release/assets

# Target that checks the code for style/formating issues.
format:
	@docker run -it --rm -v $(CURDIR):/$(PROJECT):rw -w=/$(PROJECT) node:$(NODE_VERSION) ./node_modules/.bin/prettier --check "src/**/*.ts"

# Target that lints the code for errors.
lint:
	@docker run -it --rm -v $(CURDIR):/$(PROJECT):rw -w=/$(PROJECT) node:$(NODE_VERSION) ./node_modules/.bin/eslint

# Target to run all unit tests.
test:
	@docker run -it --rm -v $(CURDIR):/$(PROJECT):rw -w=/$(PROJECT) node:$(NODE_VERSION) ./node_modules/.bin/jest

# Target that builds and runs a debug instance of the project.
debug: build
	@docker run --rm --name $(PROJECT) -p $(PORT):80 -v $(CURDIR)/dist/debug:/usr/share/nginx/html/:ro nginx:alpine

# Target that builds and runs a release instance of the project.
release: build
	@docker run --rm --name $(PROJECT) -p $(PORT):80 -v $(CURDIR)/dist/release:/usr/share/nginx/html/:ro nginx:alpine