FROM nginx:1.25-alpine

# Copy NGINX config
COPY nginx.conf /etc/nginx/nginx.conf

# We assume certs are mounted as volumes in production or docker-compose
# For local dev, we copy the generated certs
COPY certs/ /etc/nginx/certs/

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
