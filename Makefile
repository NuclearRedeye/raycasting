
PROJECT := $(notdir $(CURDIR))
NODE_VERSION ?= erbium
PORT ?= 8080
TAG  ?= local

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

# Cleans build output and local dependencies
distclean: clean
	@rm -rf node_modules

# Cleans build output
clean:
	@rm -rf dist

# Install Node.js dependencies if either, the node_modules directory is not present or package.json has changed.
node_modules: package.json
	@docker run -it --rm -v $(CURDIR):/$(PROJECT):rw -w=/$(PROJECT) node:$(NODE_VERSION) npm install
	@touch node_modules

dist/debug dist/release:
	@mkdir -p $(CURDIR)/$@

%.html:
	@cp $(CURDIR)/src/html/$(@F) $@

%.css:
	@cp $(CURDIR)/src/css/$(@F) $@

dist/debug/assets dist/release/assets:
	@cp -r $(CURDIR)/src/assets/ $@

dist/debug/index.js: node_modules dist/debug $(SOURCES)
	@docker run -it --rm -v $(CURDIR):/$(PROJECT):rw -w=/$(PROJECT) node:$(NODE_VERSION) ./node_modules/.bin/tsc

dist/release/index.js: dist/release dist/debug/index.js
	@docker run -it --rm -v $(CURDIR):/$(PROJECT):rw -w=/$(PROJECT) node:$(NODE_VERSION) ./node_modules/.bin/rollup ./dist/debug/index.js --file $@ && ./node_modules/.bin/terser -c -m -o $@ $@

build: dist/debug dist/debug/index.html dist/debug/index.css dist/debug/index.js dist/debug/assets

format:
	@docker run -it --rm -v $(CURDIR):/$(PROJECT):rw -w=/$(PROJECT) node:$(NODE_VERSION) ./node_modules/.bin/prettier --check "src/**/*.ts"

lint:
	@docker run -it --rm -v $(CURDIR):/$(PROJECT):rw -w=/$(PROJECT) node:$(NODE_VERSION) ./node_modules/.bin/eslint

test:
	@docker run -it --rm -v $(CURDIR):/$(PROJECT):rw -w=/$(PROJECT) node:$(NODE_VERSION) ./node_modules/.bin/jest

debug: build
	@docker run --rm --name $(PROJECT) -p $(PORT):80 -v $(CURDIR)/dist/debug:/usr/share/nginx/html/:ro nginx:alpine

release: dist/release dist/release/index.html dist/release/index.css dist/release/index.js dist/release/assets
	docker build -t $(PROJECT):$(TAG) .