# TASK FROM REV9 FOR AHMED FAROOQ

Build a custom API Rate Limiter in NestJS to limit the number of requests a user can make to specific API endpoints. Use Redis for managing rate-limiting counters to ensure scalability in a distributed environment.

## Task Description 

### Rate-Limiting Rules
- Users are allowed:
- - 10 requests per minute for general endpoints.
- - 20 requests per minute for authenticated users.
- Exceeding the limit should return an HTTP 429 Too Many Requests error with a descriptive message
### Features
- Middleware to intercept incoming requests and enforce rate limits based on user identity (IP address for unauthenticated users, userId for authenticated users).
- Use Redis to store and update request counts in real-time.
- Return rate-limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset) in the response to indicate usage.
- Allow administrators to define different limits for specific routes.

## How to run
- Pull the repo and than enter following command.
``` $ yarn ```
- After installing dependencies, just run the following command.
``` $ yarn start:dev```