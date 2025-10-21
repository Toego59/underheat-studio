# Use the official nginx image as a base
FROM nginx:alpine

# Copy website files to nginx html directory
COPY . /usr/share/nginx/html

# Expose port 80 for web traffic
EXPOSE 80

# Start nginx when the container runs
CMD ["nginx", "-g", "daemon off;"]
