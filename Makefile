
PROJECT := $(notdir $(CURDIR))
NODE_VERSION ?= erbium
PORT ?= 8080

# Source files that when changed should trigger a rebuild.
TS     := $(shell find ./src/ -type f -name *.ts)
SASS   := $(shell find ./src/ -type f -name *.scss)
HTML   := $(shell find ./src/ -type f -name *.html)

# Targets that don't result in output of the same name.
.PHONY: clean \
        distclean \
				lint \
				format \
				test \
				debug \
				release \
				start

# When no target is specified, the default target to run.
.DEFAULT_GOAL := start

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
	@echo "Creating $@"
	@mkdir -p $(CURDIR)/$@

# Target that creates the specified HTML file by copying it from the src directory.
%.html:
	@echo "Creating $@"
	@cp $(CURDIR)/src/html/$(@F) $@

# Target that creates the assets by copying them from the src directory.
dist/debug/assets dist/release/assets:
	@echo "Creating $@"
	@cp -r $(CURDIR)/src/assets/ $@

# Target that compiles TypeScript to JavaScript.
dist/debug/index.js: node_modules dist/debug tsconfig.json $(TS)
	@echo "Creating $@"
	@docker run -it --rm -v $(CURDIR):/$(PROJECT):rw -w=/$(PROJECT) node:$(NODE_VERSION) npx tsc

# Target that compiles SCSS to CSS.
dist/debug/index.css: node_modules dist/debug $(SASS)
	@echo "Creating $@"
	@docker run -it --rm -v $(CURDIR):/$(PROJECT):rw -w=/$(PROJECT) node:$(NODE_VERSION) npx sass ./src/scss/index.scss $@

# Target that bundles, treeshakes and minifies the JavaScript.
dist/release/index.js: dist/release dist/debug/index.js
	@echo "Creating $@"
	@docker run -it --rm -v $(CURDIR):/$(PROJECT):rw -w=/$(PROJECT) node:$(NODE_VERSION) npx rollup ./dist/debug/index.js --file $@ && ./node_modules/.bin/terser -c -m -o $@ $@

# Target that compiles SCSS to CSS.
dist/release/index.css: node_modules dist/release $(SASS)
	@echo "Creating $@"
	@docker run -it --rm -v $(CURDIR):/$(PROJECT):rw -w=/$(PROJECT) node:$(NODE_VERSION) npx sass --no-source-map ./src/scss/index.scss $@

# Target that checks the code for style/formating issues.
format: node_modules
	@echo "Creating $@"
	@docker run -it --rm -v $(CURDIR):/$(PROJECT):rw -w=/$(PROJECT) node:$(NODE_VERSION) npx prettier --check "src/**/*.ts"

# Target that lints the code for errors.
lint: node_modules
	@echo "Creating $@"
	@docker run -it --rm -v $(CURDIR):/$(PROJECT):rw -w=/$(PROJECT) node:$(NODE_VERSION) npx eslint

# Target to run all unit tests.
test: node_modules
	@echo "Creating $@"
	@docker run -it --rm -v $(CURDIR):/$(PROJECT):rw -w=/$(PROJECT) node:$(NODE_VERSION) npx jest

# Target that builds a debug/development version of the app
debug: dist/debug dist/debug/index.html dist/debug/index.css dist/debug/index.js dist/debug/assets

# Target that builds a release version of the app
release: dist/release dist/release/index.html dist/release/index.css dist/release/index.js dist/release/assets

# Target that builds and runs a debug instance of the project.
start: debug
	@docker run --rm --name $(PROJECT) -p $(PORT):80 -v $(CURDIR)/dist/debug:/usr/share/nginx/html/:ro nginx:alpine