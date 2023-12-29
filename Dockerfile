
FROM --platform=linux/amd64 node:18.2.0-alpine3.14 AS my-app-build

# FROM --platform=linux/arm64/v8 node:16.14.2-alpine3.14 AS my-app-build
# FROM --platform=linux/arm64 node:16.14.2-alpine3.14 AS my-app-build
# ENV PATH=/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:$PATH 


#RUN echo $PATH

ENV NODE_ENV=production

WORKDIR /usr/src/app 
COPY package.json package-lock.json ./
#COPY ["package.json", "package-lock.json*", "./"]
RUN npm install npm@10.2.2 --only=production 
#RUN npm install --production

COPY . ./
#COPY . .

RUN  npm run build -prod


FROM nginx:alpine

#RUN rm /etc/nginx/nginx.conf  /etc/nginx/conf.d/default.conf
COPY --from=my-app-build /usr/src/app/dist/ /usr/share/nginx/html/
COPY ConfNGINX /etc/nginx

# must be used when test on Docker and in Docker must select 8080/TCP and enter port 80xx
EXPOSE 8080

#VOLUME /usr/share/nginx/html
#VOLUME /etc/nginx

### Docker build command  
###            docker build -t xmvwebsite:latest .

### Docker run command
###            docker run -it --rm  --name cont_XMVWebSite -p 8082:8080 image_website:latest