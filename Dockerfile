FROM node:22.22.1-alpine

WORKDIR /workspace

# Match the repo's devEngines requirement so container installs behave the same way.
RUN npm install -g npm@9.2.0
