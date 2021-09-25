## AIAA at UTD Officer Website API

### Technology Stack
* Framework: ExpressJS (minimalist) on NodeJS
* Languages
   * Primarily JavaScript (JS) with CommonJS module specification on NodeJS
* Important Libraries
   * aws-sdk: for AWS S3 bucket file operation
   * cors: Cross-Origin Resource Sharing allows BE to provide responses to trusted host URLs
   * jsonwebtoken: constructs and validates tokens
   * mongodb: MongoDB NoSQL database NodeJS driver
* Important Middlewares
   * `errorMiddleware` is used to catch any errors thrown within the wrapped function argument and respond with a corresponding error code and message
   * `authenticateUserToken` is used to authenticate user with token from their credentials (cookies) before doing any operation

### Code Format Standard
* Fortunately, thank to prettier and eslint, you can code in any format you like and others will see the code formatted by prettier based on existing rules. If you have not had prettier and eslint installed on vscode, please do so because it helps identify errors and warnings in the code.
* **Husky** will always do a pre-commit check on changed files over syntax errors and code format inconsistencies and automatically correct the code format. If it sees any syntax errors, the git commit will fail.

### Pipeline
* Use Heroku auto build service, which grabs the code directly from GitHub and builds based on the Dockerfile
* Use Docker to specify the build procedure.
* The web app is now deployed on a Nginx server with public URL http://aiaautd-mongodb-adapter.herokuapp.com/
* The free server on which the API is deployed will sleep after 30min inactivity.

### Debugging
* Notice that the /constants/cors-config.js file contains a whitelist of trusted host URLs, from whom the requests are received. If a untrusted host sends a request to the API, a CORS error will be returned.
* Run `npm run debug` in your debugger to debug locally. For example, in vscode, go to the debug tab and select `Run Scripts: debug` to kick off the debugger.
* The line `===MongoDB connected===` on the terminal or console indicates the server connection successfully establishes, and any error thrown during the starting of the app will be shown in the debug console and will trigger a failure.

### Useful Commands
We use the **NPM** to keep track of dependencies (in `package.json`) and the dependency tree (in `package-lock.json`). You must have NodeJS installed as a prerequisite.
To install all dependencies without update (preserving the integrity of the package-lock.json file), run
```
npm ci
```
To install all dependencies with possible update (not preferred if package-lock.json is present), run
```
npm install
```
To start the app, run in the project root directory
```
npm start
```
To add a new module, run
```
npm install <module>
```
To add a new dev module (which will not be built during production), run with --save-dev flag
```
npm install --save-dev <dev_module>
```
To remove an existing package, run
```
npm uninstall <package>
```
To remove an existing dev package, run
```
npm uninstall --save-dev <dev_package>
```