
PROJECT := $(notdir $(CURDIR))
NODE_VERSION ?= erbium
PORT ?= 8080

# Source files that when changed should trigger a rebuild.
SOURCES := $(wildcard ./src/*.ts) \
           $(wildcard ./src/utils/*.ts)

# Targets that don't result in output of the same name.
.PHONY: start \
        clean \
        distclean

# When no target is specified, the default target to run.
.DEFAULT_GOAL := start

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

dist: node_modules $(SOURCES)
	@mkdir -p $(CURDIR)/dist
	@docker run -it --rm -v $(CURDIR):/$(PROJECT):rw -w=/$(PROJECT) node:$(NODE_VERSION) npm run build

start: dist
	@docker run -it --rm -p $(PORT):8080 -v $(CURDIR):/$(PROJECT):ro -w=/$(PROJECT) node:$(NODE_VERSION) npm run debug
#	@docker run --rm --name $(PROJECT) -p $(PORT):80 -v $(CURDIR)/dist/debug:/usr/share/nginx/html/:ro nginx:alpine

.PHONY: test
test:
	@echo $(SOURCES)