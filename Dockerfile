FROM nginx:stable-alpine

# Use a directory for our site and static assets
WORKDIR /usr/share/nginx/html

# Copy site files into nginx wwwroot
COPY . /usr/share/nginx/html

# Copy nginx config
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint script
COPY docker/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
