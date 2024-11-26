
FROM --platform=linux/amd64 node:22.0-alpine3.19 AS my-app-build
##FROM --platform=linux/amd64 node:22.0-slim AS my-app-build

# FROM --platform=linux/arm64/v8 node:16.14.2-alpine3.14 AS my-app-build
# FROM --platform=linux/arm64 node:16.14.2-alpine3.14 AS my-app-build
# ENV PATH=/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:$PATH 


#RUN echo $PATH

ENV NODE_ENV=production

WORKDIR /usr/src/app 
COPY package.json  ./
#COPY ["package.json", "package-lock.json*", "./"]
## 10.8.4

RUN npm install npm@10.9.1 --legacy-peer-deps --omit=dev
##  --only=production 
## RUN npm install npm@10.9.1 @esbuild/linux-x64 --omit=dev
#RUN npm install --production

##RUN npm audit fix 
COPY . ./
#COPY . .


## -prod
RUN  npm run build --omit=dev


FROM nginx:alpine

#RUN rm /etc/nginx/nginx.conf  /etc/nginx/conf.d/default.conf
COPY --from=my-app-build /usr/src/app/dist/browser/ /usr/share/nginx/html/
COPY ConfNGINX /etc/nginx

# must be used when test on Docker and in Docker must select 8080/TCP and enter port 80xx
EXPOSE 8080

#VOLUME /usr/share/nginx/html
#VOLUME /etc/nginx

### Docker build command  
###            docker build -t xmvwebsite:latest .

### Docker run command
###            docker run -it --rm  --name cont_XMVWebSite -p 8082:8080 image_website:latest