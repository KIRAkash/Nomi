# The web front end: the landing (apps/site) at / and the Expo web export (apps/app) on its own routes, served by nginx.
# Built from a staging folder that deploy/gcp.sh fills with both builds, so the image holds only static files.
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY app/ /usr/share/nginx/html/
COPY site/ /usr/share/nginx/html/site/
