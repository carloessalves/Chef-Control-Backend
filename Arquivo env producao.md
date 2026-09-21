# Copy this file to `.env` and replace the placeholder with your real connection string.
# Connection string for PostgreSQL.
# Requires PostgreSQL >= 15.

DATABASE_URL="postgresql:postgresql://chef_sys_user:eIZeYLYoWCYAar3zaYvQv8BBZ70Lgr2T@dpg-dam5cv65vjqs73bqlnkg-a/chef_sys"
DIRECT_URL="postgresql:postgresql://chef_sys_user:eIZeYLYoWCYAar3zaYvQv8BBZ70Lgr2T@dpg-dam5cv65vjqs73bqlnkg-a/chef_sys"
JWT_SECRET="d5e8d64e2d8049ba23486adeb8d6532204848bd1a2149c16f778c02a445bb153"
JWT_ACCESS_EXPIRATION="2h"

NODE_ENV="production"
CORS_ORIGINS="https://chef-control-flutter.vercel.app"
