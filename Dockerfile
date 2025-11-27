FROM n8nio/n8n

# Environment variables for Railway
ENV WEBHOOK_URL=https://twillo-production.up.railway.app
ENV N8N_BASIC_AUTH_ACTIVE=true
ENV N8N_BASIC_AUTH_USER=admin
ENV N8N_BASIC_AUTH_PASSWORD=mustafa123
ENV N8N_HOST=0.0.0.0
ENV N8N_PORT=5678

# Expose the port n8n runs on
EXPOSE 5678

# Start n8n
CMD ["n8n", "start"]
